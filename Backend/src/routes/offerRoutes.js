import express from "express";
import {
    getOffers,
    getOfferById,
    createOffer,
    updateOffer,
    deleteOffer
} from "../controllers/offerController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = express.Router();

router.get("/", getOffers);
router.get("/:id", getOfferById);
// Only admins can change offers
router.post("/", authMiddleware, requirePermission(PERMISSIONS.OFFERS_CREATE), createOffer);
router.put("/:id", authMiddleware, requirePermission(PERMISSIONS.OFFERS_UPDATE), updateOffer);
router.delete("/:id", authMiddleware, requirePermission(PERMISSIONS.OFFERS_DELETE), deleteOffer);

export default router;