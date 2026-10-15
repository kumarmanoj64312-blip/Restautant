import { getMenuPrice } from "../../utils/format";
import { calculateCharges } from "../../hooks/useSettings";

// Cart endpoints respond with { success, message, cart } (not `data`)
export const extractCart = (response) => response?.cart ?? response?.data ?? null;

// Usable cart lines: the populated menu may be null if the dish was deleted
export const getCartItems = (cart) => (Array.isArray(cart?.items) ? cart.items : []);

export const isItemOrderable = (item) => !!item?.menu?._id && item.menu.isAvailable !== false;

// The order API charges the current menu price (discount first), so show that
export const getUnitPrice = (item) => (item?.menu ? getMenuPrice(item.menu) : Number(item?.price) || 0);

// Totals use the same delivery/tax rules as the backend (see hooks/useSettings)
export const summarizeCart = (items, settings) => {
    const orderable = items.filter(isItemOrderable);
    const subtotal = orderable.reduce((sum, item) => sum + getUnitPrice(item) * item.quantity, 0);
    const itemCount = orderable.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const charges = calculateCharges(subtotal, settings, { includeDelivery: orderable.length > 0 });

    return {
        orderable,
        itemCount,
        subtotal,
        deliveryCharge: charges.deliveryCharge,
        tax: charges.tax,
        taxRate: charges.taxRate,
        total: charges.total,
        hasUnavailable: orderable.length !== items.length,
    };
};
