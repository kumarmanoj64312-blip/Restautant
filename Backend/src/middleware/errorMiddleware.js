import ApiError from "../utils/ApiError.js";


// ==========================
// 404 Not Found Middleware
// ==========================
export const notFound = (req, res, next) => {

    const error = new ApiError(
        404,
        `Route Not Found - ${req.originalUrl}`
    );

    next(error);

};


// ==========================
// Global Error Middleware
// ==========================
const errorMiddleware = (err, req, res, next) => {

    let statusCode = err.statusCode || 500;

    let message = err.message || "Internal Server Error.";


    // ==========================
    // Mongoose Cast Error
    // ==========================
    if (err.name === "CastError") {

        statusCode = 400;

        message = `Invalid ${err.path}.`;

    }


    // ==========================
    // Duplicate Key Error
    // ==========================
    if (err.code === 11000) {

        statusCode = 409;

        const field = Object.keys(err.keyValue)[0];

        message = `${field} already exists.`;

    }


    // ==========================
    // Mongoose Validation Error
    // ==========================
    if (err.name === "ValidationError") {

        statusCode = 400;

        message = Object.values(err.errors)
            .map((error) => error.message)
            .join(", ");

    }


    // ==========================
    // JWT Invalid Token
    // ==========================
    if (err.name === "JsonWebTokenError") {

        statusCode = 401;

        message = "Invalid token.";

    }


    // ==========================
    // JWT Expired
    // ==========================
    if (err.name === "TokenExpiredError") {

        statusCode = 401;

        message = "Token has expired.";

    }


    return res.status(statusCode).json({

        success: false,

        message,

        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack,
        }),

    });

};


export default errorMiddleware;