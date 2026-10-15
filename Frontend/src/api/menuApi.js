import api, { multipart } from "./client";

// Backend: /api/menu

export const getMenus = async (params = {}) => {
    const { data } = await api.get("/menu", { params });
    return data;
};

export const getPopularMenus = async (limit = 8) => {
    const { data } = await api.get("/menu/popular", { params: { limit } });
    return data;
};

export const getMenuById = async (id) => {
    const { data } = await api.get(`/menu/${id}`);
    return data;
};

// FormData: name, category, description, price, discountPrice,
// isAvailable, isPopular, image (file)
export const createMenu = async (formData) => {
    const { data } = await api.post("/menu", formData, multipart);
    return data;
};

export const updateMenu = async (id, formData) => {
    const { data } = await api.put(`/menu/${id}`, formData, multipart);
    return data;
};

// There is no dedicated availability route; send it as a normal update
export const setMenuAvailability = async (id, isAvailable) => {
    const formData = new FormData();
    formData.append("isAvailable", String(isAvailable));

    return updateMenu(id, formData);
};

export const togglePopular = async (id) => {
    const { data } = await api.patch(`/menu/${id}/popular`);
    return data;
};

export const deleteMenu = async (id) => {
    const { data } = await api.delete(`/menu/${id}`);
    return data;
};
