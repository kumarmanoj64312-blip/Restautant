import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
    {
        restaurantName: {
            type: String,
            default: "Restautant",
        },

        email: {
            type: String,
            default: "",
        },

        phone: {
            type: String,
            default: "",
        },

        address: {
            type: String,
            default: "",
        },

        deliveryCharge: {
            type: Number,
            default: 0,
        },

        // Percentage of the subtotal, e.g. 5 = 5%
        tax: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        currency: {
            type: String,
            default: "₹",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Settings", settingsSchema);