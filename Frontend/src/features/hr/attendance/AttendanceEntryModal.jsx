import { useState } from "react";
import toast from "react-hot-toast";
import { createAttendanceEntry, updateAttendanceEntry } from "../../../api/attendanceApi";
import { getErrorMessage } from "../../../api/client";
import { Alert, Button, Input, Modal, Select, Textarea } from "../../../components/ui";
import { toDateKey, toTimeInput } from "../hrUtils";

/**
 * Add or correct one day's attendance (attendance.manage).
 * `entry` = a history row being edited, or { date, userId } to prefill a new one.
 * Rendered only while open, so state starts fresh.
 */
const AttendanceEntryModal = ({ entry, staffOptions, defaultUserId, onClose, onSaved }) => {
    const editing = !!entry?.recordId;

    const [form, setForm] = useState({
        userId: entry?.userId || defaultUserId || "",
        date: entry?.date || toDateKey(),
        inTime: toTimeInput(entry?.firstIn) || "09:00",
        outTime: toTimeInput(entry?.lastOut) || "",
        note: entry?.note || "",
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const setField = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.userId) return setError("Choose a staff member.");
        if (!form.inTime) return setError("Enter a punch-in time.");
        if (form.outTime && form.outTime <= form.inTime) return setError("Punch out must be after punch in.");

        try {
            setSaving(true);
            const payload = { inTime: form.inTime, outTime: form.outTime || undefined, note: form.note };

            if (editing) await updateAttendanceEntry(entry.recordId, payload);
            else await createAttendanceEntry({ ...payload, userId: form.userId, date: form.date });

            toast.success(editing ? "Attendance updated." : "Attendance added.");
            onSaved();
        } catch (err) {
            setError(getErrorMessage(err, "Couldn't save attendance."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open
            onClose={saving ? undefined : onClose}
            title={editing ? "Edit attendance" : "Add attendance entry"}
            description="Replaces any punches already recorded for that day."
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button type="submit" form="attendance-entry-form" loading={saving}>
                        Save
                    </Button>
                </>
            }
        >
            <form id="attendance-entry-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Alert>{error}</Alert>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                        label="Staff member"
                        required
                        value={form.userId}
                        disabled={editing}
                        onChange={(event) => setField("userId", event.target.value)}
                        placeholder="Choose..."
                        options={staffOptions}
                    />
                    <Input
                        label="Date"
                        type="date"
                        required
                        value={form.date}
                        max={toDateKey()}
                        disabled={editing}
                        onChange={(event) => setField("date", event.target.value)}
                    />
                    <Input label="Punch in" type="time" required value={form.inTime} onChange={(event) => setField("inTime", event.target.value)} />
                    <Input
                        label="Punch out"
                        type="time"
                        value={form.outTime}
                        hint="Leave empty if still on shift."
                        onChange={(event) => setField("outTime", event.target.value)}
                    />
                </div>

                <Textarea
                    label="Note"
                    rows={2}
                    maxLength={300}
                    placeholder="Reason for the correction (optional)"
                    value={form.note}
                    onChange={(event) => setField("note", event.target.value)}
                />
            </form>
        </Modal>
    );
};

export default AttendanceEntryModal;
