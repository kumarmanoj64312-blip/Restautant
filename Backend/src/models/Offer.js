import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    couponCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    buttonText: {
      type: String,
      default: "Order Now",
    },

    buttonLink: {
      type: String,
      default: "/menu",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Offer", offerSchema);