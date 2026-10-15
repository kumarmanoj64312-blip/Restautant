import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
    {
        // Local calendar day, "YYYY-MM-DD"
        date: {
            type: String,
            required: true,
            unique: true,
            match: /^\d{4}-\d{2}-\d{2}$/,
        },

        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
    },
    { timestamps: true }
);

const Holiday = mongoose.model("Holiday", holidaySchema);

export default Holiday;
