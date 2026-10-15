import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const authorizeRoles = (...allowedRoles) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw ApiError.unauthorized(
                "Please login to continue."
            );
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw ApiError.forbidden(
                "You do not have permission to perform this action."
            );
        }

        next();
    });
};

export default authorizeRoles;