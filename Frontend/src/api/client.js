import axios from "axios";

// Every backend route lives under /api, so add it if the env value leaves it off
const apiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const api = axios.create({
    baseURL: apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Session expired or invalid: clear it and send the user to login
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            if (window.location.pathname !== "/login") {
                window.location.replace("/login");
            }
        }

        return Promise.reject(error);
    }
);

export const multipart = {
    headers: { "Content-Type": "multipart/form-data" },
};

// Best human-readable message from an axios error
export const getErrorMessage = (error, fallback = "Something went wrong.") => {
    const data = error?.response?.data;

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
        return data.errors
            .map((item) => (typeof item === "string" ? item : item?.message))
            .filter(Boolean)
            .join(" ");
    }

    return data?.message || error?.message || fallback;
};

// Backend list responses come as data: [...] or data: { records: [...] }
export const unwrapList = (response) => {
    const data = response?.data ?? response;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.records)) return data.records;

    for (const key of ["items", "orders", "users", "menus", "categories", "payments", "heroes", "offers"]) {
        if (Array.isArray(data?.[key])) return data[key];
    }

    return [];
};

// Pagination info from a getPagination() response
export const unwrapPagination = (response) => {
    const data = response?.data ?? {};

    return {
        totalRecords: data.totalRecords ?? 0,
        totalPages: data.totalPages ?? 1,
        currentPage: data.currentPage ?? 1,
        perPage: data.perPage ?? 10,
    };
};

export default api;
