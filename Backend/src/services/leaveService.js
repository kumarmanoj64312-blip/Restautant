import mongoose from "mongoose";
import Leave from "../models/Leave.js";
import Holiday from "../models/Holiday.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { getPagination } from "../utils/pagination.js";
import { hasPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";
import { ROLES } from "../constants/roles.js";
import { LEAVE_STATUS, LEAVE_TYPES } from "../constants/hr.js";
import { eachDay, isDateKey, toDateKey } from "../utils/dates.js";

const ACTIVE = [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class LeaveService {
    getType(key) {
        const type = LEAVE_TYPES.find((item) => item.key === key);
        if (!type) throw ApiError.badRequest("Choose a valid leave type.");
        return type;
    }

    // Allowance, used (approved), pending and what's left, per leave type
    async getBalances(userId, year = new Date().getFullYear()) {
        const leaves = await Leave.find({
            user: userId,
            status: { $in: ACTIVE },
            startDate: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
        }).lean();

        return {
            year: Number(year),
            balances: LEAVE_TYPES.map((type) => {
                const sum = (status) =>
                    leaves
                        .filter((leave) => leave.type === type.key && leave.status === status)
                        .reduce((total, leave) => total + leave.amount, 0);

                const used = sum(LEAVE_STATUS.APPROVED);
                const pending = sum(LEAVE_STATUS.PENDING);

                return { ...type, used, pending, available: Math.max(0, type.allowance - used - pending) };
            }),
        };
    }

    async apply(user, data) {
        const type = this.getType(data.type);
        const reason = String(data.reason || "").trim();
        const startDate = data.startDate;
        const endDate = type.unit === "hours" ? data.startDate : data.endDate || data.startDate;

        if (!isDateKey(startDate) || !isDateKey(endDate)) throw ApiError.badRequest("Choose valid dates.");
        if (endDate < startDate) throw ApiError.badRequest("End date can't be before the start date.");
        if (startDate.slice(0, 4) !== endDate.slice(0, 4)) throw ApiError.badRequest("A leave can't span two calendar years.");
        if (reason.length < 3) throw ApiError.badRequest("Please give a reason.");

        let amount;

        if (type.unit === "hours") {
            amount = Number(data.hours);
            if (!Number.isFinite(amount) || amount <= 0 || amount > 8) {
                throw ApiError.badRequest("Permission must be between 0.5 and 8 hours.");
            }
            amount = Math.round(amount * 2) / 2;
        } else {
            // Holidays inside the range don't use leave balance
            const holidays = (await Holiday.find({ date: { $gte: startDate, $lte: endDate } }).lean()).map((item) => item.date);
            amount = eachDay(startDate, endDate).filter((day) => !holidays.includes(day)).length;

            if (amount === 0) throw ApiError.badRequest("Those dates are all holidays.");
        }

        // No overlapping requests
        const overlap = await Leave.exists({
            user: user._id,
            status: { $in: ACTIVE },
            startDate: { $lte: endDate },
            endDate: { $gte: startDate },
            ...(type.unit === "hours" ? { type: "permission" } : { type: { $ne: "permission" } }),
        });

        if (overlap) throw ApiError.conflict("You already have a leave request for these dates.");

        const { balances } = await this.getBalances(user._id, Number(startDate.slice(0, 4)));
        const balance = balances.find((item) => item.key === type.key);

        if (amount > balance.available) {
            throw ApiError.badRequest(
                `Not enough ${type.label} left: ${balance.available} ${type.unit} available, ${amount} requested.`
            );
        }

        return Leave.create({ user: user._id, type: type.key, startDate, endDate, amount, reason });
    }

    async list(query, viewer) {
        const canSeeAll = hasPermission(viewer, PERMISSIONS.LEAVE_READ);
        const filter = {};

        if (query.mine === "true" || !canSeeAll) filter.user = viewer._id;

        if (Object.values(LEAVE_STATUS).includes(query.status)) filter.status = query.status;

        // Leaves that touch the chosen month / year
        const year = Number(query.year);
        const month = Number(query.month);
        if (year) {
            const from = month ? `${year}-${String(month).padStart(2, "0")}-01` : `${year}-01-01`;
            const to = month ? `${year}-${String(month).padStart(2, "0")}-31` : `${year}-12-31`;
            filter.startDate = { $lte: to };
            filter.endDate = { $gte: from };
        }

        if (query.search?.trim()) {
            const pattern = new RegExp(escapeRegex(query.search.trim()), "i");
            const users = await User.find({ name: pattern }).select("_id").lean();
            const or = [{ reason: pattern }, { user: { $in: users.map((user) => user._id) } }];

            if (filter.user) filter.$and = [{ user: filter.user }, { $or: or }];
            else filter.$or = or;
        }

        return getPagination({
            model: Leave,
            query: filter,
            page: query.page,
            limit: query.limit,
            sort: "createdAt",
            order: "desc",
            populate: [
                { path: "user", select: "name email role avatar" },
                { path: "reviewedBy", select: "name" },
            ],
        });
    }

    async review(id, decision, note, viewer) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid leave request.");

        const leave = await Leave.findById(id);
        if (!leave) throw ApiError.notFound("Leave request not found.");

        // Only admins may approve their own leave
        if (leave.user.toString() === viewer._id.toString() && viewer.role !== ROLES.ADMIN) {
            throw ApiError.forbidden("You can't approve or reject your own leave.");
        }

        if (leave.status !== LEAVE_STATUS.PENDING) {
            throw ApiError.badRequest(`This request is already ${leave.status.toLowerCase()}.`);
        }

        leave.status = decision;
        leave.reviewedBy = viewer._id;
        leave.reviewedAt = new Date();
        leave.reviewNote = String(note || "").trim();
        await leave.save();

        return leave.populate([
            { path: "user", select: "name email role avatar" },
            { path: "reviewedBy", select: "name" },
        ]);
    }

    async cancel(id, viewer) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid leave request.");

        const leave = await Leave.findById(id);
        if (!leave) throw ApiError.notFound("Leave request not found.");

        if (leave.user.toString() !== viewer._id.toString()) {
            throw ApiError.forbidden("You can only cancel your own leave.");
        }

        // Pending any time; approved only before it starts
        const cancellable =
            leave.status === LEAVE_STATUS.PENDING ||
            (leave.status === LEAVE_STATUS.APPROVED && leave.startDate > toDateKey());

        if (!cancellable) throw ApiError.badRequest("This leave can no longer be cancelled.");

        leave.status = LEAVE_STATUS.CANCELLED;
        await leave.save();

        return leave;
    }

    // ---------- Holidays ----------

    async listHolidays(year) {
        const filter = Number(year) ? { date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } } : {};
        return Holiday.find(filter).sort({ date: 1 });
    }

    async addHoliday({ date, name }) {
        if (!isDateKey(date)) throw ApiError.badRequest("Choose a valid date.");
        if (!String(name || "").trim()) throw ApiError.badRequest("Give the holiday a name.");
        if (await Holiday.exists({ date })) throw ApiError.conflict("There is already a holiday on that date.");

        return Holiday.create({ date, name: String(name).trim() });
    }

    async deleteHoliday(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid holiday.");

        const holiday = await Holiday.findByIdAndDelete(id);
        if (!holiday) throw ApiError.notFound("Holiday not found.");

        return true;
    }
}

export default new LeaveService();
