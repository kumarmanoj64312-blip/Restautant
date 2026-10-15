import express from "express";
import {
    placeOrder,
    placePosOrder,
    getKitchenOrders,
    getMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
} from "../controllers/orderController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";
import authorizeRoles from "../middleware/authorizeRoles.js";
import { ROLES } from "../constants/roles.js";
import {
    validatePlaceOrder,
    validatePosOrder,
} from "../validation/orderValidation.js";

const router = express.Router();

router.use(authMiddleware);

// Customers (and admins/managers on their behalf) place website orders.
router.post(
    "/",
    authorizeRoles(
        ROLES.ADMIN,
        ROLES.MANAGER,
        ROLES.CUSTOMER
    ),
    validatePlaceOrder,
    placeOrder
);

// Counter orders (dine-in / takeaway) from the POS.
router.post(
    "/pos",
    requirePermission(PERMISSIONS.POS_ACCESS),
    validatePosOrder,
    placePosOrder
);

// Live tickets for the kitchen display.
// Must stay above "/:id" so "kitchen" is not treated as an order ID.
router.get(
    "/kitchen",
    requirePermission(PERMISSIONS.KITCHEN_READ),
    getKitchenOrders
);

// Each customer can access their own order history.
router.get(
    "/my-orders",
    authorizeRoles(ROLES.CUSTOMER),
    getMyOrders
);

// All orders. The POS also reads "Ready" orders to hand them over.
router.get(
    "/",
    requirePermission(
        PERMISSIONS.ORDERS_READ,
        PERMISSIONS.POS_ACCESS
    ),
    getAllOrders
);

// Authenticated users can request an order by ID.
// The controller must enforce ownership and role permissions.
router.get("/:id", getOrderById);

// Status changes. orderService limits which statuses each permission may set.
router.patch(
    "/:id/status",
    requirePermission(
        PERMISSIONS.ORDERS_UPDATE,
        PERMISSIONS.POS_ACCESS,
        PERMISSIONS.KITCHEN_UPDATE
    ),
    updateOrderStatus
);

// Customers cancel their own early orders; staff need orders.cancel
// (checked in orderService.cancelOrder).
router.patch(
    "/:id/cancel",
    authorizeRoles(
        ROLES.ADMIN,
        ROLES.MANAGER,
        ROLES.CUSTOMER
    ),
    cancelOrder
);

export default router;