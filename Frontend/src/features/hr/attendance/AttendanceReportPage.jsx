import { useCallback, useState } from "react";
import { CalendarCheck, CalendarDays, Download, LogIn, LogOut, Search, Sun, UserCheck, Users, UserX } from "lucide-react";
import { getDailyReport, getMonthlyReport } from "../../../api/attendanceApi";
import { Avatar, Button, Card, DataTable, ErrorState, Input, PageHeader, StatCard, StatusBadge, Tabs } from "../../../components/ui";
import { ROLE_LABELS } from "../../../utils/constants";
import useRequest from "../../../hooks/useRequest";
import { MONTH_OPTIONS, MONTHS, YEAR_OPTIONS, downloadCsv, formatDay, formatMinutes, formatTime, toDateKey } from "../hrUtils";

const ROLE_OPTIONS = [
    { value: "", label: "All roles" },
    { value: "admin", label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "kitchen", label: "Kitchen Staff" },
];

const STATUS_OPTIONS = [
    { value: "", label: "All statuses" },
    { value: "Present", label: "Present" },
    { value: "Absent", label: "Absent" },
    { value: "On Leave", label: "On Leave" },
    { value: "Holiday", label: "Holiday" },
];

const selectClass =
    "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

const FilterSelect = ({ label, value, onChange, options }) => (
    <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </label>
);

const NameCell = ({ user }) => (
    <div className="flex items-center gap-3">
        <Avatar name={user.name} src={user.avatar?.url} size={34} />
        <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
    </div>
);

