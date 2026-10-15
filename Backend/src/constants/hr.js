// Leave types and yearly allowances. Balances reset every calendar year.
export const LEAVE_TYPES = [
    { key: "casual", label: "Casual Leave", unit: "days", allowance: 12 },
    { key: "sick", label: "Sick Leave", unit: "days", allowance: 6 },
    { key: "permission", label: "Permission", unit: "hours", allowance: 24 },
];

export const LEAVE_TYPE_KEYS = LEAVE_TYPES.map((type) => type.key);

export const LEAVE_STATUS = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
};

// Day status shown in attendance history and reports
export const DAY_STATUS = {
    PRESENT: "Present",
    ABSENT: "Absent",
    LEAVE: "On Leave",
    HOLIDAY: "Holiday",
    UPCOMING: "Upcoming",
};
