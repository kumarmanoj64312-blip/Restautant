import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import permissionService from "../services/permissionService.js";
import { ROLES } from "../constants/roles.js";

const authMiddleware = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw ApiError.unauthorized("Please login to continue.");
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        throw ApiError.unauthorized("Invalid authentication token.");
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured.");
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {
            throw ApiError.unauthorized(
                "Your session is invalid or expired. Please login again."
            );
        }

        throw error;
    }

    if (!decoded || typeof decoded !== "object" || !decoded.id) {
        throw ApiError.unauthorized("Invalid authentication token.");
    }

    const user = await User.findById(decoded.id);

    if (!user) {
        throw ApiError.unauthorized("User not found. Please login again.");
    }

    if (user.isBlocked) {
        throw ApiError.forbidden("Your account has been blocked.");
    }

    // Accounts on a role that no longer exists (e.g. the old cashier role)
    if (!Object.values(ROLES).includes(user.role)) {
        throw ApiError.forbidden(
            "Your account role is no longer supported. Please contact an administrator."
        );
    }

    // Non-enumerable so it is never saved or sent back in responses
    Object.defineProperty(user, "permissions", {
        value: await permissionService.getPermissionsForRole(user.role),
        enumerable: false,
        configurable: true,
    });

    req.user = user;

    next();
});

export default authMiddleware;
export const protect = authMiddleware;