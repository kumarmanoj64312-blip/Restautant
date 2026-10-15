import attendanceService from "../services/attendanceService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getMyStatus = asyncHandler(async (req, res) => {
    const status = await attendanceService.getStatus(req.user);
    return ApiResponse.success(res, "Attendance status fetched.", status);
});

export const clockIn = asyncHandler(async (req, res) => {
    const status = await attendanceService.clockIn(req.user);
    return ApiResponse.success(res, "Clocked in.", status);
});

export const clockOut = asyncHandler(async (req, res) => {
    const status = await attendanceService.clockOut(req.user);
    return ApiResponse.success(res, "Clocked out.", status);
});

export const getHistory = asyncHandler(async (req, res) => {
    const history = await attendanceService.getHistory(req.query, req.user);
    return ApiResponse.success(res, "Attendance fetched.", history);
});

export const getDailyReport = asyncHandler(async (req, res) => {
    const report = await attendanceService.dailyReport(req.query);
    return ApiResponse.success(res, "Daily report fetched.", report);
});

export const getMonthlyReport = asyncHandler(async (req, res) => {
    const report = await attendanceService.monthlyReport(req.query);
    return ApiResponse.success(res, "Monthly report fetched.", report);
});

export const getStaffList = asyncHandler(async (req, res) => {
    const staff = await attendanceService.listStaff(req.query);
    return ApiResponse.success(res, "Staff fetched.", staff);
});

export const createEntry = asyncHandler(async (req, res) => {
    const entry = await attendanceService.upsertEntry(req.body, req.user);
    return ApiResponse.created(res, "Attendance saved.", entry);
});

export const updateEntry = asyncHandler(async (req, res) => {
    const entry = await attendanceService.updateEntry(req.params.id, req.body, req.user);
    return ApiResponse.success(res, "Attendance updated.", entry);
});

export const deleteEntry = asyncHandler(async (req, res) => {
    await attendanceService.deleteEntry(req.params.id);
    return ApiResponse.success(res, "Attendance entry deleted.");
});
