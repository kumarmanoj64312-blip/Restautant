import paymentService from "../services/paymentService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { isRazorpayConfigured } from "../config/razorpay.js";
import {
    ROLES,
    PAYMENT_STATUS,
} from "../constants/roles.js";

// Public: which online payment options the checkout can offer
export const getPaymentConfig = asyncHandler(async (req, res) => {
    return ApiResponse.success(res, "Payment options fetched.", {
        onlinePayment: isRazorpayConfigured(),
    });
});

export const createPayment = asyncHandler(async (req, res) => {
    const payment = await paymentService.createPayment(
        req.body,
        req.user._id
    );

    return ApiResponse.created(
        res,
        "Payment created successfully.",
        payment
    );
});

export const verifyCashOnDelivery = asyncHandler(async (req, res) => {
    const payment = await paymentService.verifyCashOnDelivery(
        req.params.id,
        req.user
    );

    return ApiResponse.success(
        res,
        "Cash on Delivery payment verified successfully.",
        payment
    );
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const payment = await paymentService.verifyRazorpayPayment(
        req.body,
        req.user
    );

    return ApiResponse.success(
        res,
        "Payment verified successfully.",
        payment
    );
});

export const updatePaymentStatus = asyncHandler(async (req, res) => {
    const { paymentStatus } = req.body;

    if (!Object.values(PAYMENT_STATUS).includes(paymentStatus)) {
        throw ApiError.badRequest("Invalid payment status.");
    }

    if (req.user.role !== ROLES.ADMIN) {
        throw ApiError.forbidden(
            "Only Admin can directly update payment status."
        );
    }

    const payment = await paymentService.updatePaymentStatus(
        req.params.id,
        paymentStatus,
        req.user
    );

    return ApiResponse.success(
        res,
        "Payment status updated successfully.",
        payment
    );
});

export const refundPayment = asyncHandler(async (req, res) => {
    if (req.user.role !== ROLES.ADMIN) {
        throw ApiError.forbidden(
            "Only Admin can process refunds."
        );
    }

    const { refundAmount, refundReason } = req.body;

    if (
        refundAmount !== undefined &&
        (
            typeof refundAmount !== "number" ||
            !Number.isFinite(refundAmount) ||
            refundAmount <= 0
        )
    ) {
        throw ApiError.badRequest(
            "Refund amount must be a positive number."
        );
    }

    if (
        refundReason !== undefined &&
        typeof refundReason !== "string"
    ) {
        throw ApiError.badRequest(
            "Refund reason must be a string."
        );
    }

    const payment = await paymentService.refundPayment(
        req.params.id,
        refundAmount,
        refundReason,
        req.user
    );

    return ApiResponse.success(
        res,
        "Refund request processed successfully.",
        payment
    );
});

export const getPaymentById = asyncHandler(async (req, res) => {
    const payment = await paymentService.getPaymentById(
        req.params.id,
        req.user
    );

    return ApiResponse.success(
        res,
        "Payment fetched successfully.",
        payment
    );
});

export const getMyPayments = asyncHandler(async (req, res) => {
    const payments = await paymentService.getMyPayments(
        req.user._id,
        req.query
    );

    return ApiResponse.success(
        res,
        "Your payments fetched successfully.",
        payments
    );
});

export const getAllPayments = asyncHandler(async (req, res) => {
    const payments = await paymentService.getAllPayments(
        req.query,
        req.user
    );

    return ApiResponse.success(
        res,
        "Payments fetched successfully.",
        payments
    );
});

export const getPaymentStatistics = asyncHandler(async (req, res) => {
    if (![ROLES.ADMIN, ROLES.MANAGER].includes(req.user.role)) {
        throw ApiError.forbidden(
            "Only Admin and Manager can access payment statistics."
        );
    }

    const statistics = await paymentService.getPaymentStatistics();

    return ApiResponse.success(
        res,
        "Payment statistics fetched successfully.",
        statistics
    );
});

export const deletePayment = asyncHandler(async (req, res) => {
    if (req.user.role !== ROLES.ADMIN) {
        throw ApiError.forbidden(
            "Only Admin can delete payment records."
        );
    }

    await paymentService.deletePayment(
        req.params.id,
        req.user
    );

    return ApiResponse.success(
        res,
        "Payment deleted successfully."
    );
});
