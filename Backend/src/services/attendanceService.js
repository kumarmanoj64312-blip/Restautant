import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Holiday from "../models/Holiday.js";
import Leave from "../models/Leave.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { hasPermission } from "../middleware/requirePermission.js";
import { PERMISSIONS } from "../constants/permissions.js";
import { STAFF_ROLES } from "../constants/roles.js";
import { DAY_STATUS, LEAVE_STATUS } from "../constants/hr.js";
import { atTime, eachDay, isDateKey, monthRange, toDateKey } from "../utils/dates.js";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MINUTE = 60 * 1000;

// Worked time, breaks (gaps between sessions), first in / last out
const summarize = (record, now = new Date()) => {
    const sessions = [...(record?.sessions || [])].sort((a, b) => new Date(a.in) - new Date(b.in));

    let workedMs = 0;
    let breakMs = 0;

    sessions.forEach((session, index) => {
        const start = new Date(session.in);
        const end = session.out ? new Date(session.out) : now;
        workedMs += Math.max(0, end - start);

        const previous = sessions[index - 1];
        if (previous?.out) {
            breakMs += Math.max(0, start - new Date(previous.out));
        }
    });

    const last = sessions[sessions.length - 1];

    return {
        sessions,
        firstIn: sessions[0]?.in || null,
        lastOut: last?.out || null,
        isOpen: !!last && !last.out,
        workedMinutes: Math.round(workedMs / MINUTE),
        breakMinutes: Math.round(breakMs / MINUTE),
    };
};

// Day-based approved leaves (permission hours don't make a day "On Leave")
const leaveCoversDay = (leave, dateKey) =>
    leave.type !== "permission" && leave.startDate <= dateKey && leave.endDate >= dateKey;

const dayStatus = ({ dateKey, today, record, holiday, leave }) => {
    if (record?.sessions?.length) return DAY_STATUS.PRESENT;
    if (holiday) return DAY_STATUS.HOLIDAY;
    if (leave) return DAY_STATUS.LEAVE;
    if (dateKey > today) return DAY_STATUS.UPCOMING;
    return DAY_STATUS.ABSENT;
};

const publicUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
});

class AttendanceService {
    ensureCanView(viewer, targetId) {
        const isSelf = !targetId || targetId.toString() === viewer._id.toString();

        if (!isSelf && !hasPermission(viewer, PERMISSIONS.ATTENDANCE_READ)) {
            throw ApiError.forbidden("You can only view your own attendance.");
        }
    }

    async getStaffUser(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw ApiError.badRequest("Invalid staff member.");
        }

        const user = await User.findById(id);

        if (!user || !STAFF_ROLES.includes(user.role)) {
            throw ApiError.notFound("Staff member not found.");
        }

