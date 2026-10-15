import menuService from "../services/menuService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

// ==========================
// Create Menu
// ==========================
export const createMenu = asyncHandler(async (req, res) => {


    const menu = await menuService.createMenu(
        req.body,
        req.file
    );

    return ApiResponse.created(
        res,
        "Menu created successfully.",
        menu
    );
});

// ==========================
// Get All Menus
// ==========================
export const getMenus = asyncHandler(async (req, res) => {

    const menus = await menuService.getMenus(req.query);

    return ApiResponse.success(
        res,
        "Menus fetched successfully.",
        menus
    );

});

// ==========================
// Get Menu By Id
// ==========================
export const getMenuById = asyncHandler(async (req, res) => {

    const menu = await menuService.getMenuById(req.params.id);

    return ApiResponse.success(
        res,
        "Menu fetched successfully.",
        menu
    );

});

// ==========================
// Update Menu
// ==========================
export const updateMenu = asyncHandler(async (req, res) => {

    const menu = await menuService.updateMenu(
        req.params.id,
        req.body,
        req.file
    );

    return ApiResponse.success(
        res,
        "Menu updated successfully.",
        menu
    );

});

// ==========================
// Delete Menu
// ==========================
export const deleteMenu = asyncHandler(async (req, res) => {

    await menuService.deleteMenu(req.params.id);

    return ApiResponse.success(
        res,
        "Menu deleted successfully."
    );

});

// ==========================
// Popular Menus
// ==========================
export const getPopularMenus = asyncHandler(async (req, res) => {

    const menus = await menuService.getPopularMenus(req.query.limit);

    return ApiResponse.success(
        res,
        "Popular menus fetched successfully.",
        menus
    );

});

export const togglePopular = asyncHandler(async (req, res) => {
    const menu = await menuService.togglePopular(req.params.id);

    return ApiResponse.success(
        res,
        "Popular status updated successfully.",
        menu
    );
});