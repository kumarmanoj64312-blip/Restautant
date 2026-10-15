import { useState } from "react";
import { KeyRound, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { changePassword } from "../../api/authApi";
import { getErrorMessage } from "../../api/client";
import { Alert, Button, Card, CardHeader } from "../../components/ui";
import PasswordInput from "../auth/PasswordInput";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

// Field names match Backend validation/authValidation.js -> validateChangePassword
const validate = (form) => {
    const errors = {};

    if (!form.currentPassword) errors.currentPassword = "Current password is required.";

    if (!form.newPassword) errors.newPassword = "New password is required.";
    else if (form.newPassword.length < 6) errors.newPassword = "New password must be at least 6 characters.";
    else if (form.newPassword === form.currentPassword) errors.newPassword = "Choose a password different from the current one.";

    if (!form.confirmPassword) errors.confirmPassword = "Please confirm the new password.";
    else if (form.newPassword !== form.confirmPassword) errors.confirmPassword = "Passwords do not match.";

    return errors;
};

const ChangePasswordForm = () => {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [saving, setSaving] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setServerError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (saving) return;

        const nextErrors = validate(form);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSaving(true);
        setServerError("");

        try {
            await changePassword(form);
            setForm(EMPTY);
            toast.success("Password changed successfully.");
        } catch (err) {
            setServerError(getErrorMessage(err, "Couldn't change your password."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card as="form" onSubmit={handleSubmit} noValidate>
            <CardHeader title="Change password" description="Use at least 6 characters. You'll stay signed in on this device." />

            <Alert className="mb-5">{serverError}</Alert>

            <div className="max-w-md space-y-4">
                <PasswordInput
                    label="Current password"
                    name="currentPassword"
                    autoComplete="current-password"
                    icon={Lock}
                    value={form.currentPassword}
                    onChange={handleChange}
                    error={errors.currentPassword}
                    required
                />
                <PasswordInput
                    label="New password"
                    name="newPassword"
                    autoComplete="new-password"
                    icon={KeyRound}
                    value={form.newPassword}
                    onChange={handleChange}
                    error={errors.newPassword}
                    required
                />
                <PasswordInput
                    label="Confirm new password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    icon={KeyRound}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    required
                />
            </div>

            <div className="mt-6 flex justify-end border-t border-line pt-5">
                <Button type="submit" icon={KeyRound} loading={saving}>
                    Update password
                </Button>
            </div>
        </Card>
    );
};

export default ChangePasswordForm;
