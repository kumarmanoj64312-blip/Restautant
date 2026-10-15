import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { ROLES, STAFF_ROLES } from "../constants/roles.js";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const PHONE_PATTERN = /^\d{10}$/;

const sanitize = (user) => User.findById(user._id).select("-password");

class StaffService {
    // Refuse changes that would leave the restaurant without an active admin
    async ensureAnotherAdmin(user) {
        if (user.role !== ROLES.ADMIN) return;

        const otherAdmins = await User.countDocuments({
            _id: { $ne: user._id },
            role: ROLES.ADMIN,
            isBlocked: false,
        });

        if (otherAdmins === 0) {
            throw ApiError.badRequest(
                "This is the only active admin. Make someone else an admin first."
            );
        }
    }

    ensureNotSelf(target, admin, action) {
        if (target._id.toString() === admin._id.toString()) {
            throw ApiError.badRequest(`You cannot ${action} your own account.`);
        }
    }

    ensureStaffRole(role) {
        if (!STAFF_ROLES.includes(role)) {
            throw ApiError.badRequest(
                `Role must be one of: ${STAFF_ROLES.join(", ")}.`
            );
        }
    }

    async listStaff() {
        return User.find({ role: { $in: STAFF_ROLES } })
            .select("-password")
            .sort({ role: 1, name: 1 });
    }

    // Create a brand new staff account
    async createStaff(data) {
        const name = data.name?.trim();
        const email = data.email?.trim().toLowerCase();
        const phone = data.phone?.trim();
        const { password, role } = data;

        const errors = [];

        if (!name || name.length < 3) errors.push("Name must be at least 3 characters.");
        if (!email || !EMAIL_PATTERN.test(email)) errors.push("Enter a valid email address.");
        if (!phone || !PHONE_PATTERN.test(phone)) errors.push("Enter a 10-digit phone number.");
        if (!password || password.length < 6) errors.push("Password must be at least 6 characters.");
        if (!STAFF_ROLES.includes(role)) errors.push(`Role must be one of: ${STAFF_ROLES.join(", ")}.`);

        if (errors.length > 0) {
            throw ApiError.badRequest(errors.join(" "));
        }

        if (await User.exists({ email })) {
            throw ApiError.conflict(
                "An account with this email already exists. Use \"Existing account\" to give it a staff role."
            );
        }

        const user = await User.create({ name, email, phone, password, role });

        return sanitize(user);
    }

    // Give an existing (usually customer) account a staff role
    async promoteUser({ email, role }, admin) {
        this.ensureStaffRole(role);

        const user = await User.findOne({
            email: email?.trim().toLowerCase(),
        });

        if (!user) {
            throw ApiError.notFound("No account found with that email.");
        }

        this.ensureNotSelf(user, admin, "change the role of");

        if (user.role === role) {
            throw ApiError.badRequest(`This account is already ${role}.`);
        }

        if (role !== ROLES.ADMIN) {
            await this.ensureAnotherAdmin(user);
        }

        user.role = role;
        await user.save();

        return sanitize(user);
    }

    // Edit name/phone, change role (incl. back to customer), block/unblock
    async updateStaff(id, data, admin) {
        const user = await User.findById(id);

        if (!user) {
            throw ApiError.notFound("Staff member not found.");
        }

        if (data.name !== undefined) {
            const name = String(data.name).trim();
            if (name.length < 3) throw ApiError.badRequest("Name must be at least 3 characters.");
            user.name = name;
        }

        if (data.phone !== undefined) {
            const phone = String(data.phone).trim();
            if (!PHONE_PATTERN.test(phone)) throw ApiError.badRequest("Enter a 10-digit phone number.");
            user.phone = phone;
        }

        if (data.role !== undefined && data.role !== user.role) {
            if (!Object.values(ROLES).includes(data.role)) {
                throw ApiError.badRequest("Invalid role.");
            }

            this.ensureNotSelf(user, admin, "change the role of");

            if (data.role !== ROLES.ADMIN) {
                await this.ensureAnotherAdmin(user);
            }

            user.role = data.role;
        }

        if (data.isBlocked !== undefined && Boolean(data.isBlocked) !== user.isBlocked) {
            this.ensureNotSelf(user, admin, "block");

            if (data.isBlocked) {
                await this.ensureAnotherAdmin(user);
            }

            user.isBlocked = Boolean(data.isBlocked);
        }

        await user.save();

        return sanitize(user);
    }

    async deleteStaff(id, admin) {
        const user = await User.findById(id);

        if (!user) {
            throw ApiError.notFound("Staff member not found.");
        }

        this.ensureNotSelf(user, admin, "delete");
        await this.ensureAnotherAdmin(user);

        await user.deleteOne();

        return true;
    }
}

export default new StaffService();
