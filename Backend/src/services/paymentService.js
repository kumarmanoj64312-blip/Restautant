import crypto from "crypto";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import { isRazorpayConfigured } from "../config/razorpay.js";
import { hasPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";
import {
    ROLES,
    PAYMENT_STATUS,
    PAYMENT_METHOD,
    POS_PAYMENT_METHOD,
} from "../constants/roles.js";

// Payments settled in person (cash on delivery or at the POS counter)
const IN_PERSON_METHODS = [
    PAYMENT_METHOD.COD,
    ...Object.values(POS_PAYMENT_METHOD),
];

const escapeRegex = (text) =>
    String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "A,B" or ["A","B"] -> ["A","B"], keeping only allowed values
const parseList = (value, allowed) =>
    String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => allowed.includes(item));

class PaymentService {
    // Staff who may see all payments
    isStaff(user) {
        return hasPermission(user, PERMISSIONS.PAYMENTS_READ);
    }

    // Staff who may change payments
    canManage(user) {
        return hasPermission(user, PERMISSIONS.PAYMENTS_UPDATE);
    }

    canRefund(user) {
        return hasPermission(user, PERMISSIONS.PAYMENTS_REFUND);
    }

    checkPaymentAccess(payment, user) {
        if (!user) {
            throw ApiError.unauthorized("Please login to continue.");
        }

        const isOwner =
            payment.user?.toString() === user._id.toString();

        if (!isOwner && !this.isStaff(user)) {
            throw ApiError.forbidden(
                "You do not have permission to access this payment."
            );
        }
    }

