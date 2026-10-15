import mongoose from "mongoose";
import { LEAVE_TYPE_KEYS, LEAVE_STATUS } from "../constants/hr.js";

const leaveSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: LEAVE_TYPE_KEYS,
            required: true,
        },

        // Local calendar days, "YYYY-MM-DD" (inclusive)
        startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
        endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },

        // Days for day-based types, hours for "permission"
        amount: { type: Number, required: true, min: 0 },

        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },

        status: {
            type: String,
            enum: Object.values(LEAVE_STATUS),
            default: LEAVE_STATUS.PENDING,
            index: true,
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        reviewedAt: { type: Date, default: null },

        reviewNote: {
            type: String,
            default: "",
            trim: true,
            maxlength: 300,
        },
    },
    { timestamps: true }
);

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
