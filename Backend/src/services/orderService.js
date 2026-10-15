import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Menu from "../models/Menu.js";
import Payment from "../models/Payment.js";
import Settings from "../models/Settings.js";
import ApiError from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import { hasPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";
import {
    ROLES,
    ORDER_STATUS,
    ORDER_TYPE,
    PAYMENT_STATUS,
} from "../constants/roles.js";

// Statuses a customer may still cancel from (before cooking starts)
const CUSTOMER_CANCELLABLE = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
];

class OrderService {
    // Check whether a user can access a specific order.
    checkOrderAccess(order, user) {
        if (!user) {
            throw ApiError.unauthorized("Please login to continue.");
        }

        const isOwner =
            order.user?._id?.toString() === user._id.toString() ||
            order.user?.toString() === user._id.toString();

        // Staff who work with orders may open any order
        const canSeeAll = [
            PERMISSIONS.ORDERS_READ,
            PERMISSIONS.POS_ACCESS,
            PERMISSIONS.KITCHEN_READ,
        ].some((permission) => hasPermission(user, permission));

        if (!isOwner && !canSeeAll) {
            throw ApiError.forbidden(
                "You do not have permission to access this order."
            );
        }
    }

    // Restore stock only when an order is cancelled.
    async restoreOrderStock(order) {
        for (const item of order.items) {
            const menu = await Menu.findById(item.menu);

            if (menu) {
                menu.stock = (menu.stock || 0) + item.quantity;
                menu.soldCount = Math.max(
                    0,
                    (menu.soldCount || 0) - item.quantity
                );

                await menu.save();
            }
        }
    }

    // Build order line items from menu prices stored in the database.
    async buildOrderItems(items) {
        if (!Array.isArray(items) || items.length === 0) {
            throw ApiError.badRequest("Order items are required.");
        }

        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const quantity = Number(item.quantity);

            if (!Number.isInteger(quantity) || quantity < 1) {
                throw ApiError.badRequest(
                    "Each item must have a valid positive quantity."
                );
            }

            const menu = await Menu.findById(item.menu);

            if (!menu) {
                throw ApiError.notFound("Menu item not found.");
            }

            if (!menu.isAvailable) {
                throw ApiError.badRequest(
                    `${menu.name} is unavailable.`
                );
            }

            if (
                typeof menu.stock === "number" &&
                menu.stock < quantity
            ) {
                throw ApiError.badRequest(
                    `${menu.name} has only ${menu.stock} items available.`
                );
            }

            const price =
                menu.discountPrice > 0
                    ? menu.discountPrice
                    : menu.price;

            const total = price * quantity;
            subtotal += total;

            orderItems.push({
                menu: menu._id,
                name: menu.name,
                image: menu.image,
                price,
                quantity,
                total,
            });
        }

