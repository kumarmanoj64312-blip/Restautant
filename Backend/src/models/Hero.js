import mongoose from "mongoose";

const heroSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", trim: true },
    subtitle: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    badge: { type: String, default: "", trim: true },
    offerText: { type: String, default: "", trim: true },
    buttonText: { type: String, default: "Order Now", trim: true },
    buttonLink: { type: String, default: "/menu", trim: true },
    backgroundColor: { type: String, default: "#ffffff" },
    textColor: { type: String, default: "#000000" },
    displayOrder: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    image: {
      url: {
        type: String,
        required: [true, "Hero image is required"],
      },
      public_id: {
        type: String,
        required: [true, "Cloudinary public id is required"],
      },
    },
  },
  {
    timestamps: true,
  }
);

const Hero = mongoose.model("Hero", heroSchema);

export default Hero;