        return user;
    }

    // Holidays and approved day leaves for a date range, ready for lookups
    async loadCalendar(startKey, endKey, userIds) {
        const [holidays, leaves] = await Promise.all([
            Holiday.find({ date: { $gte: startKey, $lte: endKey } }).lean(),
            Leave.find({
                user: { $in: userIds },
                status: LEAVE_STATUS.APPROVED,
                type: { $ne: "permission" },
                startDate: { $lte: endKey },
                endDate: { $gte: startKey },
            }).lean(),
        ]);

        return {
            holidayOn: (dateKey) => holidays.find((holiday) => holiday.date === dateKey),
            leaveOn: (userId, dateKey) =>
                leaves.find((leave) => leave.user.toString() === userId.toString() && leaveCoversDay(leave, dateKey)),
        };
    }

    // ---------- Self service ----------

    async getStatus(user) {
        const open = await Attendance.findOne({
            user: user._id,
            sessions: { $elemMatch: { out: null } },
        }).sort({ date: -1 });

        const today = await Attendance.findOne({ user: user._id, date: toDateKey() });

        return {
            clockedIn: !!open,
            since: open ? open.sessions.find((session) => !session.out)?.in : null,
            today: summarize(today),
        };
    }

    async clockIn(user) {
        const open = await Attendance.exists({
            user: user._id,
            sessions: { $elemMatch: { out: null } },
        });

        if (open) {
            throw ApiError.badRequest("You are already clocked in.");
        }

        await Attendance.findOneAndUpdate(
            { user: user._id, date: toDateKey() },
            { $push: { sessions: { in: new Date(), out: null } }, $setOnInsert: { source: "self" } },
            { upsert: true, new: true, runValidators: true }
        );

        return this.getStatus(user);
    }

    async clockOut(user) {
        // The open session may have started yesterday (late shift)
        const record = await Attendance.findOne({
            user: user._id,
            sessions: { $elemMatch: { out: null } },
        }).sort({ date: -1 });

        if (!record) {
            throw ApiError.badRequest("You are not clocked in.");
        }

        record.sessions.find((session) => !session.out).out = new Date();
        await record.save();

        return this.getStatus(user);
    }

    // ---------- History (one person, one month) ----------

    async getHistory({ userId, month, year }, viewer) {
        this.ensureCanView(viewer, userId);

        const target = userId ? await this.getStaffUser(userId) : viewer;
        const now = new Date();
        const monthNumber = Number(month) || now.getMonth() + 1;
        const yearNumber = Number(year) || now.getFullYear();
        const { start, end } = monthRange(yearNumber, monthNumber);

        const today = toDateKey(now);
        const joined = toDateKey(new Date(target.createdAt));
        const from = start < joined ? joined : start;
        const to = end > today ? today : end;

        if (from > to) {
            return { user: publicUser(target), month: monthNumber, year: yearNumber, rows: [] };
        }

        const [records, calendar] = await Promise.all([
            Attendance.find({ user: target._id, date: { $gte: from, $lte: to } }).lean(),
            this.loadCalendar(from, to, [target._id]),
        ]);

        const rows = eachDay(from, to)
            .reverse()
            .map((dateKey) => {
                const record = records.find((item) => item.date === dateKey);
                const holiday = calendar.holidayOn(dateKey);
                const leave = calendar.leaveOn(target._id, dateKey);
                const summary = summarize(record, now);

                return {
                    date: dateKey,
                    recordId: record?._id || null,
                    source: record?.source || null,
                    note: record?.note || "",
                    ...summary,
                    status: dayStatus({ dateKey, today, record, holiday, leave }),
                    holidayName: holiday?.name || null,
                    leaveType: leave?.type || null,
                };
            });

        return { user: publicUser(target), month: monthNumber, year: yearNumber, rows };
    }

    // ---------- Reports ----------

    async listStaff({ role, search }) {
        const filter = { role: { $in: STAFF_ROLES } };

        if (role && STAFF_ROLES.includes(role)) filter.role = role;

        if (search?.trim()) {
            const pattern = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            filter.$or = [{ name: pattern }, { email: pattern }];
        }

        return User.find(filter).select("name email role avatar createdAt").sort({ name: 1 }).lean();
    }

    async dailyReport({ date, role, search, status }) {
        const dateKey = isDateKey(date) ? date : toDateKey();
        const today = toDateKey();
        const now = new Date();

        // Only people who had joined by that day
        const staff = (await this.listStaff({ role, search })).filter(
            (user) => toDateKey(new Date(user.createdAt)) <= dateKey
        );
        const ids = staff.map((user) => user._id);

        const [records, calendar] = await Promise.all([
            Attendance.find({ user: { $in: ids }, date: dateKey }).lean(),
            this.loadCalendar(dateKey, dateKey, ids),
        ]);

        const holiday = calendar.holidayOn(dateKey);

        const allRows = staff.map((user) => {
            const record = records.find((item) => item.user.toString() === user._id.toString());
            const leave = calendar.leaveOn(user._id, dateKey);
            const summary = summarize(record, now);

            return {
                user: publicUser(user),
                recordId: record?._id || null,
                firstIn: summary.firstIn,
                lastOut: summary.lastOut,
                isOpen: summary.isOpen,
                workedMinutes: summary.workedMinutes,
                breakMinutes: summary.breakMinutes,
                status: dayStatus({ dateKey, today, record, holiday, leave }),
                leaveType: leave?.type || null,
            };
        });

        const count = (value) => allRows.filter((row) => row.status === value).length;

        return {
            date: dateKey,
            holidayName: holiday?.name || null,
            summary: {
                total: allRows.length,
                present: count(DAY_STATUS.PRESENT),
                absent: count(DAY_STATUS.ABSENT),
                onLeave: count(DAY_STATUS.LEAVE),
                holiday: count(DAY_STATUS.HOLIDAY),
            },
            rows: status ? allRows.filter((row) => row.status === status) : allRows,
        };
    }

    async monthlyReport({ month, year, role, search }) {
        const now = new Date();
        const monthNumber = Number(month) || now.getMonth() + 1;
        const yearNumber = Number(year) || now.getFullYear();
        const { start, end } = monthRange(yearNumber, monthNumber);
        const today = toDateKey(now);
        const to = end > today ? today : end;

        const staff = await this.listStaff({ role, search });
        const ids = staff.map((user) => user._id);

        if (start > to) {
            return { month: monthNumber, year: yearNumber, rows: [] };
        }

        const [records, calendar] = await Promise.all([
            Attendance.find({ user: { $in: ids }, date: { $gte: start, $lte: to } }).lean(),
            this.loadCalendar(start, to, ids),
        ]);

        const rows = staff.map((user) => {
            const joined = toDateKey(new Date(user.createdAt));
            const days = eachDay(start > joined ? start : joined, to);
            const totals = { present: 0, absent: 0, onLeave: 0, holiday: 0, workedMinutes: 0 };

            days.forEach((dateKey) => {
                const record = records.find((item) => item.user.toString() === user._id.toString() && item.date === dateKey);
                const status = dayStatus({
                    dateKey,
                    today,
                    record,
                    holiday: calendar.holidayOn(dateKey),
                    leave: calendar.leaveOn(user._id, dateKey),
                });

                if (status === DAY_STATUS.PRESENT) totals.present++;
                if (status === DAY_STATUS.ABSENT) totals.absent++;
                if (status === DAY_STATUS.LEAVE) totals.onLeave++;
                if (status === DAY_STATUS.HOLIDAY) totals.holiday++;
                totals.workedMinutes += summarize(record, now).workedMinutes;
            });

            return { user: publicUser(user), workingDays: days.length, ...totals };
        });

        return { month: monthNumber, year: yearNumber, rows };
    }

    // ---------- Manual entries (attendance.manage) ----------

    buildSession(dateKey, inTime, outTime) {
        if (!TIME_PATTERN.test(inTime || "") || (outTime && !TIME_PATTERN.test(outTime))) {
            throw ApiError.badRequest("Times must be in HH:mm format.");
        }

        const inAt = atTime(dateKey, inTime);
        const outAt = outTime ? atTime(dateKey, outTime) : null;

        if (outAt && outAt <= inAt) {
            throw ApiError.badRequest("Punch out must be after punch in.");
        }

        return { in: inAt, out: outAt };
    }

    async upsertEntry({ userId, date, inTime, outTime, note = "" }, editor) {
        if (!isDateKey(date)) throw ApiError.badRequest("Enter a valid date.");
        if (date > toDateKey()) throw ApiError.badRequest("You can't add attendance for a future date.");

        const user = await this.getStaffUser(userId);
        const session = this.buildSession(date, inTime, outTime);

        return Attendance.findOneAndUpdate(
            { user: user._id, date },
            { sessions: [session], source: "manual", note: String(note).trim(), updatedBy: editor._id },
            { upsert: true, new: true, runValidators: true }
        );
    }

    async updateEntry(id, { inTime, outTime, note }, editor) {
        const record = await Attendance.findById(id);
        if (!record) throw ApiError.notFound("Attendance entry not found.");

        record.sessions = [this.buildSession(record.date, inTime, outTime)];
        record.source = "manual";
        if (note !== undefined) record.note = String(note).trim();
        record.updatedBy = editor._id;
        await record.save();

        return record;
    }

    async deleteEntry(id) {
        const record = await Attendance.findById(id);
        if (!record) throw ApiError.notFound("Attendance entry not found.");

        await record.deleteOne();
        return true;
    }
}

export default new AttendanceService();
