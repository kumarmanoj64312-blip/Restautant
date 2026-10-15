import express from "express";
import {
    addHoliday,
    applyLeave,
    approveLeave,
    cancelLeave,
    deleteHoliday,
    getHolidays,
    getLeaves,
    getLeaveTypes,
    getMyBalances,
    rejectLeave,
} from "../controllers/leaveController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/authorizeRoles.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";
import { STAFF_ROLES } from "../constants/roles.js";

const router = express.Router();

// Staff only (admin, manager, kitchen)
router.use(authMiddleware, authorizeRoles(...STAFF_ROLES));

// Holidays: everyone can see, holidays.manage can change
router.get("/holidays", getHolidays);
router.post("/holidays", requirePermission(PERMISSIONS.HOLIDAYS_MANAGE), addHoliday);
router.delete("/holidays/:id", requirePermission(PERMISSIONS.HOLIDAYS_MANAGE), deleteHoliday);

// Self service
router.get("/types", getLeaveTypes);
router.get("/balance", getMyBalances);
router.post("/", applyLeave);
router.patch("/:id/cancel", cancelLeave);

// Own requests, or everyone's with leave.read (checked in the service)
router.get("/", getLeaves);

// Approvals
router.patch("/:id/approve", requirePermission(PERMISSIONS.LEAVE_APPROVE), approveLeave);
router.patch("/:id/reject", requirePermission(PERMISSIONS.LEAVE_APPROVE), rejectLeave);

export default router;
