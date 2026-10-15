import api from "./client";

// Backend: /api/cart (logged-in users)

export const getCart = async () => {
    const { data } = await api.get("/cart");
    return data;
};

export const addToCart = async (menuId, quantity = 1) => {
    const { data } = await api.post("/cart/add", { menuId, quantity });
    return data;
};

export const updateCartItem = async (menuId, quantity) => {
    const { data } = await api.put("/cart/update", { menuId, quantity });
    return data;
};

export const removeCartItem = async (menuId) => {
    const { data } = await api.delete(`/cart/remove/${menuId}`);
    return data;
};

export const clearCart = async () => {
    const { data } = await api.delete("/cart/clear");
    return data;
};
