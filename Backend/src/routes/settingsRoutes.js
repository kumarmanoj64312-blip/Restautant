import express from "express";

import {
    getSettings,
    updateSettings,
    deleteSettings,
} from "../controllers/settingsController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = express.Router();

// Public
router.get("/", getSettings);

// Staff (permission checked per route)
router.put(
    "/",
    authMiddleware,
    requirePermission(PERMISSIONS.SETTINGS_UPDATE),
    updateSettings
);

router.delete(
    "/",
    authMiddleware,
    requirePermission(PERMISSIONS.SETTINGS_RESET),
    deleteSettings
);

export default router;