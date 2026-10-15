import api from "./client";

// Backend: /api/attendance (staff only)

export const getAttendanceStatus = async () => {
    const { data } = await api.get("/attendance/status");
    return data;
};

export const clockIn = async () => {
    const { data } = await api.post("/attendance/clock-in");
    return data;
};

export const clockOut = async () => {
    const { data } = await api.post("/attendance/clock-out");
    return data;
};

// { userId?, month, year } — userId needs attendance.read
export const getAttendanceHistory = async (params = {}) => {
    const { data } = await api.get("/attendance", { params });
    return data;
};

// attendance.read
export const getAttendanceStaff = async (params = {}) => {
    const { data } = await api.get("/attendance/staff", { params });
    return data;
};

export const getDailyReport = async (params = {}) => {
    const { data } = await api.get("/attendance/report/daily", { params });
    return data;
};

export const getMonthlyReport = async (params = {}) => {
    const { data } = await api.get("/attendance/report/monthly", { params });
    return data;
};

// attendance.manage: { userId, date, inTime: "HH:mm", outTime?, note? }
export const createAttendanceEntry = async (entry) => {
    const { data } = await api.post("/attendance", entry);
    return data;
};

export const updateAttendanceEntry = async (id, entry) => {
    const { data } = await api.put(`/attendance/${id}`, entry);
    return data;
};

export const deleteAttendanceEntry = async (id) => {
    const { data } = await api.delete(`/attendance/${id}`);
    return data;
};
