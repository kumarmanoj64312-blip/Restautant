import staffService from "../services/staffService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getStaff = asyncHandler(async (req, res) => {
    const staff = await staffService.listStaff();

    return ApiResponse.success(res, "Staff fetched successfully.", staff);
});

export const createStaff = asyncHandler(async (req, res) => {
    const staff = await staffService.createStaff(req.body);

    return ApiResponse.created(res, "Staff member added.", staff);
});

export const promoteToStaff = asyncHandler(async (req, res) => {
    const staff = await staffService.promoteUser(req.body, req.user);

    return ApiResponse.success(res, "Staff role assigned.", staff);
});

export const updateStaff = asyncHandler(async (req, res) => {
    const staff = await staffService.updateStaff(req.params.id, req.body, req.user);

    return ApiResponse.success(res, "Staff member updated.", staff);
});

export const deleteStaff = asyncHandler(async (req, res) => {
    await staffService.deleteStaff(req.params.id, req.user);

    return ApiResponse.success(res, "Staff member removed.");
});
