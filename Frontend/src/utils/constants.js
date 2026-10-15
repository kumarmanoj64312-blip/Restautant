// Values must match Backend/src/constants/roles.js

export const ROLES = {
    ADMIN: "admin",
    MANAGER: "manager",
    KITCHEN: "kitchen",
    CUSTOMER: "customer",
};

export const ROLE_LABELS = {
    admin: "Admin",
    manager: "Manager",
    kitchen: "Kitchen Staff",
    customer: "Customer",
};

export const ROLE_TONE = {
    admin: "brand",
    manager: "info",
    kitchen: "warning",
    customer: "neutral",
};

// Must match Backend/src/constants/permissions.js ("<module>.<action>")
export const PERMISSIONS = {
    DASHBOARD_READ: "dashboard.read",
    ORDERS_READ: "orders.read",
    ORDERS_UPDATE: "orders.update",
    ORDERS_CANCEL: "orders.cancel",
    PAYMENTS_READ: "payments.read",
    PAYMENTS_UPDATE: "payments.update",
    PAYMENTS_REFUND: "payments.refund",
    MENU_CREATE: "menu.create",
    MENU_UPDATE: "menu.update",
    MENU_DELETE: "menu.delete",
    CATEGORIES_CREATE: "categories.create",
    CATEGORIES_UPDATE: "categories.update",
    CATEGORIES_DELETE: "categories.delete",
    BANNERS_CREATE: "banners.create",
    BANNERS_UPDATE: "banners.update",
    BANNERS_DELETE: "banners.delete",
    SETTINGS_UPDATE: "settings.update",
    SETTINGS_RESET: "settings.reset",
    POS_ACCESS: "pos.access",
    KITCHEN_READ: "kitchen.read",
    KITCHEN_UPDATE: "kitchen.update",
    ATTENDANCE_READ: "attendance.read",
    ATTENDANCE_MANAGE: "attendance.manage",
    LEAVE_READ: "leave.read",
    LEAVE_APPROVE: "leave.approve",
    HOLIDAYS_MANAGE: "holidays.manage",
};

// Any of these opens the page (used by the sidebar and routes)
export const PAGE_ACCESS = {
    menu: [PERMISSIONS.MENU_CREATE, PERMISSIONS.MENU_UPDATE, PERMISSIONS.MENU_DELETE],
    categories: [PERMISSIONS.CATEGORIES_CREATE, PERMISSIONS.CATEGORIES_UPDATE, PERMISSIONS.CATEGORIES_DELETE],
    banners: [PERMISSIONS.BANNERS_CREATE, PERMISSIONS.BANNERS_UPDATE, PERMISSIONS.BANNERS_DELETE],
    settings: [PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.SETTINGS_RESET],
};

export const ORDER_STATUSES = [
    "Pending",
    "Confirmed",
    "Preparing",
    "Ready",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
];

// Badge tone for each status, used by <StatusBadge />
export const STATUS_TONE = {
    Pending: "warning",
    Confirmed: "info",
    Preparing: "warning",
    Ready: "success",
    "Out for Delivery": "info",
    Delivered: "success",
    Cancelled: "danger",
    Paid: "success",
    Success: "success",
    Failed: "danger",
    Refunded: "neutral",
    Active: "success",
    // Attendance & leave
    Present: "success",
    Absent: "danger",
    "On Leave": "info",
    Holiday: "neutral",
    Upcoming: "neutral",
    Approved: "success",
    Rejected: "danger",
    Inactive: "neutral",
    Blocked: "danger",
};
