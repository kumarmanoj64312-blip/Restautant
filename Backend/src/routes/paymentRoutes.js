import express from "express";
import {
    createPayment,
    getPaymentConfig,
    verifyCashOnDelivery,
    verifyRazorpayPayment,
    updatePaymentStatus,
    refundPayment,
    getPaymentById,
    getMyPayments,
    getAllPayments,
    getPaymentStatistics,
    deletePayment,
} from "../controllers/paymentController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import authorizeRoles from "../middleware/authorizeRoles.js";
import { ROLES } from "../constants/roles.js";

import {
    validateCreatePayment,
    validatePaymentId,
    validatePaymentStatus,
    validateRazorpayPayment,
    validateRefund,
} from "../validation/paymentValidator.js";

const router = express.Router();

// Public: is online payment (UPI, cards via Razorpay) available?
router.get("/config", getPaymentConfig);

// All other payment routes require authentication.
router.use(authMiddleware);

// Create a payment for an order.
router.post(
    "/",
    authorizeRoles(
        ROLES.ADMIN,
        ROLES.MANAGER,
        ROLES.CUSTOMER
    ),
    validateCreatePayment,
    createPayment
);

// Customers view their own payments.
router.get(
    "/my-payments",
    authorizeRoles(ROLES.CUSTOMER),
    getMyPayments
);

// View a payment only if authorized by the controller.
router.get(
    "/:id",
    validatePaymentId,
    getPaymentById
);

// Verify an online payment.
router.post(
    "/verify-razorpay",
    authorizeRoles(
        ROLES.ADMIN,
        ROLES.MANAGER,
        ROLES.CUSTOMER
    ),
    validateRazorpayPayment,
    verifyRazorpayPayment
);

// Mark a cash-on-delivery or counter payment as received.
router.patch(
    "/:id/cod",
    requirePermission(PERMISSIONS.PAYMENTS_UPDATE),
    validatePaymentId,
    verifyCashOnDelivery
);

// All payments.
router.get(
    "/",
    requirePermission(PERMISSIONS.PAYMENTS_READ),
    getAllPayments
);

// Payment statistics.
router.get(
    "/statistics/dashboard",
    requirePermission(PERMISSIONS.PAYMENTS_READ),
    getPaymentStatistics
);

// Change payment status.
router.patch(
    "/:id/status",
    requirePermission(PERMISSIONS.PAYMENTS_UPDATE),
    validatePaymentId,
    validatePaymentStatus,
    updatePaymentStatus
);

// Issue refunds.
router.patch(
    "/:id/refund",
    requirePermission(PERMISSIONS.PAYMENTS_REFUND),
    validatePaymentId,
    validateRefund,
    refundPayment
);

// Only Admin can delete payment records.
router.delete(
    "/:id",
    adminMiddleware,
    validatePaymentId,
    deletePayment
);

export default router;