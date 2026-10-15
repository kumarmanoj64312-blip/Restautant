import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { ROLES } from "../constants/roles.js";

class AuthService {
    // Register Customer
    async register(userData) {
        const { name, email, password, phone, address } = userData;

        if (!name || !email || !password || !phone) {
            throw ApiError.badRequest(
                "Name, email, password, and phone are required."
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
            throw ApiError.badRequest("Please enter a valid email address.");
        }

        if (password.length < 6) {
            throw ApiError.badRequest(
                "Password must be at least 6 characters long."
            );
        }

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            throw ApiError.conflict("Email already exists.");
        }

        // Public registration must never assign staff privileges.
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            phone: phone.trim(),
            address: address?.trim() || "",
            role: ROLES.CUSTOMER,
        });

        const token = user.generateAccessToken();

        const userResponse = await User.findById(user._id)
            .select("-password");

        return {
            user: userResponse,
            token,
        };
    }

    // Login User
    async login(email, password) {
        if (!email || !password) {
            throw ApiError.badRequest(
                "Email and password are required."
            );
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        }).select("+password");

        if (!user) {
            throw ApiError.unauthorized(
                "Invalid email or password."
            );
        }

        if (user.isBlocked) {
            throw ApiError.forbidden(
                "Your account has been blocked."
            );
        }

        const isPasswordCorrect =
            await user.comparePassword(password);

        if (!isPasswordCorrect) {
            throw ApiError.unauthorized(
                "Invalid email or password."
            );
        }

        user.lastLogin = new Date();
        await user.save();

        const token = user.generateAccessToken();

        const userResponse = await User.findById(user._id)
            .select("-password");

        return {
            user: userResponse,
            token,
        };
    }

    // Get Profile
    async getProfile(userId) {
        const user = await User.findById(userId)
            .select("-password");

        if (!user) {
            throw ApiError.notFound("User not found.");
        }

        return user;
    }

    // Update Profile
    async updateProfile(userId, data) {
        const user = await User.findById(userId);

        if (!user) {
            throw ApiError.notFound("User not found.");
        }

        if (data.name !== undefined) {
            user.name = data.name;
        }

        if (data.phone !== undefined) {
            user.phone = data.phone;
        }

        if (data.address !== undefined) {
            user.address = data.address;
        }

        if (data.avatar) {
            user.avatar = data.avatar;
        }

        // Role and isBlocked cannot be changed through profile updates.
        await user.save();

        return User.findById(user._id)
            .select("-password");
    }

    // Change Password
    async changePassword(userId, currentPassword, newPassword) {
        if (!currentPassword || !newPassword) {
            throw ApiError.badRequest(
                "Current password and new password are required."
            );
        }

        if (newPassword.length < 6) {
            throw ApiError.badRequest(
                "New password must be at least 6 characters long."
            );
        }

        const user = await User.findById(userId)
            .select("+password");

        if (!user) {
            throw ApiError.notFound("User not found.");
        }

        const isPasswordCorrect =
            await user.comparePassword(currentPassword);

        if (!isPasswordCorrect) {
            throw ApiError.badRequest(
                "Current password is incorrect."
            );
        }

        user.password = newPassword;
        await user.save();

        return true;
    }

    // Get All Users
    async getAllUsers() {
        return User.find()
            .select("-password")
            .sort({ createdAt: -1 });
    }

    // Get Single User
    async getUserById(userId) {
        const user = await User.findById(userId)
            .select("-password");

        if (!user) {
            throw ApiError.notFound("User not found.");
        }

        return user;
    }

    // Delete User
    async deleteUser(userId) {
        const user = await User.findById(userId);

        if (!user) {
            throw ApiError.notFound("User not found.");
        }

        await user.deleteOne();

        return true;
    }

    // Block / Unblock User
    async toggleBlockUser(userId) {
        const user = await User.findById(userId);

        if (!user) {
            throw ApiError.notFound("User not found.");
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        return User.findById(user._id)
            .select("-password");
    }
}

export default new AuthService();