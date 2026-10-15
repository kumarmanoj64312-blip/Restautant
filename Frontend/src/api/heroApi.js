import api, { multipart } from "./client";

// Backend: /api/hero

export const getHeroes = async (params = { limit: 100 }) => {
    const { data } = await api.get("/hero", { params });
    return data;
};

export const getActiveHeroes = async () => {
    const { data } = await api.get("/hero/active");
    return data;
};

export const createHero = async (formData) => {
    const { data } = await api.post("/hero", formData, multipart);
    return data;
};

export const updateHero = async (id, formData) => {
    const { data } = await api.put(`/hero/${id}`, formData, multipart);
    return data;
};

export const toggleHeroStatus = async (id) => {
    const { data } = await api.patch(`/hero/${id}/status`);
    return data;
};

export const changeHeroDisplayOrder = async (id, displayOrder) => {
    const { data } = await api.patch(`/hero/${id}/display-order`, { displayOrder });
    return data;
};

export const deleteHero = async (id) => {
    const { data } = await api.delete(`/hero/${id}`);
    return data;
};
