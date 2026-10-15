import api from "./client";

// Backend: /api/roles

// Logged-in user's own role and permissions
export const getMyPermissions = async () => {
    const { data } = await api.get("/roles/me");
    return data;
};

// Admin only: roles, permission catalogue, user counts
export const getRoles = async () => {
    const { data } = await api.get("/roles");
    return data;
};

// Admin only: replace an editable role's permissions
export const updateRolePermissions = async (role, permissions) => {
    const { data } = await api.put(`/roles/${role}`, { permissions });
    return data;
};
