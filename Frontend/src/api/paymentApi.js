import api from "./client";

// Backend: /api/payments

// Public: { onlinePayment } — false when Razorpay keys aren't set up
export const getPaymentConfig = async () => {
    const { data } = await api.get("/payments/config");
    return data;
};

export const createPayment = async (paymentData) => {
    const { data } = await api.post("/payments", paymentData);
    return data;
};

export const verifyRazorpayPayment = async (paymentData) => {
    const { data } = await api.post("/payments/verify-razorpay", paymentData);
    return data;
};

export const getAllPayments = async (params = {}) => {
    const { data } = await api.get("/payments", { params });
    return data;
};

export const getPaymentStatistics = async () => {
    const { data } = await api.get("/payments/statistics/dashboard");
    return data;
};

export const verifyCashOnDelivery = async (id) => {
    const { data } = await api.patch(`/payments/${id}/cod`);
    return data;
};

export const updatePaymentStatus = async (id, paymentStatus) => {
    const { data } = await api.patch(`/payments/${id}/status`, { paymentStatus });
    return data;
};

export const refundPayment = async (id, refundAmount, refundReason) => {
    const { data } = await api.patch(`/payments/${id}/refund`, {
        refundAmount,
        refundReason,
    });
    return data;
};

export const deletePayment = async (id) => {
    const { data } = await api.delete(`/payments/${id}`);
    return data;
};
