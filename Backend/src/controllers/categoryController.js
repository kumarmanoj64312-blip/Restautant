import CategoryService from "../services/categoryService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

// ===============================
// Create Category
// ===============================
export const createCategory = asyncHandler(async (req, res) => {

    const category = await CategoryService.createCategory(
        req.body,
        req.file
    );

    return ApiResponse.created(
        res,
        "Category created successfully.",
        category
    );

});

// ===============================
// Get All Categories
// ===============================
export const getCategory = asyncHandler(async (req, res) => {

    const result = await CategoryService.getCategory(req.query);

    return ApiResponse.success(
        res,
        "Categories fetched successfully.",
        result
    );

});

// ===============================
// Get Active Categories
// ===============================
export const getActiveCategory = asyncHandler(async (req, res) => {

    const categories =
        await CategoryService.getActiveCategory();

    return ApiResponse.success(
        res,
        "Active categories fetched successfully.",
        categories
    );

});

// ===============================
// Get Category By ID
// ===============================
export const getCategoryById = asyncHandler(async (req, res) => {

    const category =
        await CategoryService.getCategoryById(req.params.id);

    return ApiResponse.success(
        res,
        "Category fetched successfully.",
        category
    );

});

// ===============================
// Update Category
// ===============================
export const updateCategory = asyncHandler(async (req, res) => {

    const category =
        await CategoryService.updateCategory(
            req.params.id,
            req.body,
            req.file
        );

    return ApiResponse.success(
        res,
        "Category updated successfully.",
        category
    );

});

// ===============================
// Delete Category
// ===============================
export const deleteCategory = asyncHandler(async (req, res) => {

    await CategoryService.deleteCategory(req.params.id);

    return ApiResponse.success(
        res,
        "Category deleted successfully."
    );

});

// ===============================
// Toggle Category Status
// ===============================
export const toggleCategoryStatus = asyncHandler(async (req, res) => {

    const category =
        await CategoryService.toggleCategoryStatus(
            req.params.id
        );

    return ApiResponse.success(
        res,
        category.isActive
            ? "Category activated successfully."
            : "Category deactivated successfully.",
        category
    );

});