import fs from "fs";
import cloudinary from "../config/cloudinary.js";

const uploadToCloudinary = async (
    filePath,
    folder = "Restautant"
) => {
    try {
        if (!filePath) {
            throw new Error("File path is required.");
        }

        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: "image",
            overwrite: true,
        });

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return {
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
        };
    } catch (error) {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        throw new Error(error.message);
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return;

        await cloudinary.uploader.destroy(publicId);

        return {
            success: true,
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

export {
    uploadToCloudinary,
    deleteFromCloudinary,
};