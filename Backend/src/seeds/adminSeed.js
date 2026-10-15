import User from "../models/User.js";
import { ROLES } from "../constants/roles.js";

const seedAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;
        const name = process.env.ADMIN_NAME || "Admin";
        const phone = process.env.ADMIN_PHONE || "0000000000";

        if (!email || !password) {
            console.warn(
                "Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD is missing."
            );
            return;
        }

        const adminExists = await User.findOne({ email });

        if (adminExists) {
            console.log("Admin account already exists.");
            return;
        }

        await User.create({
            name,
            email,
            password,
            phone,
            role: ROLES.ADMIN,
        });

        console.log("Admin account created successfully.");
    } catch (error) {
        console.error("Admin Seed Error:", error.message);
    }
};

export default seedAdmin;