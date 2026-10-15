import mongoose from "mongoose";
import { REMOVED_ROLES, LEGACY_ROLE_FALLBACK } from "../constants/roles.js";

/**
 * Move accounts off roles that were removed from the app (e.g. "cashier").
 * Runs at server start before requests are served. Uses the raw collection
 * because those documents no longer pass the User schema's role enum.
 *
 * Accounts get the least-privileged role; an admin can assign the right
 * staff role afterwards from Admin -> Staff.
 */
const migrateRoles = async () => {
    const users = mongoose.connection.collection("users");

    const result = await users.updateMany(
        { role: { $in: REMOVED_ROLES } },
        // Pipeline update: keep the old role for reference
        [
            {
                $set: {
                    previousRole: "$role",
                    role: LEGACY_ROLE_FALLBACK,
                },
            },
        ]
    );

    if (result.modifiedCount > 0) {
        console.log(
            `Role migration: ${result.modifiedCount} account(s) moved from ${REMOVED_ROLES.join(", ")} to ${LEGACY_ROLE_FALLBACK}. Re-assign them in Admin -> Staff.`
        );
    }

    return result.modifiedCount;
};

export default migrateRoles;
