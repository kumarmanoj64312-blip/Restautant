import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import slugify from "slugify";
import Category from "../models/Category.js";
import Menu from "../models/Menu.js";

// Images are public Unsplash links (no Cloudinary public_id).
// Replace them from the admin panel with your own photos anytime.
const img = (id) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

const CATEGORIES = [
    {
        name: "Starters",
        description: "Crispy bites to begin your meal.",
        image: img("photo-1601050690597-df0568f70950"),
        items: [
            { name: "Paneer Tikka", price: 249, discountPrice: 219, description: "Cottage cheese cubes marinated in spiced yogurt and grilled in the tandoor.", isPopular: true },
            { name: "Veg Spring Rolls", price: 179, description: "Crispy rolls stuffed with stir-fried vegetables, served with sweet chilli sauce." },
            { name: "Chicken 65", price: 279, description: "Spicy deep-fried chicken tossed with curry leaves and red chillies.", isPopular: true },
            { name: "French Fries", price: 129, description: "Golden salted fries served with ketchup." },
        ],
    },
    {
        name: "Main Course",
        description: "Classic curries and gravies.",
        image: img("photo-1631452180519-c014fe946bc7"),
        items: [
            { name: "Butter Chicken", price: 349, description: "Tandoori chicken simmered in a rich tomato and butter gravy.", isPopular: true },
            { name: "Paneer Butter Masala", price: 299, description: "Soft paneer in a creamy, mildly spiced tomato gravy." },
            { name: "Dal Makhani", price: 229, description: "Black lentils slow-cooked overnight with butter and cream." },
            { name: "Butter Naan", price: 59, description: "Soft leavened bread brushed with butter." },
        ],
    },
    {
        name: "Biryani",
        description: "Fragrant dum-cooked rice dishes.",
        image: img("photo-1563379091339-03b21ab4a4f8"),
        items: [
            { name: "Chicken Dum Biryani", price: 329, discountPrice: 299, description: "Basmati rice and chicken layered with saffron and slow-cooked on dum.", isPopular: true },
            { name: "Mutton Biryani", price: 429, description: "Tender mutton pieces cooked with aromatic long-grain rice." },
            { name: "Veg Biryani", price: 249, description: "Seasonal vegetables and basmati rice with whole spices." },
        ],
    },
    {
        name: "Pizza & Burgers",
        description: "Fast food favourites.",
        image: img("photo-1513104890138-7c749659a591"),
        items: [
            { name: "Margherita Pizza", price: 299, description: "Tomato sauce, mozzarella and fresh basil on a thin crust." },
            { name: "Farmhouse Pizza", price: 379, description: "Loaded with onion, capsicum, mushroom and sweet corn." },
            { name: "Classic Veg Burger", price: 159, description: "Crispy veg patty with lettuce, tomato and house mayo." },
            { name: "Chicken Burger", price: 199, discountPrice: 179, description: "Grilled chicken patty with cheese and smoky sauce.", isPopular: true },
        ],
    },
    {
        name: "Desserts",
        description: "Something sweet to finish.",
        image: img("photo-1551024601-bf3f7d3d5c4a"),
        items: [
            { name: "Gulab Jamun", price: 99, description: "Two warm milk dumplings soaked in rose-cardamom syrup." },
            { name: "Chocolate Brownie", price: 149, description: "Fudgy brownie served warm with chocolate sauce." },
            { name: "Kulfi", price: 89, description: "Traditional frozen dessert with pistachio and saffron." },
        ],
    },
    {
        name: "Beverages",
        description: "Hot and cold drinks.",
        image: img("photo-1509042239860-f550ce710b93"),
        items: [
            { name: "Masala Chai", price: 49, description: "Strong tea brewed with milk, ginger and cardamom." },
            { name: "Cold Coffee", price: 129, description: "Chilled coffee blended with milk and ice cream.", isPopular: true },
            { name: "Fresh Lime Soda", price: 79, description: "Sweet or salted lime soda." },
            { name: "Mango Lassi", price: 99, description: "Thick yogurt drink blended with ripe mango." },
        ],
    },
];

const seedMenu = async () => {
    let categoriesCreated = 0;
    let menusCreated = 0;

    for (const [index, data] of CATEGORIES.entries()) {
        const slug = slugify(data.name, { lower: true, strict: true });

        let category = await Category.findOne({
            $or: [{ slug }, { name: data.name }],
        });

        if (!category) {
            category = await Category.create({
                name: data.name,
                slug,
                description: data.description,
                image: { url: data.image, public_id: "" },
                isActive: true,
                sortOrder: index + 1,
            });

            categoriesCreated++;
        }

        for (const item of data.items) {
            const exists = await Menu.findOne({
                name: item.name,
                category: category._id,
            });

            if (exists) continue;

            await Menu.create({
                name: item.name,
                category: category._id,
                description: item.description,
                image: { url: data.image, public_id: "" },
                price: item.price,
                discountPrice: item.discountPrice || 0,
                isAvailable: true,
                isPopular: item.isPopular || false,
            });

            menusCreated++;
        }
    }

    console.log(
        `Menu seed done: ${categoriesCreated} categories and ${menusCreated} menu items created (existing ones skipped).`
    );
};

const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/thehungrysport";

try {
    await mongoose.connect(MONGODB_URI);
    await seedMenu();
} catch (error) {
    console.error("Menu Seed Error:", error.message);
    process.exitCode = 1;
} finally {
    await mongoose.connection.close();
}
