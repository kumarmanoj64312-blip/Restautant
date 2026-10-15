export const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export const MONTH_OPTIONS = MONTHS.map((label, index) => ({ value: String(index + 1), label }));

// Current year and the two before it
export const YEAR_OPTIONS = Array.from({ length: 3 }, (_, index) => {
    const year = new Date().getFullYear() - index;
    return { value: String(year), label: String(year) };
});

const pad = (value) => String(value).padStart(2, "0");

// "YYYY-MM-DD" for a Date, in local time
export const toDateKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// "10:58 AM"
export const formatTime = (value) =>
    value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";

// "HH:mm" for <input type="time">
export const toTimeInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// 320 -> "05:20"
export const formatMinutes = (minutes) => `${pad(Math.floor((minutes || 0) / 60))}:${pad((minutes || 0) % 60)}`;

// Running timer since a date: "02:14:09"
export const formatElapsed = (since, now) => {
    const seconds = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
    return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
};

// "Wed, 15 Oct 2026"
export const formatDay = (dateKey) =>
    new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

// "15 Oct" or "15 Oct – 17 Oct 2026"
export const formatDateRange = (start, end) => {
    const options = { day: "2-digit", month: "short" };
    const startText = new Date(`${start}T00:00:00`).toLocaleDateString("en-IN", options);
    const endDate = new Date(`${end}T00:00:00`);
    const year = endDate.getFullYear();

    if (start === end) return `${startText} ${year}`;
    return `${startText} – ${endDate.toLocaleDateString("en-IN", options)} ${year}`;
};

// Download rows as a CSV file
export const downloadCsv = (filename, headers, rows) => {
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};
