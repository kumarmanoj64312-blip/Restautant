import api from "./client";

// Backend: /api/orders

// Staff: supports ?page, ?limit, ?sort, ?order, ?orderStatus=Ready,Preparing
export const getAllOrders = async (params = {}) => {
    const { data } = await api.get("/orders", { params });
    return data;
};

export const getMyOrders = async (params = {}) => {
    const { data } = await api.get("/orders/my-orders", { params });
    return data;
};

export const createOrder = async (orderData) => {
    const { data } = await api.post("/orders", orderData);
    return data;
};

export const updateOrderStatus = async (id, orderStatus) => {
    const { data } = await api.patch(`/orders/${id}/status`, { orderStatus });
    return data;
};

export const cancelOrder = async (id) => {
    const { data } = await api.patch(`/orders/${id}/cancel`);
    return data;
};

export const getKitchenOrders = async () => {
    const { data } = await api.get("/orders/kitchen");
    return data;
};

export const createPosOrder = async (orderData) => {
    const { data } = await api.post("/orders/pos", orderData);
    return data;
};
