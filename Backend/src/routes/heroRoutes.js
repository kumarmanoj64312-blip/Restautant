import express from "express";
import {
    createHero,
    getHeroes,
    getActiveHeroes,
    getHeroById,
    updateHero,
    deleteHero,
    toggleHeroStatus,
    changeDisplayOrder,
} from "../controllers/heroController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";
import uploadMiddleware from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* ===========================
   Public Routes
=========================== */

router.get(
    "/",
    getHeroes
);

router.get(
    "/active",
    getActiveHeroes
);

router.get(
    "/:id",
    getHeroById
);

/* ===========================
   Staff routes (permission checked per route)
=========================== */

router.post(
    "/",
    authMiddleware,
    requirePermission(PERMISSIONS.BANNERS_CREATE),
    uploadMiddleware.single("image"),
    createHero
);

router.put(
    "/:id",
    authMiddleware,
    requirePermission(PERMISSIONS.BANNERS_UPDATE),
    uploadMiddleware.single("image"),
    updateHero
);

router.patch(
    "/:id/status",
    authMiddleware,
    requirePermission(PERMISSIONS.BANNERS_UPDATE),
    toggleHeroStatus
);

router.patch(
    "/:id/display-order",
    authMiddleware,
    requirePermission(PERMISSIONS.BANNERS_UPDATE),
    changeDisplayOrder
);

router.delete(
    "/:id",
    authMiddleware,
    requirePermission(PERMISSIONS.BANNERS_DELETE),
    deleteHero
);

export default router;