import express from "express";
import {
    clockIn,
    clockOut,
    createEntry,
    deleteEntry,
    getDailyReport,
    getHistory,
    getMonthlyReport,
    getMyStatus,
    getStaffList,
    updateEntry,
} from "../controllers/attendanceController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/authorizeRoles.js";
import requirePermission from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";
import { STAFF_ROLES } from "../constants/roles.js";

const router = express.Router();

// Staff only (admin, manager, kitchen)
router.use(authMiddleware, authorizeRoles(...STAFF_ROLES));

// Self service
router.get("/status", getMyStatus);
router.post("/clock-in", clockIn);
router.post("/clock-out", clockOut);

// Own history by default; ?userId= needs attendance.read (checked in the service)
router.get("/", getHistory);

// Everyone's attendance
router.get("/staff", requirePermission(PERMISSIONS.ATTENDANCE_READ), getStaffList);
router.get("/report/daily", requirePermission(PERMISSIONS.ATTENDANCE_READ), getDailyReport);
router.get("/report/monthly", requirePermission(PERMISSIONS.ATTENDANCE_READ), getMonthlyReport);

// Manual corrections
router.post("/", requirePermission(PERMISSIONS.ATTENDANCE_MANAGE), createEntry);
router.put("/:id", requirePermission(PERMISSIONS.ATTENDANCE_MANAGE), updateEntry);
router.delete("/:id", requirePermission(PERMISSIONS.ATTENDANCE_MANAGE), deleteEntry);

export default router;
