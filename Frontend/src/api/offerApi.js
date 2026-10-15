import api from "./client";

// Backend: /api/offers

export const getOffers = async (params = {}) => {
    const { data } = await api.get("/offers", { params });
    return data;
};
