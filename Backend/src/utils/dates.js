// Calendar-day helpers. Days are "YYYY-MM-DD" strings in the server's local time.

const pad = (value) => String(value).padStart(2, "0");

export const toDateKey = (date = new Date()) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const isDateKey = (value) =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());

// Every day from start to end (inclusive)
export const eachDay = (startKey, endKey) => {
    const days = [];
    const cursor = new Date(`${startKey}T00:00:00`);
    const end = new Date(`${endKey}T00:00:00`);

    while (cursor <= end) {
        days.push(toDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return days;
};

// First and last day of a month (month is 1-12)
export const monthRange = (year, month) => {
    const last = new Date(year, month, 0).getDate();
    return { start: `${year}-${pad(month)}-01`, end: `${year}-${pad(month)}-${pad(last)}` };
};

// Combine a day and "HH:mm" into a Date
export const atTime = (dateKey, time) => new Date(`${dateKey}T${time}:00`);
