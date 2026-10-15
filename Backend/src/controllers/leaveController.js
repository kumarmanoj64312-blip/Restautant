import leaveService from "../services/leaveService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { LEAVE_STATUS, LEAVE_TYPES } from "../constants/hr.js";

export const getLeaveTypes = asyncHandler(async (req, res) => {
    return ApiResponse.success(res, "Leave types fetched.", LEAVE_TYPES);
});

export const getMyBalances = asyncHandler(async (req, res) => {
    const balances = await leaveService.getBalances(req.user._id, req.query.year);
    return ApiResponse.success(res, "Leave balance fetched.", balances);
});

export const getLeaves = asyncHandler(async (req, res) => {
    const leaves = await leaveService.list(req.query, req.user);
    return ApiResponse.success(res, "Leave requests fetched.", leaves);
});

export const applyLeave = asyncHandler(async (req, res) => {
    const leave = await leaveService.apply(req.user, req.body);
    return ApiResponse.created(res, "Leave request sent.", leave);
});

export const approveLeave = asyncHandler(async (req, res) => {
    const leave = await leaveService.review(req.params.id, LEAVE_STATUS.APPROVED, req.body?.note, req.user);
    return ApiResponse.success(res, "Leave approved.", leave);
});

export const rejectLeave = asyncHandler(async (req, res) => {
    const leave = await leaveService.review(req.params.id, LEAVE_STATUS.REJECTED, req.body?.note, req.user);
    return ApiResponse.success(res, "Leave rejected.", leave);
});

export const cancelLeave = asyncHandler(async (req, res) => {
    const leave = await leaveService.cancel(req.params.id, req.user);
    return ApiResponse.success(res, "Leave cancelled.", leave);
});

export const getHolidays = asyncHandler(async (req, res) => {
    const holidays = await leaveService.listHolidays(req.query.year);
    return ApiResponse.success(res, "Holidays fetched.", holidays);
});

export const addHoliday = asyncHandler(async (req, res) => {
    const holiday = await leaveService.addHoliday(req.body);
    return ApiResponse.created(res, "Holiday added.", holiday);
});

export const deleteHoliday = asyncHandler(async (req, res) => {
    await leaveService.deleteHoliday(req.params.id);
    return ApiResponse.success(res, "Holiday removed.");
});
