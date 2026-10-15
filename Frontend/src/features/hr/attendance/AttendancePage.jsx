import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock, Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteAttendanceEntry, getAttendanceHistory, getAttendanceStaff } from "../../../api/attendanceApi";
import { getErrorMessage, unwrapList } from "../../../api/client";
import { Badge, Button, Card, ConfirmDialog, DataTable, ErrorState, PageHeader, StatusBadge } from "../../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS, ROLE_LABELS } from "../../../utils/constants";
import useRequest from "../../../hooks/useRequest";
import { MONTH_OPTIONS, YEAR_OPTIONS, formatDay, formatMinutes, formatTime, toDateKey } from "../hrUtils";
import ClockCard from "./ClockCard";
import AttendanceEntryModal from "./AttendanceEntryModal";

const selectClass =
    "h-10 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

const currentMonth = () => String(new Date().getMonth() + 1);
const currentYear = () => String(new Date().getFullYear());

const AttendancePage = () => {
    const { user, can } = useAuth();
    const canViewAll = can(PERMISSIONS.ATTENDANCE_READ);
    const canManage = can(PERMISSIONS.ATTENDANCE_MANAGE);

    const [userId, setUserId] = useState("");
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [editing, setEditing] = useState(null); // row being edited / {date,userId} for new
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const viewedUserId = userId || user?._id;

    // Staff picker (only for people who may view everyone)
    const fetchStaff = useCallback(async () => (canViewAll ? unwrapList(await getAttendanceStaff()) : []), [canViewAll]);
    const { data: staff } = useRequest(fetchStaff);
    const staffOptions = useMemo(
        () =>
            (staff?.length ? staff : [user]).filter(Boolean).map((member) => ({
                value: member._id,
                label: `${member.name} (${ROLE_LABELS[member.role] || member.role})`,
            })),
        [staff, user]
    );

    const fetchHistory = useCallback(
        async () => (await getAttendanceHistory({ userId: userId || undefined, month, year }))?.data,
        [userId, month, year]
    );
    const { data, loading, refreshing, error, reload } = useRequest(fetchHistory);
    const rows = data?.rows ?? [];
    const person = data?.user;

    const filtered = userId || month !== currentMonth() || year !== currentYear();
    const clearFilters = () => {
        setUserId("");
        setMonth(currentMonth());
        setYear(currentYear());
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await deleteAttendanceEntry(toDelete.recordId);
            toast.success("Attendance entry deleted.");
            setToDelete(null);
            reload();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't delete the entry."));
        } finally {
            setDeleting(false);
        }
    };

    const today = toDateKey();

    const columns = [
        { key: "user", header: "User", className: "whitespace-nowrap font-semibold", render: () => person?.name },
        { key: "date", header: "Date", className: "whitespace-nowrap", render: (row) => formatDay(row.date) },
        {
            key: "punch",
            header: "Punch In / Out",
            render: (row) =>
                row.firstIn ? (
                    <span className="whitespace-nowrap">
                        {formatTime(row.firstIn)} — {row.isOpen ? <Badge tone="success">On shift</Badge> : formatTime(row.lastOut)}
                        {row.sessions?.length > 1 && <span className="ml-2 text-xs text-muted">({row.sessions.length} punches)</span>}
                        {row.source === "manual" && <span className="ml-2 text-xs text-muted">(manual)</span>}
                    </span>
                ) : (
                    <span className="text-muted">{row.holidayName || "—"}</span>
                ),
        },
        {
            key: "break",
            header: "Break hrs",
            className: "tabular-nums",
            render: (row) => (row.breakMinutes ? formatMinutes(row.breakMinutes) : <span className="text-muted">—</span>),
        },
        {
            key: "logged",
            header: "Logged hrs",
            className: "tabular-nums",
            render: (row) => (
                <span className={row.workedMinutes ? "font-semibold text-success" : "text-muted"}>{formatMinutes(row.workedMinutes)}</span>
            ),
        },
        { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
        ...(canManage
            ? [
                  {
                      key: "actions",
                      header: "",
                      align: "right",
                      render: (row) => (
                          <div className="flex justify-end gap-1">
                              <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  icon={row.recordId ? Pencil : Plus}
                                  aria-label={row.recordId ? "Edit entry" : "Add entry for this day"}
                                  title={row.recordId ? "Edit" : "Add entry"}
                                  onClick={() => setEditing({ ...row, userId: person?._id })}
                              />
                              {row.recordId && (
                                  <Button
                                      size="icon-sm"
                                      variant="ghost"
                                      icon={Trash2}
                                      className="text-danger hover:bg-red-50"
                                      aria-label="Delete entry"
                                      title="Delete"
                                      onClick={() => setToDelete(row)}
                                  />
                              )}
                          </div>
                      ),
                  },
              ]
            : []),
    ];

    return (
        <div>
            <PageHeader eyebrow="HR" title="Attendance" description="Clock in and out, and track attendance records." />

            <ClockCard onChange={reload} />

            <Card padding="none" className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                    <h2 className="flex items-center gap-2 font-bold text-ink">
                        <CalendarClock size={18} className="text-brand" />
                        Attendance History
                    </h2>

                    <div className="flex flex-wrap items-center gap-2">
                        {canViewAll && (
                            <select aria-label="Staff member" value={viewedUserId || ""} onChange={(event) => setUserId(event.target.value)} className={`${selectClass} min-w-48`}>
                                {staffOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        )}
                        <select aria-label="Month" value={month} onChange={(event) => setMonth(event.target.value)} className={selectClass}>
                            {MONTH_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select aria-label="Year" value={year} onChange={(event) => setYear(event.target.value)} className={selectClass}>
                            {YEAR_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {filtered && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                Clear
                            </Button>
                        )}
                        {canManage && (
                            <Button icon={Plus} onClick={() => setEditing({ userId: viewedUserId })}>
                                Add Entry
                            </Button>
                        )}
                    </div>
                </div>

                {error ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : (
                    <DataTable
                        columns={columns}
                        rows={rows}
                        rowKey={(row) => row.date}
                        loading={loading || refreshing}
                        rowClassName={(row) =>
                            row.date === today ? "bg-sky-50/70" : row.status === "Holiday" ? "bg-amber-50/70" : row.status === "On Leave" ? "bg-indigo-50/50" : ""
                        }
                        empty={{ icon: Clock, title: "No attendance for this month", description: "Days appear here from the joining date up to today." }}
                    />
                )}
            </Card>

            {editing && (
                <AttendanceEntryModal
                    entry={editing}
                    staffOptions={staffOptions}
                    defaultUserId={viewedUserId}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        reload();
                    }}
                />
            )}

            <ConfirmDialog
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Delete this attendance entry?"
                message={toDelete ? `All punches for ${person?.name} on ${formatDay(toDelete.date)} will be removed.` : ""}
            />
        </div>
    );
};

export default AttendancePage;
