import express from "express";
import {
    getStaff,
    createStaff,
    promoteToStaff,
    updateStaff,
    deleteStaff,
} from "../controllers/staffController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Staff management is admin only (not grantable to managers)
router.use(authMiddleware, adminMiddleware);

router.get("/", getStaff);
router.post("/", createStaff);
router.post("/promote", promoteToStaff);
router.patch("/:id", updateStaff);
router.delete("/:id", deleteStaff);

export default router;
