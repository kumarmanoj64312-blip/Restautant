import api from "./client";

// Backend: /api/dashboard (admin only)

export const getDashboardStats = async () => {
    const { data } = await api.get("/dashboard/stats");
    return data;
};

export const getRecentOrders = async () => {
    const { data } = await api.get("/dashboard/recent-orders");
    return data;
};
