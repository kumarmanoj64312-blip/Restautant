import { ROLES } from "./constants";

export const formatCurrency = (amount, currency = "INR", locale = "en-IN") =>
    new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    }).format(Number(amount) || 0);

export const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export const formatDateTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const capitalize = (text = "") =>
    text ? text.charAt(0).toUpperCase() + text.slice(1) : "";

// Short, readable order reference, e.g. #A1B2C3D4
export const formatOrderId = (id = "") =>
    id ? `#${String(id).slice(-8).toUpperCase()}` : "";

export const getInitials = (name = "") =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("") || "U";

// Price a customer actually pays (same rule as the backend)
export const getMenuPrice = (menu) =>
    Number(menu?.discountPrice) > 0 ? Number(menu.discountPrice) : Number(menu?.price) || 0;

// Landing page for each role after login
export const getRoleHomePath = (role) => {
    switch (role) {
        case ROLES.ADMIN:
        case ROLES.MANAGER:
            // /admin opens the first page this user is allowed to see
            return "/admin";
        case ROLES.KITCHEN:
            return "/kitchen";
        default:
            return "/";
    }
};
