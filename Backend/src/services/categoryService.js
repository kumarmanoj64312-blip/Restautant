import Category from "../models/Category.js";
import ApiError from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import {
    uploadToCloudinary,
    deleteFromCloudinary,
} from "../utils/uploadToCloudinary.js";

class CategoryService {

    // ==========================================
    // Create Category
    // ==========================================
    async createCategory(data, file) {

        const {
            name,
            description = "",
            isActive = true,
            sortOrder = 0,
        } = data;

        if (!name) {
            throw ApiError.badRequest("Category name is required.");
        }

        const slug = name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]/g, "");

        const exists = await Category.findOne({
            $or: [
                { name: name.trim() },
                { slug },
            ],
        });

        if (exists) {
            throw ApiError.conflict("Category already exists.");
        }

        let image = {
            url: "",
            public_id: "",
        };

        if (file) {

            const uploaded = await uploadToCloudinary(
                file.path,
                "Restautant/Category"
            );

            image = {
                url: uploaded.url,
                public_id: uploaded.public_id,
            };
        }

        const category = await Category.create({
            name: name.trim(),
            slug,
            description,
            image,
            isActive:
                isActive === true ||
                isActive === "true",
            sortOrder: Number(sortOrder),
        });

        return category;
    }

    // ==========================================
    // Get Categories
    // ==========================================
    async getCategory(query) {

        const {
            page = 1,
            limit = 50,
            search = "",
            isActive,
            sort = "createdAt",
            order = "desc",
        } = query;

        const filter = {};

        if (search) {

            filter.$or = [
                {
                    name: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    description: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];

        }

        if (isActive !== undefined) {
            filter.isActive =
                isActive === true ||
                isActive === "true";
        }

        return await getPagination({
            model: Category,
            query: filter,
            page,
            limit,
            sort,
            order,
        });

    }

    // ==========================================
    // Get Active Categories
    // ==========================================
    async getActiveCategory() {

        return await Category.find({
            isActive: true,
        }).sort({
            sortOrder: 1,
            name: 1,
        });

    }

    // ==========================================
    // Get Category By Id
    // ==========================================
    async getCategoryById(id) {

        const category =
            await Category.findById(id);

        if (!category) {
            throw ApiError.notFound(
                "Category not found."
            );
        }

        return category;

    }

    // ==========================================
    // Update Category
    // ==========================================
    async updateCategory(id, data, file) {

        const category =
            await Category.findById(id);

        if (!category) {
            throw ApiError.notFound(
                "Category not found."
            );
        }

        if (data.name) {

            category.name = data.name.trim();

            category.slug = data.name
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^\w-]/g, "");

        }

        if (data.description !== undefined) {
            category.description =
                data.description;
        }

        if (data.sortOrder !== undefined) {
            category.sortOrder =
                Number(data.sortOrder);
        }

        if (data.isActive !== undefined) {
            category.isActive =
                data.isActive === true ||
                data.isActive === "true";
        }

        if (file) {

            if (category.image?.public_id) {

                await deleteFromCloudinary(
                    category.image.public_id
                );

            }

            const uploaded =
                await uploadToCloudinary(
                    file.path,
                    "Restautant/Category"
                );

            category.image = {
                url: uploaded.url,
                public_id: uploaded.public_id,
            };

        }

        await category.save();

        return category;

    }

    // ==========================================
    // Delete Category
    // ==========================================
    async deleteCategory(id) {

        const category =
            await Category.findById(id);

        if (!category) {
            throw ApiError.notFound(
                "Category not found."
            );
        }

        if (category.image?.public_id) {

            await deleteFromCloudinary(
                category.image.public_id
            );

        }

        await category.deleteOne();

        return true;

    }

    // ==========================================
    // Toggle Status
    // ==========================================
    async toggleCategoryStatus(id) {

        const category =
            await Category.findById(id);

        if (!category) {
            throw ApiError.notFound(
                "Category not found."
            );
        }

        category.isActive =
            !category.isActive;

        await category.save();

        return category;

    }

}

export default new CategoryService();