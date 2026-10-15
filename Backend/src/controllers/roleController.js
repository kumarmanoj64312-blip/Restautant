import permissionService from "../services/permissionService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

// Current user's role and permissions (used by the frontend to show/hide UI)
export const getMyPermissions = asyncHandler(async (req, res) => {
    return ApiResponse.success(res, "Permissions fetched successfully.", {
        role: req.user.role,
        permissions: req.user.permissions,
    });
});

export const getRoles = asyncHandler(async (req, res) => {
    const data = await permissionService.listRoles();

    return ApiResponse.success(res, "Roles fetched successfully.", data);
});

export const updateRolePermissions = asyncHandler(async (req, res) => {
    const data = await permissionService.updateRolePermissions(
        req.params.role,
        req.body.permissions,
        req.user
    );

    return ApiResponse.success(res, "Permissions updated.", data);
});
