import RolePermission from "../models/RolePermission.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { ROLES } from "../constants/roles.js";
import {
    ALL_PERMISSIONS,
    DEFAULT_ROLE_PERMISSIONS,
    EDITABLE_ROLES,
    PERMISSION_MODULES,
    ROLE_INFO,
    getAssignablePermissions,
} from "../constants/permissions.js";

// role -> permissions[] for editable roles, loaded from the DB once
let cache = null;

class PermissionService {
    async loadEditable() {
        if (cache) return cache;

        const saved = await RolePermission.find({
            role: { $in: EDITABLE_ROLES },
        }).lean();

        const next = {};

        for (const role of EDITABLE_ROLES) {
            const doc = saved.find((item) => item.role === role);
            // Drop anything the role may no longer hold
            const assignable = getAssignablePermissions(role);
            next[role] = (doc ? doc.permissions : DEFAULT_ROLE_PERMISSIONS[role]).filter((permission) =>
                assignable.includes(permission)
            );
        }

        cache = next;
        return cache;
    }

    async getPermissionsForRole(role) {
        if (role === ROLES.ADMIN) {
            return [...ALL_PERMISSIONS];
        }

        if (EDITABLE_ROLES.includes(role)) {
            const editable = await this.loadEditable();
            return [...editable[role]];
        }

        return [...(DEFAULT_ROLE_PERMISSIONS[role] || [])];
    }

    // Everything the Roles & Permissions page needs
    async listRoles() {
        const counts = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } },
        ]);

        const roles = await Promise.all(
            Object.values(ROLES).map(async (role) => ({
                role,
                ...ROLE_INFO[role],
                editable: EDITABLE_ROLES.includes(role),
                // Modules this role can be given (empty = fixed role)
                modules: EDITABLE_ROLES.includes(role)
                    ? PERMISSION_MODULES.filter((module) => module.roles.includes(role)).map((module) => module.key)
                    : [],
                userCount: counts.find((item) => item._id === role)?.count || 0,
                permissions: await this.getPermissionsForRole(role),
            }))
        );

        return {
            roles,
            modules: PERMISSION_MODULES.map(({ roles: _roles, ...module }) => module),
            adminOnly: [
                { key: "staff.manage", label: "Staff management", description: "Add staff, assign roles, block or remove staff." },
                { key: "roles.manage", label: "Roles & permissions", description: "Change what each role can do." },
            ],
        };
    }

    async updateRolePermissions(role, permissions, adminUser) {
        if (!EDITABLE_ROLES.includes(role)) {
            throw ApiError.badRequest(
                "Only Manager and Kitchen Staff permissions can be changed."
            );
        }

        if (!Array.isArray(permissions)) {
            throw ApiError.badRequest("Permissions must be a list.");
        }

        // e.g. kitchen staff can only hold kitchen permissions
        const assignable = getAssignablePermissions(role);
        const notAllowed = permissions.filter(
            (permission) => !assignable.includes(permission)
        );

        if (notAllowed.length > 0) {
            throw ApiError.badRequest(
                `These permissions can't be given to ${role}: ${notAllowed.join(", ")}.`
            );
        }

        const unique = [...new Set(permissions)];

        await RolePermission.findOneAndUpdate(
            { role },
            { role, permissions: unique, updatedBy: adminUser?._id || null },
            { upsert: true, new: true, runValidators: true }
        );

        cache = null;

        return {
            role,
            permissions: await this.getPermissionsForRole(role),
        };
    }
}

export default new PermissionService();
