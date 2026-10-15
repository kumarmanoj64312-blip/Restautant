import heroService from "../services/heroService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createHero = asyncHandler(async (req, res, next) => {
    const hero = await heroService.createHero(
        req.body,
        req.file
    );

    return ApiResponse.created(
        res,
        "Hero banner created successfully.",
        hero
    );
});

export const getHeroes = asyncHandler(async (req, res, next) => {
    const heroes = await heroService.getHeroes(
        req.query
    );

    return ApiResponse.success(
        res,
        "Hero banners fetched successfully.",
        heroes
    );
});

export const getActiveHeroes = asyncHandler(async (req, res, next) => {
    const heroes =
        await heroService.getActiveHeroes();

    return ApiResponse.success(
        res,
        "Active hero banners fetched successfully.",
        heroes
    );
});

export const getHeroById = asyncHandler(async (req, res, next) => {
    const hero =
        await heroService.getHeroById(
            req.params.id
        );

    return ApiResponse.success(
        res,
        "Hero banner fetched successfully.",
        hero
    );
});

export const updateHero = asyncHandler(async (req, res, next) => {
    const hero =
        await heroService.updateHero(
            req.params.id,
            req.body,
            req.file
        );

    return ApiResponse.success(
        res,
        "Hero banner updated successfully.",
        hero
    );
});

export const deleteHero = asyncHandler(async (req, res, next) => {
    await heroService.deleteHero(
        req.params.id
    );

    return ApiResponse.success(
        res,
        "Hero banner deleted successfully."
    );
});

export const toggleHeroStatus = asyncHandler(async (req, res, next) => {
    const hero =
        await heroService.toggleHeroStatus(
            req.params.id
        );

    return ApiResponse.success(
        res,
        hero.isActive
            ? "Hero banner activated successfully."
            : "Hero banner deactivated successfully.",
        hero
    );
});

export const changeDisplayOrder = asyncHandler(async (req, res, next) => {
    const { displayOrder } = req.body;

    const hero =
        await heroService.changeDisplayOrder(
            req.params.id,
            displayOrder
        );

    return ApiResponse.success(
        res,
        "Hero banner display order updated successfully.",
        hero
    );
});