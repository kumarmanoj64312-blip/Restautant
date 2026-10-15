import Hero from "../models/Hero.js";
import ApiError from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import {
    uploadToCloudinary,
    deleteFromCloudinary,
} from "../utils/uploadToCloudinary.js";

class HeroService {
    async createHero(data, file) {
        const {
            title,
            subtitle,
            description,
            buttonText = "Order Now",
            buttonLink = "/menu",
            badge = "",
            offerText = "",
            backgroundColor = "#ffffff",
            textColor = "#000000",
            displayOrder = 1,
            isActive = true,
            startDate,
            endDate,
        } = data;

        if (!file) {
            throw ApiError.badRequest("Hero image is required.");
        }

        const uploadedImage = await uploadToCloudinary(
            file.path,
            "Restautant/Hero"
        );

        const hero = await Hero.create({
            title,
            subtitle,
            description,
            image: {
                url: uploadedImage.url,
                public_id: uploadedImage.public_id,
            },
            buttonText,
            buttonLink,
            badge,
            offerText,
            backgroundColor,
            textColor,
            displayOrder,
            isActive,
            startDate,
            endDate,
        });

        return hero;
    }

    async getHeroes(query) {
        const {
            page,
            limit,
            search,
            isActive,
            sort = "displayOrder",
            order = "asc",
        } = query;

        const filter = {};

        if (search) {
            filter.$or = [
                {
                    title: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    subtitle: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }

        return await getPagination({
            model: Hero,
            query: filter,
            page,
            limit,
            sort,
            order,
        });
    }

    async getHeroById(id) {
        const hero = await Hero.findById(id);

        if (!hero) {
            throw ApiError.notFound("Hero banner not found.");
        }

        return hero;
    }

    async getActiveHeroes() {
        return await Hero.find({
            isActive: true,
        }).sort({
            displayOrder: 1,
        });
    }

    async updateHero(id, data, file) {
        const hero = await Hero.findById(id);

        if (!hero) {
            throw ApiError.notFound("Hero banner not found.");
        }

        Object.keys(data).forEach((key) => {
            if (data[key] !== undefined) {
                hero[key] = data[key];
            }
        });

        if (file) {
            if (hero.image.public_id) {
                await deleteFromCloudinary(
                    hero.image.public_id
                );
            }

            const uploadedImage =
                await uploadToCloudinary(
                    file.path,
                    "Restautant/Hero"
                );

            hero.image = {
                url: uploadedImage.url,
                public_id: uploadedImage.public_id,
            };
        }

        await hero.save();

        return hero;
    }

    async deleteHero(id) {
        const hero = await Hero.findById(id);

        if (!hero) {
            throw ApiError.notFound("Hero banner not found.");
        }

        if (hero.image.public_id) {
            await deleteFromCloudinary(
                hero.image.public_id
            );
        }

        await hero.deleteOne();

        return true;
    }

    async toggleHeroStatus(id) {
        const hero = await Hero.findById(id);

        if (!hero) {
            throw ApiError.notFound("Hero banner not found.");
        }

        hero.isActive = !hero.isActive;

        await hero.save();

        return hero;
    }

    async changeDisplayOrder(id, displayOrder) {
        const hero = await Hero.findById(id);

        if (!hero) {
            throw ApiError.notFound("Hero banner not found.");
        }

        hero.displayOrder = displayOrder;

        await hero.save();

        return hero;
    }
}

export default new HeroService();