import { useState } from "react";
import toast from "react-hot-toast";
import { applyLeave } from "../../../api/leaveApi";
import { getErrorMessage } from "../../../api/client";
import { Alert, Button, Input, Modal, Select, Textarea } from "../../../components/ui";
import { toDateKey } from "../hrUtils";

// Rendered only while open, so state starts fresh
const ApplyLeaveModal = ({ balances = [], onClose, onApplied }) => {
    const [form, setForm] = useState({
        type: balances[0]?.key || "casual",
        startDate: toDateKey(),
        endDate: toDateKey(),
        hours: "1",
        reason: "",
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const selected = balances.find((balance) => balance.key === form.type);
    const isHours = selected?.unit === "hours";

    const setField = (name, value) => {
        setForm((prev) => {
            const next = { ...prev, [name]: value };
            // Keep the end date on/after the start date
            if (name === "startDate" && next.endDate < value) next.endDate = value;
            return next;
        });
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (form.reason.trim().length < 3) return setError("Please give a reason.");
        if (!isHours && form.endDate < form.startDate) return setError("End date can't be before the start date.");

        try {
            setSaving(true);
            await applyLeave({
                type: form.type,
                startDate: form.startDate,
                endDate: isHours ? form.startDate : form.endDate,
                hours: isHours ? Number(form.hours) : undefined,
                reason: form.reason.trim(),
            });
            toast.success("Leave request sent for approval.");
            onApplied();
        } catch (err) {
            setError(getErrorMessage(err, "Couldn't send the request."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open
            onClose={saving ? undefined : onClose}
            title="Apply for leave"
            description="Your manager will approve or reject it."
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button type="submit" form="apply-leave-form" loading={saving}>
                        Send request
                    </Button>
                </>
            }
        >
            <form id="apply-leave-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Alert>{error}</Alert>

                <Select
                    label="Leave type"
                    required
                    value={form.type}
                    onChange={(event) => setField("type", event.target.value)}
                    options={balances.map((balance) => ({
                        value: balance.key,
                        label: `${balance.label} (${balance.available} ${balance.unit} left)`,
                    }))}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                        label={isHours ? "Date" : "From"}
                        type="date"
                        required
                        value={form.startDate}
                        onChange={(event) => setField("startDate", event.target.value)}
                    />
                    {isHours ? (
                        <Input
                            label="Hours"
                            type="number"
                            required
                            min="0.5"
                            max="8"
                            step="0.5"
                            value={form.hours}
                            onChange={(event) => setField("hours", event.target.value)}
                        />
                    ) : (
                        <Input
                            label="To"
                            type="date"
                            required
                            min={form.startDate}
                            value={form.endDate}
                            onChange={(event) => setField("endDate", event.target.value)}
                            hint="Holidays in between aren't counted."
                        />
                    )}
                </div>

                <Textarea
                    label="Reason"
                    required
                    rows={3}
                    maxLength={500}
                    value={form.reason}
                    onChange={(event) => setField("reason", event.target.value)}
                />
            </form>
        </Modal>
    );
};

export default ApplyLeaveModal;
