const validateCategory = (req, res, next) => {
    const { name, description } = req.body;

    const errors = [];

    if (!name || name.trim() === "") {
        errors.push("Category name is required.");
    } else if (name.trim().length < 3) {
        errors.push("Category name must be at least 3 characters.");
    } else if (name.trim().length > 50) {
        errors.push("Category name cannot exceed 50 characters.");
    }

    if (description && description.length > 500) {
        errors.push("Description cannot exceed 500 characters.");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors,
        });
    }

    req.body.name = name.trim();

    if (description) {
        req.body.description = description.trim();
    }

    next();
};

const validateCategoryId = (req, res, next) => {
    const { id } = req.params;

    if (!id || id.length !== 24) {
        return res.status(400).json({
            success: false,
            message: "Invalid Category ID.",
        });
    }

    next();
};

export {
    validateCategory,
    validateCategoryId,
};