    async createPayment(data, userId) {
        const { order: orderId, paymentMethod } = data;

        if (!orderId || !paymentMethod) {
            throw ApiError.badRequest(
                "Order and payment method are required."
            );
        }

        const allowedMethods = [
            PAYMENT_METHOD.COD,
            "Razorpay",
        ];

        if (!allowedMethods.includes(paymentMethod)) {
            throw ApiError.badRequest(
                "Unsupported payment method."
            );
        }

        const orderData = await Order.findById(orderId);

        if (!orderData) {
            throw ApiError.notFound("Order not found.");
        }

        if (orderData.user.toString() !== userId.toString()) {
            throw ApiError.forbidden(
                "You cannot pay for this order."
            );
        }

        if (orderData.orderStatus === "Cancelled") {
            throw ApiError.badRequest(
                "Cancelled orders cannot be paid."
            );
        }

        if (orderData.paymentStatus === "Paid") {
            throw ApiError.badRequest(
                "This order has already been paid."
            );
        }

        const amount = Number(orderData.totalAmount);

        if (!Number.isFinite(amount) || amount <= 0) {
            throw ApiError.badRequest(
                "Order total must be greater than zero."
            );
        }

        const existingPayment = await Payment.findOne({
            order: orderId,
            user: userId,
            paymentMethod,
            paymentStatus: PAYMENT_STATUS.PENDING,
        });

        if (existingPayment) {
            return {
                ...existingPayment.toObject(),
                razorpayKeyId:
                    paymentMethod === "Razorpay"
                        ? process.env.RAZORPAY_KEY_ID || ""
                        : "",
            };
        }

        let razorpayOrderId = "";

        if (paymentMethod === "Razorpay") {
            if (!isRazorpayConfigured()) {
                throw ApiError.badRequest(
                    "Online payment is not available right now. Please choose Cash on Delivery."
                );
            }

            const response = await fetch(
                "https://api.razorpay.com/v1/orders",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Basic ${Buffer.from(
                            `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
                        ).toString("base64")}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        amount: Math.round(amount * 100),
                        currency: "INR",
                        receipt: orderId.toString(),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                // 401 = wrong keys: a server setup problem, not the customer's
                if (response.status === 401) {
                    console.error(
                        "Razorpay rejected the API keys. Check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env."
                    );

                    throw ApiError.badRequest(
                        "Online payment is not available right now. Please choose Cash on Delivery."
                    );
                }

                throw ApiError.badRequest(
                    result.error?.description ||
                        "Unable to create Razorpay order."
                );
            }

            razorpayOrderId = result.id;
        }

        const payment = await Payment.create({
            order: orderId,
            user: userId,
            amount,
            paymentMethod,
            razorpayOrderId,
            paymentStatus: PAYMENT_STATUS.PENDING,
        });

        return {
            ...payment.toObject(),
            razorpayKeyId:
                paymentMethod === "Razorpay"
                    ? process.env.RAZORPAY_KEY_ID || ""
                    : "",
        };
    }

    async verifyCashOnDelivery(paymentId, user) {
        if (!this.canManage(user)) {
            throw ApiError.forbidden(
                "Only authorized staff can verify cash payments."
            );
        }

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            throw ApiError.notFound("Payment not found.");
        }

        if (!IN_PERSON_METHODS.includes(payment.paymentMethod)) {
            throw ApiError.badRequest(
                "Only cash on delivery or counter payments can be marked as received."
            );
        }

        if (payment.paymentStatus === PAYMENT_STATUS.SUCCESS) {
            return payment;
        }

        if (payment.paymentStatus !== PAYMENT_STATUS.PENDING) {
            throw ApiError.badRequest(
                "This payment cannot be verified."
            );
        }

        const order = await Order.findById(payment.order);

        if (!order) {
            throw ApiError.notFound("Order not found.");
        }

        if (order.orderStatus === "Cancelled") {
            throw ApiError.badRequest(
                "A cancelled order cannot be paid."
            );
        }

        // Call this only after cash has actually been received.
        payment.paymentStatus = PAYMENT_STATUS.SUCCESS;
        payment.paidAt = new Date();

        await payment.save();

        order.paymentStatus = "Paid";
        await order.save();

        return payment;
    }

    async verifyRazorpayPayment(data, user) {
        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        } = data;

        if (
            !razorpayOrderId ||
            !razorpayPaymentId ||
            !razorpaySignature
        ) {
            throw ApiError.badRequest(
                "Razorpay payment details are required."
            );
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            throw ApiError.internal(
                "Razorpay is not configured on the server."
            );
        }

        const payment = await Payment.findOne({
            razorpayOrderId,
        });

        if (!payment) {
            throw ApiError.notFound("Payment not found.");
        }

        this.checkPaymentAccess(payment, user);

        if (payment.paymentStatus === PAYMENT_STATUS.SUCCESS) {
            return payment;
        }

        if (payment.paymentStatus !== PAYMENT_STATUS.PENDING) {
            throw ApiError.badRequest(
                "This payment cannot be verified."
            );
        }

        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest();

        let receivedSignature;

        try {
            receivedSignature = Buffer.from(
                razorpaySignature,
                "hex"
            );
        } catch {
            throw ApiError.badRequest(
                "Invalid payment signature."
            );
        }

        if (
            receivedSignature.length !== generatedSignature.length ||
            !crypto.timingSafeEqual(
                generatedSignature,
                receivedSignature
            )
        ) {
            throw ApiError.badRequest(
                "Invalid payment signature."
            );
        }

        const order = await Order.findById(payment.order);

        if (!order) {
            throw ApiError.notFound("Order not found.");
        }

        if (order.orderStatus === "Cancelled") {
            throw ApiError.badRequest(
                "Cancelled orders cannot be paid."
            );
        }

        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpaySignature = razorpaySignature;
        payment.paymentStatus = PAYMENT_STATUS.SUCCESS;
        payment.paidAt = new Date();

        await payment.save();

        order.paymentStatus = "Paid";
        await order.save();

        return payment;
    }

    async updatePaymentStatus(
        paymentId,
        paymentStatus,
        user
    ) {
        if (!this.canManage(user)) {
            throw ApiError.forbidden(
                "You are not permitted to update payment status."
            );
        }

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            throw ApiError.notFound("Payment not found.");
        }

        // Payment success must come from the real payment workflow.
        if (
            paymentStatus === PAYMENT_STATUS.SUCCESS ||
            paymentStatus === PAYMENT_STATUS.REFUNDED
        ) {
            throw ApiError.badRequest(
                "Use the verified payment or refund workflow for this status."
            );
        }

        if (
            ![
                PAYMENT_STATUS.PENDING,
                PAYMENT_STATUS.FAILED,
            ].includes(paymentStatus)
        ) {
            throw ApiError.badRequest(
                "Invalid manual payment status change."
            );
        }

        if (payment.paymentStatus === PAYMENT_STATUS.SUCCESS) {
            throw ApiError.badRequest(
                "A successful payment cannot be manually changed."
            );
        }

        payment.paymentStatus = paymentStatus;
        await payment.save();

        if (paymentStatus === PAYMENT_STATUS.FAILED) {
            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: "Failed",
            });
        }

        return payment;
    }

    async refundPayment(
        paymentId,
        refundAmount,
        refundReason,
        user
    ) {
        if (!this.canRefund(user)) {
            throw ApiError.forbidden(
                "You are not permitted to process refunds."
            );
        }

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            throw ApiError.notFound("Payment not found.");
        }

        if (payment.paymentStatus !== PAYMENT_STATUS.SUCCESS) {
            throw ApiError.badRequest(
                "Only successful payments can be refunded."
            );
        }

        const amount = Number(refundAmount);

        if (!Number.isFinite(amount) || amount <= 0) {
            throw ApiError.badRequest(
                "Refund amount must be greater than zero."
            );
        }

        if (amount > payment.amount) {
            throw ApiError.badRequest(
                "Refund amount cannot exceed the original payment amount."
            );
        }

        if (payment.paymentMethod !== "Razorpay") {
            throw ApiError.badRequest(
                "This payment requires a supported manual refund workflow."
            );
        }

        if (
            !payment.razorpayPaymentId ||
            !process.env.RAZORPAY_KEY_ID ||
            !process.env.RAZORPAY_KEY_SECRET
        ) {
            throw ApiError.badRequest(
                "The original Razorpay payment details are unavailable."
            );
        }

        const response = await fetch(
            `https://api.razorpay.com/v1/payments/${encodeURIComponent(
                payment.razorpayPaymentId
            )}/refund`,
            {
                method: "POST",
                headers: {
                    Authorization: `Basic ${Buffer.from(
                        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
                    ).toString("base64")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: Math.round(amount * 100),
                    notes: {
                        reason: String(refundReason || "").slice(0, 200),
                    },
                }),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw ApiError.badRequest(
                result.error?.description ||
                    "The payment provider could not process the refund."
            );
        }

        // Persist the refund only after provider acceptance.
        payment.paymentStatus = PAYMENT_STATUS.REFUNDED;
        payment.refundAmount = amount;
        payment.refundReason = refundReason || "";
        payment.refundedAt = new Date();

        await payment.save();

        await Order.findByIdAndUpdate(payment.order, {
            paymentStatus: PAYMENT_STATUS.REFUNDED,
        });

        return payment;
    }

