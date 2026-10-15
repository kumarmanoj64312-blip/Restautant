// Mirrors the rules in Backend/src/services/paymentService.js

export const PAYMENT_FILTERS = ["Pending", "Success", "Failed", "Cancelled", "Refunded"];

// Paid in person: cash on delivery or at the POS counter
const IN_PERSON_METHODS = ["Cash on Delivery", "Cash", "UPI", "Card"];

// Money received for a pending in-person payment
export const canVerifyCod = (payment) =>
    IN_PERSON_METHODS.includes(payment?.paymentMethod) && payment?.paymentStatus === "Pending";

// Only Razorpay payments that succeeded can be refunded
export const canRefund = (payment) => payment?.paymentMethod === "Razorpay" && payment?.paymentStatus === "Success";

// Manual changes are limited to Pending <-> Failed, never from Success/Refunded
export const getManualStatus = (payment) => {
    if (["Success", "Refunded"].includes(payment?.paymentStatus)) return null;
    return payment?.paymentStatus === "Pending" ? "Failed" : "Pending";
};

export const canDeletePayment = (payment) => !["Success", "Refunded"].includes(payment?.paymentStatus);

export const matchesPaymentSearch = (payment, term) => {
    const query = term.trim().toLowerCase();
    if (!query) return true;

    return [
        payment._id,
        payment.order?._id,
        payment.order?.orderNumber,
        payment.user?.name,
        payment.user?.email,
        payment.razorpayPaymentId,
        payment.razorpayOrderId,
    ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
};
