import api, { multipart } from "./client";

// Backend: /api/auth

export const registerUser = async (userData) => {
    const { data } = await api.post("/auth/register", userData);
    return data;
};

export const loginUser = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    return data;
};

export const logoutUser = async () => {
    const { data } = await api.post("/auth/logout");
    return data;
};

// Accepts FormData (optional "avatar" file field)
export const updateProfile = async (formData) => {
    const { data } = await api.put("/auth/profile", formData, multipart);
    return data;
};

export const changePassword = async (passwordData) => {
    const { data } = await api.put("/auth/change-password", passwordData);
    return data;
};

// ---------- Admin ----------

export const getUsers = async (params = {}) => {
    const { data } = await api.get("/auth/users", { params });
    return data;
};

export const deleteUser = async (id) => {
    const { data } = await api.delete(`/auth/users/${id}`);
    return data;
};

export const toggleBlockUser = async (id) => {
    const { data } = await api.patch(`/auth/users/${id}/block`);
    return data;
};
