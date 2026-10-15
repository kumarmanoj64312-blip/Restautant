class ApiError extends Error {

    constructor(
        statusCode,
        message
    ) {

        super(message);

        this.statusCode = statusCode;

        this.success = false;

        Error.captureStackTrace(
            this,
            this.constructor
        );

    }

    // ==========================
    // 400 Bad Request
    // ==========================
    static badRequest(
        message = "Bad Request."
    ) {

        return new ApiError(
            400,
            message
        );

    }

    // ==========================
    // 401 Unauthorized
    // ==========================
    static unauthorized(
        message = "Unauthorized."
    ) {

        return new ApiError(
            401,
            message
        );

    }

    // ==========================
    // 403 Forbidden
    // ==========================
    static forbidden(
        message = "Forbidden."
    ) {

        return new ApiError(
            403,
            message
        );

    }

    // ==========================
    // 404 Not Found
    // ==========================
    static notFound(
        message = "Resource not found."
    ) {

        return new ApiError(
            404,
            message
        );

    }

    // ==========================
    // 409 Conflict
    // ==========================
    static conflict(
        message = "Conflict."
    ) {

        return new ApiError(
            409,
            message
        );

    }

    // ==========================
    // 500 Internal Server Error
    // ==========================
    static internal(
        message = "Internal Server Error."
    ) {

        return new ApiError(
            500,
            message
        );

    }

}

export default ApiError;