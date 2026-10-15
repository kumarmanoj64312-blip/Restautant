import Settings from "../models/Settings.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

// ==========================
// Get Settings
// ==========================
export const getSettings = asyncHandler(async (req, res) => {

    let settings = await Settings.findOne();

    if (!settings) {
        settings = await Settings.create({
            restaurantName: "Restautant",
            email: "",
            phone: "",
            address: "",
            deliveryCharge: 0,
            tax: 0,
            currency: "₹",
        });
    }

    return ApiResponse.success(
        res,
        "Settings fetched successfully.",
        settings
    );
});

// ==========================
// Update Settings
// ==========================
export const updateSettings = asyncHandler(async (req, res) => {

    let settings = await Settings.findOne();

    if (!settings) {
        settings = new Settings();
    }

    settings.restaurantName =
        req.body.restaurantName ?? settings.restaurantName;

    settings.email =
        req.body.email ?? settings.email;

    settings.phone =
        req.body.phone ?? settings.phone;

    settings.address =
        req.body.address ?? settings.address;

    settings.deliveryCharge =
        req.body.deliveryCharge ?? settings.deliveryCharge;

    settings.tax =
        req.body.tax ?? settings.tax;

    settings.currency =
        req.body.currency ?? settings.currency;

    await settings.save();

    return ApiResponse.success(
        res,
        "Settings updated successfully.",
        settings
    );
});

// ==========================
// Delete Settings
// ==========================
export const deleteSettings = asyncHandler(async (req, res) => {

    const settings = await Settings.findOne();

    if (!settings) {
        throw new ApiError(404, "Settings not found.");
    }

    await settings.deleteOne();

    return ApiResponse.success(
        res,
        "Settings deleted successfully."
    );
});