import api from "./client";

// Backend: /api/leaves (staff only)

export const getLeaveBalance = async (year) => {
    const { data } = await api.get("/leaves/balance", { params: { year } });
    return data;
};

// { page, limit, status, month, year, search, mine } — everyone's needs leave.read
export const getLeaves = async (params = {}) => {
    const { data } = await api.get("/leaves", { params });
    return data;
};

// { type, startDate, endDate?, hours?, reason }
export const applyLeave = async (leave) => {
    const { data } = await api.post("/leaves", leave);
    return data;
};

export const cancelLeave = async (id) => {
    const { data } = await api.patch(`/leaves/${id}/cancel`);
    return data;
};

// leave.approve
export const approveLeave = async (id, note = "") => {
    const { data } = await api.patch(`/leaves/${id}/approve`, { note });
    return data;
};

export const rejectLeave = async (id, note = "") => {
    const { data } = await api.patch(`/leaves/${id}/reject`, { note });
    return data;
};

export const getHolidays = async (year) => {
    const { data } = await api.get("/leaves/holidays", { params: { year } });
    return data;
};

// holidays.manage
export const addHoliday = async (holiday) => {
    const { data } = await api.post("/leaves/holidays", holiday);
    return data;
};

export const deleteHoliday = async (id) => {
    const { data } = await api.delete(`/leaves/holidays/${id}`);
    return data;
};
