import api from "./client";

// Backend: /api/staff (admin only)

export const getStaff = async () => {
    const { data } = await api.get("/staff");
    return data;
};

// { name, email, phone, password, role }
export const createStaff = async (staffData) => {
    const { data } = await api.post("/staff", staffData);
    return data;
};

// Give an existing account a staff role: { email, role }
export const promoteToStaff = async (payload) => {
    const { data } = await api.post("/staff/promote", payload);
    return data;
};

// Any of { name, phone, role, isBlocked }. role "customer" removes staff access.
export const updateStaff = async (id, updates) => {
    const { data } = await api.patch(`/staff/${id}`, updates);
    return data;
};

export const deleteStaff = async (id) => {
    const { data } = await api.delete(`/staff/${id}`);
    return data;
};
