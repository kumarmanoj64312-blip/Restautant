import mongoose from "mongoose";
import Menu from "../models/Menu.js";
import CategoryModel from "../models/Category.js";
import ApiError from "../utils/ApiError.js";
import {
    uploadToCloudinary,
    deleteFromCloudinary,
} from "../utils/uploadToCloudinary.js";

class MenuService {

    // ==========================
    // Create Menu
    // ==========================
   async createMenu(data, file) {

    const {
        name,
        category,
        description,
        price,
        discountPrice,
        isAvailable,
        isPopular,
    } = data;

    if (!name) {
        throw ApiError.badRequest("Menu name is required.");
    }

    if (!category) {
        throw ApiError.badRequest("Category is required.");
    }

    const categoryExists = await CategoryModel.findById(category);

    if (!categoryExists) {
        throw ApiError.notFound("Category not found.");
    }

    if (!file) {
        throw ApiError.badRequest("Menu image is required.");
    }

    const uploaded = await uploadToCloudinary(
        file.path,
        "Restautant/Menu"
    );

    const menu = await Menu.create({
        name,
        category,
        description,
        price,
        discountPrice,
        image: {
            url: uploaded.url,
            public_id: uploaded.public_id,
        },
        isAvailable,
        isPopular,
    });

    return await menu.populate("category");
}

    // ==========================
    // Get All Menus
    // ==========================
    // Optional filters:
    // ?search=paneer &category=<id> &isAvailable=true &isPopular=true &limit=20
    async getMenus(query = {}) {

        const filter = {};

        if (query.search?.trim()) {
            const escaped = query.search
                .trim()
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.name = { $regex: escaped, $options: "i" };
        }

        if (query.category && mongoose.Types.ObjectId.isValid(query.category)) {
            filter.category = query.category;
        }

        if (query.isAvailable === "true" || query.isAvailable === "false") {
            filter.isAvailable = query.isAvailable === "true";
        }

        if (query.isPopular === "true" || query.isPopular === "false") {
            filter.isPopular = query.isPopular === "true";
        }

        let builder = Menu.find(filter)
            .populate("category")
            .sort({ createdAt: -1 });

        const limit = Number(query.limit);

        if (Number.isInteger(limit) && limit > 0) {
            builder = builder.limit(Math.min(limit, 200));
        }

        return await builder;

    }

    // ==========================
    // Get Menu By Id
    // ==========================
    async getMenuById(id) {

        const menu = await Menu.findById(id)
            .populate("category");

        if (!menu) {
            throw ApiError.notFound("Menu not found.");
        }

        return menu;
    }

    async getPopularMenus(limit = 4) {
        const parsedLimit = Math.min(Math.max(Number(limit) || 4, 1), 20);

        return await Menu.find({ isPopular: true })
            .populate("category")
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(parsedLimit);
    }

    async togglePopular(id) {
        const menu = await Menu.findById(id);

        if (!menu) {
            throw ApiError.notFound("Menu not found.");
        }

        menu.isPopular = !menu.isPopular;
        await menu.save();

        return await menu.populate("category");
    }

    // ==========================
    // Update Menu
    // ==========================
    async updateMenu(id, data, file) {

        const menu = await Menu.findById(id);

        if (!menu) {
            throw ApiError.notFound("Menu not found.");
        }

        if (data.category) {

            const category = await CategoryModel.findById(data.category);

            if (!category) {
                throw ApiError.notFound("Category not found.");
            }

            menu.category = data.category;
        }

        menu.name = data.name ?? menu.name;
        menu.description = data.description ?? menu.description;
        menu.price = data.price ?? menu.price;
        menu.discountPrice =
            data.discountPrice ?? menu.discountPrice;
        menu.isAvailable =
            data.isAvailable ?? menu.isAvailable;
        menu.isPopular =
            data.isPopular ?? menu.isPopular;

        if (file) {

            if (menu.image?.public_id) {
                await deleteFromCloudinary(
                    menu.image.public_id
                );
            }

            const uploaded = await uploadToCloudinary(
                file.path,
                "Restautant/Menu"
            );

            menu.image = {
                url: uploaded.url,
                public_id: uploaded.public_id,
            };
        }

        await menu.save();

        return await menu.populate("category");
    }

    // ==========================
    // Delete Menu
    // ==========================
    async deleteMenu(id) {

        const menu = await Menu.findById(id);

        if (!menu) {
            throw ApiError.notFound("Menu not found.");
        }

        if (menu.image?.public_id) {
            await deleteFromCloudinary(
                menu.image.public_id
            );
        }

        await menu.deleteOne();

        return true;
    }

}

export default new MenuService();