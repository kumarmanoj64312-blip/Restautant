import { ROLES } from "./roles.js";

// Permission keys are "<module>.<action>", e.g. "menu.create".
// Checked by requirePermission() on the backend and can() on the frontend.
// Keep in sync with Frontend/src/utils/constants.js
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

    OFFERS_CREATE: "offers.create",
    OFFERS_UPDATE: "offers.update",
    OFFERS_DELETE: "offers.delete",

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

// Every staff member (admin, manager, kitchen) can always clock in/out,
// see their own attendance and apply for leave. These permissions cover
// other people's records.

/**
 * Modules shown on the role permissions page, each with its actions.
 * `roles` lists which editable roles may be given that module's actions:
 * kitchen staff can only ever get kitchen permissions.
 */
export const PERMISSION_MODULES = [
    {
        key: "dashboard",
        label: "Dashboard",
        description: "Sales stats and recent orders",
        roles: [ROLES.MANAGER],
        actions: [{ key: "read", label: "Read" }],
    },
    {
        key: "orders",
        label: "Orders",
        description: "Customer and POS orders",
        roles: [ROLES.MANAGER],
        actions: [
            { key: "read", label: "Read" },
            { key: "update", label: "Update status" },
            { key: "cancel", label: "Cancel" },
        ],
    },
    {
        key: "payments",
        label: "Payments",
        description: "Payments and payment stats",
        roles: [ROLES.MANAGER],
        actions: [
            { key: "read", label: "Read" },
            { key: "update", label: "Update status" },
            { key: "refund", label: "Refund" },
        ],
    },
    {
        key: "menu",
        label: "Menu items",
        description: "Dishes, prices and availability",
        roles: [ROLES.MANAGER],
        actions: [
            { key: "create", label: "Create" },
            { key: "update", label: "Update" },
            { key: "delete", label: "Delete" },
        ],
    },
    {
        key: "categories",
        label: "Categories",
        description: "Menu categories",
        roles: [ROLES.MANAGER],
        actions: [
            { key: "create", label: "Create" },
            { key: "update", label: "Update" },
            { key: "delete", label: "Delete" },
        ],
    },
    {
        key: "banners",
        label: "Hero banners",
        description: "Home page banners",
        roles: [ROLES.MANAGER],
        actions: [
            { key: "create", label: "Create" },
            { key: "update", label: "Update" },
            { key: "delete", label: "Delete" },
        ],
    },
    {
        key: "offers",
        label: "Offers",
        description: "Discount offers and coupons",
        roles: [ROLES.MANAGER],
        actions: [
            { key: "create", label: "Create" },
            { key: "update", label: "Update" },
            { key: "delete", label: "Delete" },
        ],
    },
    {
        key: "settings",
        label: "Settings",
        description: "Restaurant details, delivery charge and tax",
        roles: [ROLES.MANAGER],
        actions: [
            { key: "update", label: "Update" },
            { key: "reset", label: "Reset to defaults" },
        ],
    },
    {
        key: "pos",
        label: "POS",
        description: "Counter orders and handing over ready orders",
        roles: [ROLES.MANAGER],
        actions: [{ key: "access", label: "Use POS" }],
    },
    {
        key: "attendance",
        label: "Attendance",
        description: "Staff attendance history and reports",
        roles: [ROLES.MANAGER],
        actions: [
            { key: "read", label: "View all staff" },
            { key: "manage", label: "Add / edit entries" },
        ],
    },
    {
        key: "leave",
        label: "Leave",
        description: "Staff leave requests",
        roles: [ROLES.MANAGER],
        actions: [
            { key: "read", label: "View all requests" },
            { key: "approve", label: "Approve / reject" },
        ],
    },
    {
        key: "holidays",
        label: "Holidays",
        description: "Restaurant holiday calendar",
        roles: [ROLES.MANAGER],
        actions: [{ key: "manage", label: "Add / remove" }],
    },
    {
        key: "kitchen",
        label: "Kitchen display",
        description: "Live order tickets for the kitchen",
        roles: [ROLES.MANAGER, ROLES.KITCHEN],
        actions: [
            { key: "read", label: "View tickets" },
            { key: "update", label: "Update ticket status" },
        ],
    },
];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// Roles whose permissions an admin can change
export const EDITABLE_ROLES = [ROLES.MANAGER, ROLES.KITCHEN];

// Permissions a role is allowed to hold at all
export const getAssignablePermissions = (role) =>
    PERMISSION_MODULES.filter((module) => module.roles.includes(role)).flatMap((module) =>
        module.actions.map((action) => `${module.key}.${action.key}`)
    );

// Starting permissions until an admin changes them
export const DEFAULT_ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: ALL_PERMISSIONS,
    [ROLES.MANAGER]: [
        PERMISSIONS.DASHBOARD_READ,
        PERMISSIONS.ORDERS_READ,
        PERMISSIONS.ORDERS_UPDATE,
        PERMISSIONS.ORDERS_CANCEL,
        PERMISSIONS.PAYMENTS_READ,
        PERMISSIONS.PAYMENTS_UPDATE,
        PERMISSIONS.PAYMENTS_REFUND,
        PERMISSIONS.MENU_CREATE,
        PERMISSIONS.MENU_UPDATE,
        PERMISSIONS.MENU_DELETE,
        PERMISSIONS.CATEGORIES_CREATE,
        PERMISSIONS.CATEGORIES_UPDATE,
        PERMISSIONS.CATEGORIES_DELETE,
        PERMISSIONS.POS_ACCESS,
        PERMISSIONS.KITCHEN_READ,
        PERMISSIONS.KITCHEN_UPDATE,
        PERMISSIONS.ATTENDANCE_READ,
        PERMISSIONS.LEAVE_READ,
        PERMISSIONS.LEAVE_APPROVE,
    ],
    [ROLES.KITCHEN]: [PERMISSIONS.KITCHEN_READ, PERMISSIONS.KITCHEN_UPDATE],
    [ROLES.CUSTOMER]: [],
};

// Shown on the Roles & Permissions page
export const ROLE_INFO = {
    [ROLES.ADMIN]: {
        label: "Admin",
        description: "Full access, including staff management and roles & permissions.",
    },
    [ROLES.MANAGER]: {
        label: "Manager",
        description: "Runs day-to-day operations. Permissions are configurable.",
    },
    [ROLES.KITCHEN]: {
        label: "Kitchen Staff",
        description: "Kitchen display only: accept, cook and mark orders ready.",
    },
    [ROLES.CUSTOMER]: {
        label: "Customer",
        description: "Website ordering, own profile and own orders.",
    },
};
