import api, { multipart } from "./client";

// Backend: /api/Category (capital C kept for compatibility)

export const getCategories = async (params = {}) => {
    const { data } = await api.get("/Category", { params });
    return data;
};

export const getActiveCategories = async () => {
    const { data } = await api.get("/Category/active");
    return data;
};

export const getCategoryById = async (id) => {
    const { data } = await api.get(`/Category/${id}`);
    return data;
};

// FormData: name, description, isActive, sortOrder, image (file)
export const createCategory = async (formData) => {
    const { data } = await api.post("/Category", formData, multipart);
    return data;
};

export const updateCategory = async (id, formData) => {
    const { data } = await api.put(`/Category/${id}`, formData, multipart);
    return data;
};

export const toggleCategoryStatus = async (id) => {
    const { data } = await api.patch(`/Category/${id}/status`);
    return data;
};

export const deleteCategory = async (id) => {
    const { data } = await api.delete(`/Category/${id}`);
    return data;
};
