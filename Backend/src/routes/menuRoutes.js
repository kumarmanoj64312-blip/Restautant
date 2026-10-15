import express from "express";

import {
    createMenu,
    getMenus,
    getMenuById,
    updateMenu,
    deleteMenu,
    getPopularMenus,
    togglePopular,
} from "../controllers/menuController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";
import uploadMiddleware from "../middleware/uploadMiddleware.js";


const router = express.Router();

// ==========================
// Public Routes
// ==========================

router.get("/", getMenus);

router.get("/popular", getPopularMenus);

router.get("/:id", getMenuById);

// ==========================
// Staff routes (permission checked per route)
// ==========================

router.post(
    "/",
    authMiddleware,
    requirePermission(PERMISSIONS.MENU_CREATE),
    uploadMiddleware.single("image"),
    createMenu
);

router.put(
    "/:id",
    authMiddleware,
    requirePermission(PERMISSIONS.MENU_UPDATE),
    uploadMiddleware.single("image"),
    updateMenu
);

// ==========================
// Staff routes (permission checked per route)
// ==========================

router.delete(
    "/:id",
    authMiddleware,
    requirePermission(PERMISSIONS.MENU_DELETE),
    deleteMenu
);

router.patch(
    "/:id/popular",
    authMiddleware,
    requirePermission(PERMISSIONS.MENU_UPDATE),
    togglePopular
);

export default router;