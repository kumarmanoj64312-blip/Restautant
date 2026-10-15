import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        paymentId: {
            type: String,
            default: "",
        },

        transactionId: {
            type: String,
            default: "",
        },

        razorpayOrderId: {
            type: String,
            default: "",
            index: true,
        },

        razorpayPaymentId: {
            type: String,
            default: "",
        },

        razorpaySignature: {
            type: String,
            default: "",
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },

        currency: {
            type: String,
            default: "INR",
            uppercase: true,
            trim: true,
        },

        paymentMethod: {
            type: String,
            enum: [
                "Cash on Delivery",
                "Cash",
                "UPI",
                "Card",
                "Net Banking",
                "Wallet",
                "Razorpay",
            ],
            default: "Cash on Delivery",
        },

        paymentStatus: {
            type: String,
            enum: [
                "Pending",
                "Success",
                "Failed",
                "Cancelled",
                "Refunded",
            ],
            default: "Pending",
        },

        refundAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        refundReason: {
            type: String,
            default: "",
            trim: true,
        },

        paidAt: {
            type: Date,
        },

        refundedAt: {
            type: Date,
        },

        failureReason: {
            type: String,
            default: "",
            trim: true,
        },

        gatewayResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: () => ({}),
        },
    },
    {
        timestamps: true,
    }
);

// Keep these methods consistent with PAYMENT_STATUS constants.
paymentSchema.methods.markSuccess = function () {
    this.paymentStatus = "Success";
    this.paidAt = new Date();
    this.failureReason = "";
};

paymentSchema.methods.markFailed = function (reason) {
    this.paymentStatus = "Failed";
    this.failureReason = reason || "Payment failed";
};

paymentSchema.methods.markRefunded = function (amount, reason) {
    this.paymentStatus = "Refunded";
    this.refundAmount = amount;
    this.refundReason = reason || "";
    this.refundedAt = new Date();
};

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;