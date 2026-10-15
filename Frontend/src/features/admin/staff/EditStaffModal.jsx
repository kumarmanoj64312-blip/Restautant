import { useState } from "react";
import toast from "react-hot-toast";
import { updateStaff } from "../../../api/staffApi";
import { getErrorMessage } from "../../../api/client";
import { Alert, Avatar, Button, Input, Modal, Select } from "../../../components/ui";
import { ROLES } from "../../../utils/constants";
import { PHONE_PATTERN, STAFF_ROLE_OPTIONS, roleHint } from "./staffUtils";

const ROLE_OPTIONS = [
    ...STAFF_ROLE_OPTIONS,
    { value: ROLES.CUSTOMER, label: "Customer (remove staff access)" },
];

// Rendered only while open, so state starts from `member` each time
const EditStaffModal = ({ member, isSelf, onClose, onSaved }) => {
    const [form, setForm] = useState({
        name: member.name || "",
        phone: member.phone || "",
        role: member.role,
    });
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

        const nextErrors = {};
        if (form.name.trim().length < 3) nextErrors.name = "At least 3 characters.";
        if (!PHONE_PATTERN.test(form.phone.trim())) nextErrors.phone = "Enter a 10-digit phone number.";
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        // Send only what changed
        const updates = {};
        if (form.name.trim() !== member.name) updates.name = form.name.trim();
        if (form.phone.trim() !== member.phone) updates.phone = form.phone.trim();
        if (!isSelf && form.role !== member.role) updates.role = form.role;

        if (Object.keys(updates).length === 0) {
            onClose();
            return;
        }

        try {
            setSaving(true);
            const response = await updateStaff(member._id, updates);
            toast.success(updates.role === ROLES.CUSTOMER ? `${member.name} no longer has staff access.` : "Staff member updated.");
            onSaved(response?.data);
        } catch (err) {
            setServerError(getErrorMessage(err, "Could not update the staff member."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open
            onClose={saving ? undefined : onClose}
            title="Edit staff member"
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button type="submit" form="edit-staff-form" loading={saving}>
                        Save changes
                    </Button>
                </>
            }
        >
            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-canvas p-3">
                <Avatar name={member.name} src={member.avatar?.url} size={44} />
                <div className="min-w-0">
                    <p className="truncate font-semibold">{member.name}</p>
                    <p className="truncate text-sm text-muted">{member.email}</p>
                </div>
            </div>

            <form id="edit-staff-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Alert>{serverError}</Alert>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                        label="Full name"
                        required
                        value={form.name}
                        onChange={(event) => setField("name", event.target.value)}
                        error={errors.name}
                    />
                    <Input
                        label="Phone"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        value={form.phone}
                        onChange={(event) => setField("phone", event.target.value.replace(/\D/g, ""))}
                        error={errors.phone}
                    />
                </div>

                <Select
                    label="Role"
                    value={form.role}
                    disabled={isSelf}
                    onChange={(event) => setField("role", event.target.value)}
                    options={ROLE_OPTIONS}
                    hint={isSelf ? "You can't change your own role." : roleHint(form.role)}
                />

                {!isSelf && form.role === ROLES.CUSTOMER && (
                    <Alert tone="warning">
                        {member.name} will lose access to the admin panel, POS and kitchen, but keep their account.
                    </Alert>
                )}
                {!isSelf && form.role === ROLES.ADMIN && member.role !== ROLES.ADMIN && (
                    <Alert tone="warning">Admins have full access, including staff and permissions.</Alert>
                )}
            </form>
        </Modal>
    );
};

export default EditStaffModal;
