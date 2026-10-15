import { useState } from "react";
import toast from "react-hot-toast";
import { createStaff, promoteToStaff } from "../../../api/staffApi";
import { getErrorMessage } from "../../../api/client";
import { Alert, Button, Input, Modal, Select } from "../../../components/ui";
import { EMAIL_PATTERN, PHONE_PATTERN, STAFF_ROLE_OPTIONS, roleHint } from "./staffUtils";

const EMPTY = { name: "", email: "", phone: "", password: "", role: STAFF_ROLE_OPTIONS[0].value };

const validate = (form, mode) => {
    const errors = {};

    if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address.";

    if (mode === "new") {
        if (form.name.trim().length < 3) errors.name = "At least 3 characters.";
        if (!PHONE_PATTERN.test(form.phone.trim())) errors.phone = "Enter a 10-digit phone number.";
        if (form.password.length < 6) errors.password = "At least 6 characters.";
    }

    return errors;
};

// Rendered only while open, so state starts fresh each time
const AddStaffModal = ({ onClose, onAdded }) => {
    const [mode, setMode] = useState("new"); // "new" | "existing"
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [saving, setSaving] = useState(false);

    const setField = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
        setServerError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const nextErrors = validate(form, mode);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        try {
            setSaving(true);

            const response =
                mode === "new"
                    ? await createStaff({
                          name: form.name.trim(),
                          email: form.email.trim(),
                          phone: form.phone.trim(),
                          password: form.password,
                          role: form.role,
                      })
                    : await promoteToStaff({ email: form.email.trim(), role: form.role });

            toast.success(mode === "new" ? "Staff member added." : "Staff role assigned.");
            onAdded(response?.data);
        } catch (err) {
            setServerError(getErrorMessage(err, "Could not add the staff member."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open
            onClose={saving ? undefined : onClose}
            title="Add staff member"
            description="Create a new staff login, or give an existing account a staff role."
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button type="submit" form="add-staff-form" loading={saving}>
                        {mode === "new" ? "Create account" : "Assign role"}
                    </Button>
                </>
            }
        >
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1">
                {[
                    ["new", "New account"],
                    ["existing", "Existing account"],
                ].map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => {
                            setMode(value);
                            setErrors({});
                            setServerError("");
                        }}
                        className={`rounded-lg py-2 text-sm font-semibold transition ${
                            mode === value ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <form id="add-staff-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Alert>{serverError}</Alert>

                {mode === "new" && (
                    <Input
                        label="Full name"
                        required
                        value={form.name}
                        onChange={(event) => setField("name", event.target.value)}
                        error={errors.name}
                        autoComplete="off"
                    />
                )}

                <Input
                    label="Email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setField("email", event.target.value)}
                    error={errors.email}
                    hint={mode === "existing" ? "The email the person registered with." : undefined}
                    autoComplete="off"
                />

                {mode === "new" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label="Phone"
                            required
                            inputMode="numeric"
                            maxLength={10}
                            value={form.phone}
                            onChange={(event) => setField("phone", event.target.value.replace(/\D/g, ""))}
                            error={errors.phone}
                        />
                        <Input
                            label="Temporary password"
                            type="password"
                            required
                            value={form.password}
                            onChange={(event) => setField("password", event.target.value)}
                            error={errors.password}
                            hint="Share it privately; they can change it in their profile."
                            autoComplete="new-password"
                        />
                    </div>
                )}

                <Select
                    label="Role"
                    required
                    value={form.role}
                    onChange={(event) => setField("role", event.target.value)}
                    options={STAFF_ROLE_OPTIONS}
                    hint={roleHint(form.role)}
                />
            </form>
        </Modal>
    );
};

export default AddStaffModal;
