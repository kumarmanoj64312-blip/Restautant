import authService from "../services/authService.js";
import staffService from "../services/staffService.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ROLES, CLOUDINARY_FOLDERS } from "../constants/roles.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

export const register = asyncHandler(async (req, res) => {
    // Public registration always creates a customer account.
    const { name, email, password, phone, address } = req.body;

    const result = await authService.register({
        name,
        email,
        password,
        phone,
        address,
        role: ROLES.CUSTOMER,
    });

    return ApiResponse.created(
        res,
        "User registered successfully.",
        result
    );
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    return ApiResponse.success(
        res,
        "Login successful.",
        result
    );
});

export const logout = asyncHandler(async (req, res) => {
    return ApiResponse.success(res, "Logout successful.");
});

export const getProfile = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user._id);

    return ApiResponse.success(
        res,
        "Profile fetched successfully.",
        user
    );
});

export const updateProfile = asyncHandler(async (req, res) => {
    let avatar = null;

    // multer saves the file to disk; push it to Cloudinary here
    if (req.file) {
        const uploaded = await uploadToCloudinary(
            req.file.path,
            CLOUDINARY_FOLDERS.USER
        );

        avatar = {
            url: uploaded.url,
            public_id: uploaded.public_id,
        };
    } else if (req.cloudinaryImage) {
        avatar = {
            url: req.cloudinaryImage.url,
            public_id: req.cloudinaryImage.public_id,
        };
    }

    // Never allow profile updates to change roles or block status.
    const { name, phone, address } = req.body;

    const user = await authService.updateProfile(req.user._id, {
        name,
        phone,
        address,
        ...(avatar ? { avatar } : {}),
    });

    return ApiResponse.success(
        res,
        "Profile updated successfully.",
        user
    );
});

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(
        req.user._id,
        currentPassword,
        newPassword
    );

    return ApiResponse.success(
        res,
        "Password changed successfully."
    );
});

export const getUsers = asyncHandler(async (req, res) => {
    const users = await authService.getAllUsers();

    return ApiResponse.success(
        res,
        "Users fetched successfully.",
        users
    );
});

export const getUser = asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.params.id);

    return ApiResponse.success(
        res,
        "User fetched successfully.",
        user
    );
});

export const deleteUser = asyncHandler(async (req, res) => {
    const target = await User.findById(req.params.id);

    if (!target) {
        throw ApiError.notFound("User not found.");
    }

    staffService.ensureNotSelf(target, req.user, "delete");
    await staffService.ensureAnotherAdmin(target);

    await authService.deleteUser(req.params.id);

    return ApiResponse.success(
        res,
        "User deleted successfully."
    );
});

export const toggleBlockUser = asyncHandler(async (req, res) => {
    const target = await User.findById(req.params.id);

    if (!target) {
        throw ApiError.notFound("User not found.");
    }

    staffService.ensureNotSelf(target, req.user, "block");

    if (!target.isBlocked) {
        await staffService.ensureAnotherAdmin(target);
    }

    const user = await authService.toggleBlockUser(req.params.id);

    return ApiResponse.success(
        res,
        user.isBlocked
            ? "User blocked successfully."
            : "User unblocked successfully.",
        user
    );
});