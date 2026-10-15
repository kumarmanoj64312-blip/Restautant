import express from "express";

import {
    createCategory,
    getCategory,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getActiveCategory,
    toggleCategoryStatus,
} from "../controllers/categoryController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";
import uploadMiddleware from "../middleware/uploadMiddleware.js";


import {
    validateCategory,
    validateCategoryId,
} from "../validation/categoryValidation.js";

const router = express.Router();

// ======================================
// Public Routes
// ======================================

router.get("/", getCategory);

router.get("/active", getActiveCategory);

router.get(
    "/:id",
    validateCategoryId,
    getCategoryById
);

// ======================================
// Staff routes (permission checked per route)
// ======================================

router.post(
    "/",
    authMiddleware,
    requirePermission(PERMISSIONS.CATEGORIES_CREATE),
    uploadMiddleware.single("image"),
    validateCategory,
    createCategory
);

router.put(
    "/:id",
    authMiddleware,
    requirePermission(PERMISSIONS.CATEGORIES_UPDATE),
    uploadMiddleware.single("image"),
    validateCategoryId,
    validateCategory,
    updateCategory
);

// ======================================
// Staff routes (permission checked per route)
// ======================================

router.patch(
    "/:id/status",
    authMiddleware,
    requirePermission(PERMISSIONS.CATEGORIES_UPDATE),
    validateCategoryId,
    toggleCategoryStatus
);

router.delete(
    "/:id",
    authMiddleware,
    requirePermission(PERMISSIONS.CATEGORIES_DELETE),
    validateCategoryId,
    deleteCategory
);

export default router;