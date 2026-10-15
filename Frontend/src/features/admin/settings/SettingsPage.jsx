import { useState } from "react";
import { Mail, Percent, Phone, RotateCcw, Save, Store, Truck } from "lucide-react";
import toast from "react-hot-toast";

import { getSettings, resetSettings, updateSettings } from "../../../api/settingsApi";
import { getErrorMessage } from "../../../api/client";
import {
    Button,
    Card,
    CardHeader,
    ConfirmDialog,
    ErrorState,
    Input,
    PageHeader,
    Skeleton,
    Textarea,
} from "../../../components/ui";
import { formatDateTime } from "../../../utils/format";
import useRequest from "../../../hooks/useRequest";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../../utils/constants";

const fetchSettings = async () => (await getSettings())?.data ?? {};

const toForm = (settings) => ({
    restaurantName: settings.restaurantName ?? "",
    email: settings.email ?? "",
    phone: settings.phone ?? "",
    address: settings.address ?? "",
    deliveryCharge: String(settings.deliveryCharge ?? 0),
    tax: String(settings.tax ?? 0),
    currency: settings.currency ?? "₹",
});

const validate = (form) => {
    const errors = {};
    const delivery = Number(form.deliveryCharge);
    const tax = Number(form.tax);

    if (!form.restaurantName.trim()) errors.restaurantName = "Restaurant name is required.";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
    if (form.deliveryCharge === "" || !Number.isFinite(delivery) || delivery < 0) errors.deliveryCharge = "Enter 0 or more.";
    if (form.tax === "" || !Number.isFinite(tax) || tax < 0 || tax > 100) errors.tax = "Enter a percentage between 0 and 100.";
    if (!form.currency.trim()) errors.currency = "Currency symbol is required.";

    return errors;
};

// Form keyed by the saved settings, so it resets whenever fresh data arrives
const SettingsForm = ({ settings, onSaved, onReset, canUpdate = true }) => {
    const [form, setForm] = useState(() => toForm(settings));
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const initial = toForm(settings);
    const dirty = Object.keys(initial).some((key) => initial[key] !== form[key]);

    const setField = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const nextErrors = validate(form);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSaving(true);

        try {
            const res = await updateSettings({
                restaurantName: form.restaurantName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
                deliveryCharge: Number(form.deliveryCharge),
                tax: Number(form.tax),
                currency: form.currency.trim(),
            });
            toast.success(res?.message || "Settings saved.");
            onSaved(res?.data);
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not save settings."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <Card>
                <CardHeader title="Restaurant profile" description="Public details: anyone can read these from the website." />
                <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                        label="Restaurant name"
                        name="restaurantName"
                        icon={Store}
                        required
                        value={form.restaurantName}
                        onChange={setField}
                        error={errors.restaurantName}
                        className="sm:col-span-2"
                    />
                    <Input label="Email" name="email" type="email" icon={Mail} value={form.email} onChange={setField} error={errors.email} placeholder="hello@restaurant.com" />
                    <Input label="Phone" name="phone" type="tel" icon={Phone} value={form.phone} onChange={setField} placeholder="+91 98765 43210" />
                    <Textarea
                        label="Address"
                        name="address"
                        rows={3}
                        value={form.address}
                        onChange={setField}
                        placeholder="Street, area, city, PIN"
                        className="sm:col-span-2"
                    />
                </div>
            </Card>

            <Card>
                <CardHeader title="Pricing & charges" description="Applied to orders and shown at checkout." />
                <div className="grid gap-5 sm:grid-cols-3">
                    <Input
                        label="Delivery charge"
                        name="deliveryCharge"
                        type="number"
                        min="0"
                        step="0.01"
                        icon={Truck}
                        value={form.deliveryCharge}
                        onChange={setField}
                        error={errors.deliveryCharge}
                        hint="Flat fee per delivery order"
                    />
                    <Input
                        label="Tax"
                        name="tax"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        icon={Percent}
                        value={form.tax}
                        onChange={setField}
                        error={errors.tax}
                        hint="Percentage of the subtotal"
                    />
                    <Input
                        label="Currency symbol"
                        name="currency"
                        maxLength={5}
                        value={form.currency}
                        onChange={setField}
                        error={errors.currency}
                        hint="For example ₹ or $"
                    />
                </div>
            </Card>

            {/* Sticky action bar */}
            <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 p-4 shadow-lift backdrop-blur">
                <p className="text-sm text-muted">
                    {dirty
                        ? "You have unsaved changes."
                        : settings.updatedAt
                          ? `Last saved ${formatDateTime(settings.updatedAt)}`
                          : "All changes saved."}
                </p>
                <div className="flex flex-wrap gap-2">
                    {onReset && (
                        <Button variant="danger-outline" icon={RotateCcw} onClick={onReset} disabled={saving}>
                            Reset to defaults
                        </Button>
                    )}
                    {dirty && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setForm(initial);
                                setErrors({});
                            }}
                            disabled={saving}
                        >
                            Discard
                        </Button>
                    )}
                    {canUpdate && (
                        <Button type="submit" icon={Save} loading={saving} disabled={!dirty}>
                            Save changes
                        </Button>
                    )}
                </div>
            </div>
        </form>
    );
};

const SettingsPage = () => {
    const { can } = useAuth();
    const { data, loading, error, reload, setData } = useRequest(fetchSettings);
    const [confirmReset, setConfirmReset] = useState(false);
    const [resetting, setResetting] = useState(false);

    const handleReset = async () => {
        setResetting(true);

        try {
            await resetSettings();
            toast.success("Settings reset to defaults.");
            setConfirmReset(false);
            reload(); // GET recreates the default settings
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not reset settings."));
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="max-w-4xl">
            <PageHeader eyebrow="Configuration" title="Settings" description="Restaurant details, delivery charge and tax." />

            {loading ? (
                <div className="space-y-6">
                    <Skeleton className="h-72" />
                    <Skeleton className="h-44" />
                </div>
            ) : error ? (
                <Card>
                    <ErrorState message={error} onRetry={reload} />
                </Card>
            ) : (
                <SettingsForm
                    key={`${data?._id ?? "new"}-${data?.updatedAt ?? ""}`}
                    settings={data || {}}
                    onSaved={(saved) => (saved ? setData(saved) : reload())}
                    canUpdate={can(PERMISSIONS.SETTINGS_UPDATE)}
                    onReset={can(PERMISSIONS.SETTINGS_RESET) ? () => setConfirmReset(true) : undefined}
                />
            )}

            <ConfirmDialog
                open={confirmReset}
                onClose={() => setConfirmReset(false)}
                onConfirm={handleReset}
                loading={resetting}
                title="Reset all settings?"
                message="Restaurant name, contact details, delivery charge, tax and currency will go back to their defaults."
                confirmText="Reset"
            />
        </div>
    );
};

export default SettingsPage;
