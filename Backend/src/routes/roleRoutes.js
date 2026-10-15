import express from "express";
import {
    getMyPermissions,
    getRoles,
    updateRolePermissions,
} from "../controllers/roleController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Any logged-in user: their own permissions
router.get("/me", getMyPermissions);

// Roles & permissions management is admin only (not grantable to managers)
router.get("/", adminMiddleware, getRoles);
router.put("/:role", adminMiddleware, updateRolePermissions);

export default router;
