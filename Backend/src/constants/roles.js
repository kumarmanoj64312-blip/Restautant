export const ROLES = {
    ADMIN: "admin",
    MANAGER: "manager",
    KITCHEN: "kitchen",
    CUSTOMER: "customer",
};

// Roles that count as restaurant staff
export const STAFF_ROLES = [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.KITCHEN,
];

// Roles that no longer exist. Accounts still holding one are
// moved to LEGACY_ROLE_FALLBACK at startup (see utils/migrateRoles.js).
export const REMOVED_ROLES = ["cashier"];
export const LEGACY_ROLE_FALLBACK = ROLES.CUSTOMER;

export const ORDER_STATUS = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    READY: "Ready",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS = {
    PENDING: "Pending",
    SUCCESS: "Success",
    PAID: "Paid",
    FAILED: "Failed",
    REFUNDED: "Refunded",
    CANCELLED: "Cancelled",
};

export const PAYMENT_METHOD = {
    COD: "Cash on Delivery",
    ONLINE: "Online Payment",
};

export const ORDER_TYPE = {
    DELIVERY: "Delivery",
    DINE_IN: "Dine In",
    TAKEAWAY: "Takeaway",
};

// Payment methods accepted at the POS counter.
export const POS_PAYMENT_METHOD = {
    CASH: "Cash",
    UPI: "UPI",
    CARD: "Card",
};

export const CLOUDINARY_FOLDERS = {
    HERO: "Restaurant/Hero",
    CATEGORY: "Restaurant/Category",
    MENU: "Restaurant/Menu",
    USER: "Restaurant/User",
    OFFER: "Restaurant/Offer",
};