const AttendanceReportPage = () => {
    const [type, setType] = useState("daily");
    const [date, setDate] = useState(() => toDateKey());
    const [month, setMonth] = useState(() => String(new Date().getMonth() + 1));
    const [year, setYear] = useState(() => String(new Date().getFullYear()));
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");

    const fetchReport = useCallback(async () => {
        const params = { role: role || undefined, search: search.trim() || undefined };
        const response =
            type === "daily"
                ? await getDailyReport({ ...params, date, status: status || undefined })
                : await getMonthlyReport({ ...params, month, year });
        return { type, ...response?.data };
    }, [type, date, month, year, role, status, search]);

    const { data, loading, error, reload } = useRequest(fetchReport);
    const rows = data?.type === type ? data.rows ?? [] : [];
    const summary = data?.summary;

    const clearFilters = () => {
        setDate(toDateKey());
        setMonth(String(new Date().getMonth() + 1));
        setYear(String(new Date().getFullYear()));
        setRole("");
        setStatus("");
        setSearch("");
    };

    const handleExport = () => {
        if (type === "daily") {
            downloadCsv(
                `attendance-${date}.csv`,
                ["Name", "Email", "Role", "In", "Out", "Worked (hh:mm)", "Status"],
                rows.map((row) => [
                    row.user.name,
                    row.user.email,
                    ROLE_LABELS[row.user.role],
                    formatTime(row.firstIn),
                    row.isOpen ? "On shift" : formatTime(row.lastOut),
                    formatMinutes(row.workedMinutes),
                    row.status,
                ])
            );
        } else {
            downloadCsv(
                `attendance-${year}-${String(month).padStart(2, "0")}.csv`,
                ["Name", "Email", "Role", "Working days", "Present", "Absent", "On leave", "Holiday", "Worked (hh:mm)"],
                rows.map((row) => [
                    row.user.name,
                    row.user.email,
                    ROLE_LABELS[row.user.role],
                    row.workingDays,
                    row.present,
                    row.absent,
                    row.onLeave,
                    row.holiday,
                    formatMinutes(row.workedMinutes),
                ])
            );
        }
    };

    const dailyColumns = [
        { key: "index", header: "#", className: "text-muted", render: (_, index) => index + 1 },
        { key: "name", header: "Name", render: (row) => <NameCell user={row.user} /> },
        { key: "role", header: "Role", className: "whitespace-nowrap", render: (row) => ROLE_LABELS[row.user.role] },
        {
            key: "hours",
            header: "Working hrs",
            className: "tabular-nums whitespace-nowrap",
            render: (row) => <span className={row.workedMinutes ? "font-semibold text-success" : "text-danger"}>{formatMinutes(row.workedMinutes)} hrs</span>,
        },
        {
            key: "in",
            header: "In",
            className: "whitespace-nowrap",
            render: (row) => (
                <span className="flex items-center gap-1.5">
                    <LogIn size={14} className="text-muted" />
                    {row.firstIn ? formatTime(row.firstIn) : <span className="italic text-muted">No entry</span>}
                </span>
            ),
        },
        {
            key: "out",
            header: "Out",
            className: "whitespace-nowrap",
            render: (row) => (
                <span className="flex items-center gap-1.5">
                    <LogOut size={14} className="text-muted" />
                    {row.isOpen ? <span className="font-semibold text-success">On shift</span> : row.lastOut ? formatTime(row.lastOut) : "—"}
                </span>
            ),
        },
        { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    ];

    const count = (value, tone) => <span className={value ? `font-semibold ${tone}` : "text-muted"}>{value}</span>;

    const monthlyColumns = [
        { key: "index", header: "#", className: "text-muted", render: (_, index) => index + 1 },
        { key: "name", header: "Name", render: (row) => <NameCell user={row.user} /> },
        { key: "role", header: "Role", className: "whitespace-nowrap", render: (row) => ROLE_LABELS[row.user.role] },
        { key: "days", header: "Days", align: "center", render: (row) => row.workingDays },
        { key: "present", header: "Present", align: "center", render: (row) => count(row.present, "text-success") },
        { key: "absent", header: "Absent", align: "center", render: (row) => count(row.absent, "text-danger") },
        { key: "leave", header: "On leave", align: "center", render: (row) => count(row.onLeave, "text-sky-700") },
        { key: "holiday", header: "Holiday", align: "center", render: (row) => count(row.holiday, "text-ink") },
        { key: "hours", header: "Worked hrs", align: "right", className: "tabular-nums", render: (row) => formatMinutes(row.workedMinutes) },
    ];

    const title =
        type === "daily"
            ? `Attendance report (day wise) — ${formatDay(date)}${data?.holidayName ? ` · ${data.holidayName}` : ""}`
            : `Attendance report (monthly) — ${MONTHS[Number(month) - 1]} ${year}`;

    return (
        <div>
            <PageHeader
                eyebrow="HR"
                title="Attendance Reports"
                description="Who was in, who was out, and hours worked."
                actions={
                    <Button icon={Download} onClick={handleExport} disabled={loading || rows.length === 0} className="!bg-success hover:!bg-green-800">
                        Export CSV
                    </Button>
                }
            />

            {/* Filters */}
            <Card className="mb-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[auto_1fr_1fr_1fr_1.4fr_auto] xl:items-end">
                    <div className="space-y-1.5">
                        <span className="text-sm font-semibold text-ink">Report type</span>
                        <Tabs
                            value={type}
                            onChange={setType}
                            items={[
                                { value: "daily", label: "Daily" },
                                { value: "monthly", label: "Monthly" },
                            ]}
                        />
                    </div>

                    {type === "daily" ? (
                        <Input label="Date" type="date" value={date} max={toDateKey()} onChange={(event) => setDate(event.target.value || toDateKey())} />
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <FilterSelect label="Month" value={month} onChange={setMonth} options={MONTH_OPTIONS} />
                            <FilterSelect label="Year" value={year} onChange={setYear} options={YEAR_OPTIONS} />
                        </div>
                    )}

                    <FilterSelect label="Role" value={role} onChange={setRole} options={ROLE_OPTIONS} />

                    {type === "daily" ? (
                        <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                    ) : (
                        <div className="hidden xl:block" />
                    )}

                    <Input label="Search" icon={Search} placeholder="Name or email" value={search} onChange={(event) => setSearch(event.target.value)} />

                    <Button variant="ghost" onClick={clearFilters}>
                        Clear
                    </Button>
                </div>
            </Card>

            {/* Daily summary */}
            {type === "daily" && (
                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                    <StatCard label="Total staff" value={summary?.total ?? "—"} icon={Users} />
                    <StatCard label="Present" value={summary?.present ?? "—"} icon={UserCheck} tone="success" />
                    <StatCard label="Absent" value={summary?.absent ?? "—"} icon={UserX} tone="danger" />
                    <StatCard label="On leave" value={summary?.onLeave ?? "—"} icon={CalendarCheck} tone="info" />
                    <StatCard label="Holiday" value={summary?.holiday ?? "—"} icon={Sun} tone="warning" />
                </div>
            )}

            <Card padding="none" className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                    <h2 className="flex items-center gap-2 font-bold text-ink">
                        <CalendarDays size={18} className="text-brand" />
                        {title}
                    </h2>
                    <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-dark">
                        {rows.length} {rows.length === 1 ? "record" : "records"}
                    </span>
                </div>

                {error ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : (
                    <DataTable
                        columns={type === "daily" ? dailyColumns : monthlyColumns}
                        rows={rows}
                        rowKey={(row) => row.user._id}
                        loading={loading}
                        empty={{ icon: Users, title: "No staff match these filters" }}
                    />
                )}
            </Card>
        </div>
    );
};

export default AttendanceReportPage;
