import mongoose from "mongoose";

export const validateCreatePayment = (req, res, next) => {
    const {
        order,
        amount,
        paymentMethod,
    } = req.body;

    const errors = [];

    if (!order) {
        errors.push("Order ID is required.");
    } else if (!mongoose.Types.ObjectId.isValid(order)) {
        errors.push("Invalid Order ID.");
    }

    if (amount === undefined || amount === "") {
        errors.push("Amount is required.");
    } else if (Number(amount) <= 0) {
        errors.push("Amount must be greater than zero.");
    }

    const allowedMethods = [
        "Cash on Delivery",
        "Razorpay",
        "UPI",
        "Card",
        "Net Banking",
        "Wallet",
    ];

    if (!paymentMethod) {
        errors.push("Payment method is required.");
    } else if (!allowedMethods.includes(paymentMethod)) {
        errors.push("Invalid payment method.");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors,
        });
    }

    next();
};

export const validatePaymentId = (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid Payment ID.",
        });
    }

    next();
};

export const validatePaymentStatus = (req, res, next) => {
    const { paymentStatus } = req.body;

    const allowedStatus = [
        "Pending",
        "Success",
        "Failed",
        "Cancelled",
        "Refunded",
    ];

    if (!paymentStatus) {
        return res.status(400).json({
            success: false,
            message: "Payment status is required.",
        });
    }

    if (!allowedStatus.includes(paymentStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment status.",
        });
    }

    next();
};

export const validateRazorpayPayment = (req, res, next) => {
    const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
    } = req.body;

    const errors = [];

    if (!razorpayOrderId) {
        errors.push("Razorpay Order ID is required.");
    }

    if (!razorpayPaymentId) {
        errors.push("Razorpay Payment ID is required.");
    }

    if (!razorpaySignature) {
        errors.push("Razorpay Signature is required.");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors,
        });
    }

    next();
};

export const validateRefund = (req, res, next) => {
    const { refundAmount, refundReason } = req.body;

    const errors = [];

    if (refundAmount === undefined) {
        errors.push("Refund amount is required.");
    } else if (Number(refundAmount) <= 0) {
        errors.push("Refund amount must be greater than zero.");
    }

    if (!refundReason || refundReason.trim() === "") {
        errors.push("Refund reason is required.");
    } else if (refundReason.length > 300) {
        errors.push("Refund reason cannot exceed 300 characters.");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors,
        });
    }

    next();
};
