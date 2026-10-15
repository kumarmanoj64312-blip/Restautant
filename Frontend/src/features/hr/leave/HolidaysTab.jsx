import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Gift, Plus, Trash2 } from "lucide-react";
import { addHoliday, deleteHoliday, getHolidays } from "../../../api/leaveApi";
import { getErrorMessage, unwrapList } from "../../../api/client";
import { Button, Card, ConfirmDialog, DataTable, ErrorState, Input } from "../../../components/ui";
import useRequest from "../../../hooks/useRequest";
import { YEAR_OPTIONS, formatDay, toDateKey } from "../hrUtils";

const HolidaysTab = ({ canManage }) => {
    const [year, setYear] = useState(() => String(new Date().getFullYear()));
    const [form, setForm] = useState({ date: toDateKey(), name: "" });
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchHolidays = useCallback(async () => unwrapList(await getHolidays(year)), [year]);
    const { data, loading, error, reload } = useRequest(fetchHolidays);
    const today = toDateKey();

    const handleAdd = async (event) => {
        event.preventDefault();
        if (!form.name.trim()) return toast.error("Give the holiday a name.");

        try {
            setSaving(true);
            await addHoliday({ date: form.date, name: form.name.trim() });
            toast.success("Holiday added.");
            setForm((prev) => ({ ...prev, name: "" }));
            reload();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't add the holiday."));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await deleteHoliday(toDelete._id);
            toast.success("Holiday removed.");
            setToDelete(null);
            reload();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't remove the holiday."));
        } finally {
            setDeleting(false);
        }
    };

    const columns = [
        { key: "index", header: "S.No", className: "text-muted", render: (_, index) => index + 1 },
        { key: "date", header: "Date", className: "whitespace-nowrap font-semibold", render: (row) => formatDay(row.date) },
        { key: "name", header: "Holiday", render: (row) => row.name },
        {
            key: "when",
            header: "",
            render: (row) => (
                <span className={`text-xs font-semibold ${row.date >= today ? "text-success" : "text-muted"}`}>
                    {row.date === today ? "Today" : row.date > today ? "Upcoming" : "Past"}
                </span>
            ),
        },
        ...(canManage
            ? [
                  {
                      key: "actions",
                      header: "",
                      align: "right",
                      render: (row) => (
                          <Button
                              size="icon-sm"
                              variant="ghost"
                              icon={Trash2}
                              className="text-danger hover:bg-red-50"
                              aria-label={`Remove ${row.name}`}
                              onClick={() => setToDelete(row)}
                          />
                      ),
                  },
              ]
            : []),
    ];

    return (
        <div className="space-y-6">
            {canManage && (
                <Card>
                    <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
                        <Input label="Date" type="date" required value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} />
                        <Input
                            label="Holiday name"
                            required
                            placeholder="e.g. Diwali"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                        <Button type="submit" icon={Plus} loading={saving}>
                            Add holiday
                        </Button>
                    </form>
                </Card>
            )}

            <Card padding="none" className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                    <h2 className="font-bold text-ink">Holidays</h2>
                    <select
                        aria-label="Year"
                        value={year}
                        onChange={(event) => setYear(event.target.value)}
                        className="h-10 rounded-xl border border-line bg-surface px-3 text-sm font-medium focus:border-brand focus:outline-none"
                    >
                        {[String(new Date().getFullYear() + 1), ...YEAR_OPTIONS.map((option) => option.value)].map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>
                </div>

                {error ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : (
                    <DataTable
                        columns={columns}
                        rows={data ?? []}
                        loading={loading}
                        empty={{ icon: Gift, title: `No holidays in ${year}`, description: canManage ? "Add the days the restaurant is closed." : undefined }}
                    />
                )}
            </Card>

            <ConfirmDialog
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Remove this holiday?"
                confirmText="Remove"
                message={toDelete ? `${toDelete.name} (${formatDay(toDelete.date)}) will count as a normal working day.` : ""}
            />
        </div>
    );
};

export default HolidaysTab;
