import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ROLES } from "../constants/roles.js";

// True when the logged-in user has the permission. Admins always do.
// authMiddleware attaches user.permissions.
export const hasPermission = (user, permission) =>
    user?.role === ROLES.ADMIN ||
    (Array.isArray(user?.permissions) && user.permissions.includes(permission));

/**
 * Allow the request when the user has ANY of the given permissions.
 * router.get("/", authMiddleware, requirePermission(PERMISSIONS.ORDERS_READ), handler)
 */
const requirePermission = (...permissions) =>
    asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw ApiError.unauthorized("Please login to continue.");
        }

        if (!permissions.some((permission) => hasPermission(req.user, permission))) {
            throw ApiError.forbidden(
                "You do not have permission to perform this action."
            );
        }

        next();
    });

export default requirePermission;
