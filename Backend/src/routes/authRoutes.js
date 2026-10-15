import express from "express";

import {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    getUsers,
    getUser,
    deleteUser,
    toggleBlockUser,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ==========================
// Public Routes
// ==========================

router.post("/register", register);
router.post("/login", login);

// ==========================
// Authenticated Routes
// ==========================

router.post("/logout", authMiddleware, logout);

router.get("/profile", authMiddleware, getProfile);

router.put(
    "/profile",
    authMiddleware,
    upload.single("avatar"),
    updateProfile
);

router.put(
    "/change-password",
    authMiddleware,
    changePassword
);

// ==========================
// Admin-Only User Management
// ==========================

router.get(
    "/users",
    authMiddleware,
    adminMiddleware,
    getUsers
);

router.get(
    "/users/:id",
    authMiddleware,
    adminMiddleware,
    getUser
);

router.delete(
    "/users/:id",
    authMiddleware,
    adminMiddleware,
    deleteUser
);

router.patch(
    "/users/:id/block",
    authMiddleware,
    adminMiddleware,
    toggleBlockUser
);

export default router;