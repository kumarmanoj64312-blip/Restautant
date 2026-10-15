import orderService from "../services/orderService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { ORDER_STATUS } from "../constants/roles.js";

export const placeOrder = asyncHandler(async (req, res) => {
    const order = await orderService.placeOrder(
        req.user._id,
        req.body
    );

    return ApiResponse.created(
        res,
        "Order placed successfully.",
        order
    );
});

export const placePosOrder = asyncHandler(async (req, res) => {
    const order = await orderService.placePosOrder(
        req.user,
        req.body
    );

    return ApiResponse.created(
        res,
        "POS order placed successfully.",
        order
    );
});

export const getKitchenOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getKitchenOrders();

    return ApiResponse.success(
        res,
        "Kitchen orders fetched successfully.",
        orders
    );
});

export const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getMyOrders(
        req.user._id,
        req.query
    );

    return ApiResponse.success(
        res,
        "Orders fetched successfully.",
        orders
    );
});

export const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getAllOrders(req.query);

    return ApiResponse.success(
        res,
        "All orders fetched successfully.",
        orders
    );
});

export const getOrderById = asyncHandler(async (req, res) => {
    const order = await orderService.getOrderById(
        req.params.id,
        req.user
    );

    return ApiResponse.success(
        res,
        "Order fetched successfully.",
        order
    );
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderStatus } = req.body;

    if (!Object.values(ORDER_STATUS).includes(orderStatus)) {
        throw ApiError.badRequest("Invalid order status.");
    }

    // Which statuses this user may set is checked in orderService

    const order = await orderService.updateOrderStatus(
        req.params.id,
        orderStatus,
        req.user
    );

    return ApiResponse.success(
        res,
        "Order status updated successfully.",
        order
    );
});

export const cancelOrder = asyncHandler(async (req, res) => {
    const order = await orderService.cancelOrder(
        req.params.id,
        req.user
    );

    return ApiResponse.success(
        res,
        "Order cancelled successfully.",
        order
    );
});

