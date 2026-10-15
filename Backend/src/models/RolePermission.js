import mongoose from "mongoose";
import { ALL_PERMISSIONS, EDITABLE_ROLES } from "../constants/permissions.js";

// Saved permissions for roles an admin can edit (currently: manager).
// Admin, kitchen and customer permissions are fixed in constants/permissions.js.
const rolePermissionSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: EDITABLE_ROLES,
            required: true,
            unique: true,
        },

        permissions: {
            type: [
                {
                    type: String,
                    enum: ALL_PERMISSIONS,
                },
            ],
            default: [],
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const RolePermission = mongoose.model("RolePermission", rolePermissionSchema);

export default RolePermission;
