// Order helpers shared by the admin dashboard and orders page.
// Transitions mirror Backend/src/services/orderService.js updateOrderStatus.

const ORDER_TRANSITIONS = {
    Pending: ["Confirmed", "Preparing", "Cancelled"],
    Confirmed: ["Preparing", "Out for Delivery", "Cancelled"],
    Preparing: ["Ready", "Out for Delivery", "Delivered", "Cancelled"],
    Ready: ["Out for Delivery", "Delivered", "Cancelled"],
    "Out for Delivery": ["Delivered", "Cancelled"],
};

const isDelivery = (order) => (order?.orderType || "Delivery") === "Delivery";

// Next statuses offered in the status picker (cancel has its own button)
export const getNextStatuses = (order) =>
    (ORDER_TRANSITIONS[order?.orderStatus] || []).filter(
        (status) => status !== "Cancelled" && (status !== "Out for Delivery" || isDelivery(order))
    );

// Backend cancelOrder rejects Delivered and Cancelled orders
export const canCancelOrder = (order) => !["Delivered", "Cancelled"].includes(order?.orderStatus);

// POS orders are saved under the staff member's account, so prefer customerName
export const getCustomerName = (order) => {
    if (!order) return "";
    if (order.createdBy || !isDelivery(order)) return order.customerName || "Walk-in customer";
    return order.user?.name || order.shippingAddress?.name || order.customerName || "Customer";
};

export const getCustomerContact = (order) =>
    order?.customerPhone || order?.shippingAddress?.phone || order?.user?.email || "";

export const getOrderTypeLabel = (order) => {
    const type = order?.orderType || "Delivery";
    return type === "Dine In" && order?.tableNumber ? `Dine In · Table ${order.tableNumber}` : type;
};

export const getItemCount = (order) =>
    (order?.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

// Case-insensitive search across the visible order fields
export const matchesOrderSearch = (order, term) => {
    const query = term.trim().toLowerCase();
    if (!query) return true;

    return [
        order._id,
        order.orderNumber,
        getCustomerName(order),
        getCustomerContact(order),
        order.user?.email,
        order.tableNumber,
    ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
};