    async getPaymentById(id, user) {
        const payment = await Payment.findById(id)
            .populate("user", "name email")
            .populate("order");

        if (!payment) {
            throw ApiError.notFound("Payment not found.");
        }

        this.checkPaymentAccess(payment, user);

        return payment;
    }

    async getMyPayments(userId, query) {
        return getPagination({
            model: Payment,
            query: { user: userId },
            page: query.page,
            limit: query.limit,
            sort: query.sort,
            order: query.order,
            populate: "order",
        });
    }

    async getAllPayments(query, user) {
        if (!this.isStaff(user)) {
            throw ApiError.forbidden(
                "You do not have permission to view all payments."
            );
        }

        // Optional filters: ?paymentStatus=Pending,Success&paymentMethod=Cash&search=<transaction id>
        const filter = {};

        const statuses = parseList(
            query.paymentStatus,
            Object.values(PAYMENT_STATUS)
        );

        if (statuses.length > 0) {
            filter.paymentStatus = { $in: statuses };
        }

        if (query.paymentMethod) {
            const methods = String(query.paymentMethod)
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

            if (methods.length > 0) {
                filter.paymentMethod = { $in: methods };
            }
        }

        if (query.search?.trim()) {
            const pattern = new RegExp(escapeRegex(query.search.trim()), "i");

            filter.$or = [
                { transactionId: pattern },
                { paymentId: pattern },
                { razorpayOrderId: pattern },
                { razorpayPaymentId: pattern },
            ];
        }

        return getPagination({
            model: Payment,
            query: filter,
            page: query.page,
            limit: query.limit,
            sort: query.sort,
            order: query.order,
            populate: "user order",
        });
    }

    async getPaymentStatistics() {
        const totalPayments = await Payment.countDocuments();

        const successfulPayments = await Payment.countDocuments({
            paymentStatus: PAYMENT_STATUS.SUCCESS,
        });

        const pendingPayments = await Payment.countDocuments({
            paymentStatus: PAYMENT_STATUS.PENDING,
        });

        const refundedPayments = await Payment.countDocuments({
            paymentStatus: PAYMENT_STATUS.REFUNDED,
        });

        const revenue = await Payment.aggregate([
            {
                $match: {
                    paymentStatus: PAYMENT_STATUS.SUCCESS,
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" },
                },
            },
        ]);

        return {
            totalPayments,
            successfulPayments,
            pendingPayments,
            refundedPayments,
            totalRevenue:
                revenue.length > 0
                    ? revenue[0].totalRevenue
                    : 0,
        };
    }

    async deletePayment(id, user) {
        if (user?.role !== ROLES.ADMIN) {
            throw ApiError.forbidden(
                "Only Admin can delete payment records."
            );
        }

        const payment = await Payment.findById(id);

        if (!payment) {
            throw ApiError.notFound("Payment not found.");
        }

        if (
            [
                PAYMENT_STATUS.SUCCESS,
                PAYMENT_STATUS.REFUNDED,
            ].includes(payment.paymentStatus)
        ) {
            throw ApiError.badRequest(
                "Successful or refunded payment records cannot be deleted."
            );
        }

        await payment.deleteOne();

        return true;
    }
}

export default new PaymentService();