        return { orderItems, subtotal };
    }

    // Delivery charge (flat) and tax (% of subtotal) from admin Settings.
    async calculateCharges(subtotal, { includeDelivery }) {
        const settings = await Settings.findOne().lean();

        const taxRate = Math.min(
            Math.max(Number(settings?.tax) || 0, 0),
            100
        );

        const deliveryCharge = includeDelivery
            ? Math.max(Number(settings?.deliveryCharge) || 0, 0)
            : 0;

        // Round to paise
        const tax = Math.round(subtotal * taxRate) / 100;
        const discount = 0;

        return {
            deliveryCharge,
            tax,
            discount,
            totalAmount: subtotal + deliveryCharge + tax - discount,
        };
    }

    // Update inventory after order creation.
    // For production, use a MongoDB transaction to keep both operations atomic.
    async deductOrderStock(orderItems) {
        for (const item of orderItems) {
            const menu = await Menu.findById(item.menu);

            if (!menu || !menu.isAvailable) {
                throw ApiError.conflict(
                    "A menu item changed while placing the order. Please try again."
                );
            }

            if (
                typeof menu.stock === "number" &&
                menu.stock < item.quantity
            ) {
                throw ApiError.conflict(
                    `${menu.name} no longer has enough stock.`
                );
            }

            if (typeof menu.stock === "number") {
                menu.stock -= item.quantity;
            }

            menu.soldCount = (menu.soldCount || 0) + item.quantity;
            await menu.save();
        }
    }

    async placeOrder(userId, data) {
        const {
            items,
            shippingAddress,
            paymentMethod,
            notes = "",
        } = data;

        const { orderItems, subtotal } =
            await this.buildOrderItems(items);

        // Do not trust financial totals supplied by the frontend.
        const { deliveryCharge, tax, discount, totalAmount } =
            await this.calculateCharges(subtotal, {
                includeDelivery: true,
            });

        const order = await Order.create({
            user: userId,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            subtotal,
            deliveryCharge,
            tax,
            discount,
            totalAmount,
            notes,
        });

        await this.deductOrderStock(orderItems);

        await Cart.findOneAndUpdate(
            { user: userId },
            {
                items: [],
                totalItems: 0,
                subtotal: 0,
                deliveryCharge: 0,
                tax: 0,
                discount: 0,
                totalAmount: 0,
            }
        );

        return Order.findById(order._id)
            .populate("user", "name email")
            .populate("items.menu");
    }

    // Counter order created at the POS. Goes straight to the kitchen.
    async placePosOrder(staffUser, data) {
        const {
            items,
            orderType = ORDER_TYPE.DINE_IN,
            tableNumber = "",
            customerName = "",
            customerPhone = "",
            paymentMethod,
            isPaid = true,
            notes = "",
        } = data;

        const { orderItems, subtotal } =
            await this.buildOrderItems(items);

        // Counter orders pay tax but no delivery charge
        const { deliveryCharge, tax, discount, totalAmount } =
            await this.calculateCharges(subtotal, {
                includeDelivery: false,
            });

        const order = await Order.create({
            user: staffUser._id,
            createdBy: staffUser._id,
            orderType,
            tableNumber:
                orderType === ORDER_TYPE.DINE_IN ? tableNumber : "",
            customerName,
            customerPhone,
            items: orderItems,
            paymentMethod,
            paymentStatus: isPaid
                ? PAYMENT_STATUS.PAID
                : PAYMENT_STATUS.PENDING,
            orderStatus: ORDER_STATUS.CONFIRMED,
            subtotal,
            deliveryCharge,
            tax,
            discount,
            totalAmount,
            notes,
        });

        await this.deductOrderStock(orderItems);

        // Record the counter payment so it shows on the Payments page.
        // Unpaid ones stay Pending until staff mark them received.
        await Payment.create({
            order: order._id,
            user: staffUser._id,
            amount: totalAmount,
            paymentMethod,
            paymentStatus: isPaid
                ? PAYMENT_STATUS.SUCCESS
                : PAYMENT_STATUS.PENDING,
            paidAt: isPaid ? new Date() : undefined,
        });

        return Order.findById(order._id)
            .populate("createdBy", "name");
    }

    // Active tickets for the kitchen display, oldest first.
    async getKitchenOrders() {
        return Order.find({
            orderStatus: {
                $in: [
                    ORDER_STATUS.PENDING,
                    ORDER_STATUS.CONFIRMED,
                    ORDER_STATUS.PREPARING,
                    ORDER_STATUS.READY,
                ],
            },
        })
            .select(
                "orderNumber orderType tableNumber customerName items.name items.quantity orderStatus notes createdAt updatedAt"
            )
            .sort({ createdAt: 1 })
            .limit(200);
    }

    async getMyOrders(userId, query) {
        return getPagination({
            model: Order,
            query: { user: userId },
            page: query.page,
            limit: query.limit,
            sort: query.sort,
            order: query.order,
            populate: "items.menu",
        });
    }

    async getAllOrders(query) {
        const filter = {};

        // Allow ?orderStatus=Ready or ?orderStatus=Ready,Preparing
        if (query.orderStatus) {
            const statuses = String(query.orderStatus)
                .split(",")
                .map((status) => status.trim())
                .filter((status) =>
                    Object.values(ORDER_STATUS).includes(status)
                );

            if (statuses.length > 0) {
                filter.orderStatus = { $in: statuses };
            }
        }

        return getPagination({
            model: Order,
            query: filter,
            page: query.page,
            limit: query.limit,
            sort: query.sort,
            order: query.order,
            populate: "user items.menu",
        });
    }

    async getOrderById(id, user) {
        const order = await Order.findById(id)
            .populate("user", "name email phone")
            .populate("items.menu");

        if (!order) {
            throw ApiError.notFound("Order not found.");
        }

        this.checkOrderAccess(order, user);

        return order;
    }

    async updateOrderStatus(id, orderStatus, user) {
        const order = await Order.findById(id);

        if (!order) {
            throw ApiError.notFound("Order not found.");
        }

        const allowedStatuses = Object.values(ORDER_STATUS);

        if (!allowedStatuses.includes(orderStatus)) {
            throw ApiError.badRequest("Invalid order status.");
        }

        if (!user?.role) {
            throw ApiError.unauthorized("Please login to continue.");
        }

        // Statuses each permission may set. orders.update can set any.
        const allowedByPermission = {
            [PERMISSIONS.ORDERS_UPDATE]: allowedStatuses,
            [PERMISSIONS.POS_ACCESS]: [
                ORDER_STATUS.CONFIRMED,
                ORDER_STATUS.OUT_FOR_DELIVERY,
                ORDER_STATUS.DELIVERED,
            ],
            [PERMISSIONS.KITCHEN_UPDATE]: [
                ORDER_STATUS.CONFIRMED,
                ORDER_STATUS.PREPARING,
                ORDER_STATUS.READY,
            ],
        };

        const permitted = Object.entries(allowedByPermission).some(
            ([permission, statuses]) =>
                hasPermission(user, permission) &&
                statuses.includes(orderStatus)
        );

        if (!permitted) {
            throw ApiError.forbidden(
                "You are not permitted to set this order status."
            );
        }

        const transitions = {
            [ORDER_STATUS.PENDING]: [
                ORDER_STATUS.CONFIRMED,
                ORDER_STATUS.PREPARING,
                ORDER_STATUS.CANCELLED,
            ],
            [ORDER_STATUS.CONFIRMED]: [
                ORDER_STATUS.PREPARING,
                ORDER_STATUS.OUT_FOR_DELIVERY,
                ORDER_STATUS.CANCELLED,
            ],
            [ORDER_STATUS.PREPARING]: [
                ORDER_STATUS.READY,
                ORDER_STATUS.OUT_FOR_DELIVERY,
                ORDER_STATUS.DELIVERED,
                ORDER_STATUS.CANCELLED,
            ],
            [ORDER_STATUS.READY]: [
                ORDER_STATUS.OUT_FOR_DELIVERY,
                ORDER_STATUS.DELIVERED,
                ORDER_STATUS.CANCELLED,
            ],
            [ORDER_STATUS.OUT_FOR_DELIVERY]: [
                ORDER_STATUS.DELIVERED,
                ORDER_STATUS.CANCELLED,
            ],
        };

        if (order.orderStatus === orderStatus) {
            return order;
        }

        if (
            !transitions[order.orderStatus]?.includes(orderStatus)
        ) {
            throw ApiError.badRequest(
                `Cannot change order status from ${order.orderStatus} to ${orderStatus}.`
            );
        }

        if (orderStatus === ORDER_STATUS.CANCELLED) {
            await this.restoreOrderStock(order);
            order.cancelledAt = new Date();
        }

        if (orderStatus === ORDER_STATUS.DELIVERED) {
            order.deliveredAt = new Date();
        }

        // Delivery does not automatically mean payment succeeded.
        // Payment status must be updated by the payment workflow.
        order.orderStatus = orderStatus;

        await order.save();

        return order;
    }

    async cancelOrder(id, user) {
        const order = await Order.findById(id);

        if (!order) {
            throw ApiError.notFound("Order not found.");
        }

        if (
            user?.role !== ROLES.CUSTOMER &&
            !hasPermission(user, PERMISSIONS.ORDERS_CANCEL)
        ) {
            throw ApiError.forbidden(
                "You are not permitted to cancel orders."
            );
        }

        // Customers can cancel only their own orders, and only
        // before the kitchen starts preparing them.
        if (user.role === ROLES.CUSTOMER) {
            this.checkOrderAccess(order, user);

            if (!CUSTOMER_CANCELLABLE.includes(order.orderStatus)) {
                throw ApiError.badRequest(
                    "This order is already being prepared and can no longer be cancelled. Please contact the restaurant."
                );
            }
        }

        if (
            order.orderStatus === ORDER_STATUS.DELIVERED ||
            order.orderStatus === ORDER_STATUS.CANCELLED
        ) {
            throw ApiError.badRequest(
                "This order can no longer be cancelled."
            );
        }

        await this.restoreOrderStock(order);

        order.orderStatus = ORDER_STATUS.CANCELLED;
        order.cancelledAt = new Date();

        await order.save();

        return order;
    }

}

export default new OrderService();