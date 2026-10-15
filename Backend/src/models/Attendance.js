import mongoose from "mongoose";

// One clock-in/clock-out pair. A day can have several (gaps = breaks).
const sessionSchema = new mongoose.Schema(
    {
        in: { type: Date, required: true },
        out: { type: Date, default: null },
    },
    { _id: false }
);

const attendanceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Local calendar day, "YYYY-MM-DD"
        date: {
            type: String,
            required: true,
            match: /^\d{4}-\d{2}-\d{2}$/,
        },

        sessions: {
            type: [sessionSchema],
            default: [],
        },

        // "self" = clocked in/out by the employee, "manual" = added by an admin/manager
        source: {
            type: String,
            enum: ["self", "manual"],
            default: "self",
        },

        note: {
            type: String,
            default: "",
            trim: true,
            maxlength: 300,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
