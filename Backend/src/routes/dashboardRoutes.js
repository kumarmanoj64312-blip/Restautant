import express from "express";

import {
    getDashboardStats,
    getRecentOrders,
} from "../controllers/dashboardController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = express.Router();

/* ===========================
   Dashboard Statistics
=========================== */

router.get(
    "/stats",
    authMiddleware,
    requirePermission(PERMISSIONS.DASHBOARD_READ),
    getDashboardStats
);

/* ===========================
   Recent Orders
=========================== */

router.get(
    "/recent-orders",
    authMiddleware,
    requirePermission(PERMISSIONS.DASHBOARD_READ),
    getRecentOrders
);

export default router;