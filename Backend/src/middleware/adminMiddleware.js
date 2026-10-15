import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const adminMiddleware = asyncHandler(async (req, res, next) => {

    if (!req.user) {
        throw ApiError.unauthorized("Please login to continue.");
    }

    if (req.user.role !== "admin") {
        throw ApiError.forbidden("Access denied. Admin only.");
    }

    next();

});

export default adminMiddleware;
export const adminOnly = adminMiddleware;