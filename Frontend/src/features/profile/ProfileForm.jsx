import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Mail, MapPin, Phone, Save, User, X } from "lucide-react";
import toast from "react-hot-toast";
import { updateProfile } from "../../api/authApi";
import { getErrorMessage } from "../../api/client";
import { Alert, Avatar, Button, Card, CardHeader, Input, Textarea } from "../../components/ui";
import { useAuth } from "../auth/AuthContext";

const PHONE_REGEX = /^[6-9]\d{9}$/;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const toForm = (user) => ({
    name: user?.name || "",
    phone: String(user?.phone || "").replace(/\D/g, "").slice(-10),
    address: user?.address || "",
});

// Backend PUT /auth/profile accepts name, phone, address and an optional "avatar" file
const validate = (form) => {
    const errors = {};

    if (!form.name.trim()) errors.name = "Name is required.";
    else if (form.name.trim().length < 3) errors.name = "Name must be at least 3 characters.";

    if (!form.phone.trim()) errors.phone = "Phone number is required.";
    else if (!PHONE_REGEX.test(form.phone.trim())) errors.phone = "Enter a valid 10-digit mobile number.";

    if (form.address.length > 500) errors.address = "Address is too long.";

    return errors;
};

const ProfileForm = () => {
    const { user, updateUser } = useAuth();
    const fileRef = useRef(null);

    const [form, setForm] = useState(() => toForm(user));
    const [avatarFile, setAvatarFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [saving, setSaving] = useState(false);

    // Local preview of a newly picked photo
    const previewUrl = useMemo(() => (avatarFile ? URL.createObjectURL(avatarFile) : ""), [avatarFile]);
    useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

    const initial = toForm(user);
    const dirty =
        !!avatarFile ||
        form.name !== initial.name ||
        form.phone !== initial.phone ||
        form.address !== initial.address;

    const handleChange = (event) => {
        const { name } = event.target;
        let { value } = event.target;

        if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);

        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setServerError("");
    };

    const handleAvatar = (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        if (!AVATAR_TYPES.includes(file.type)) {
            setErrors((prev) => ({ ...prev, avatar: "Use a JPG, PNG, WEBP or GIF image." }));
            return;
        }

        if (file.size > MAX_AVATAR_SIZE) {
            setErrors((prev) => ({ ...prev, avatar: "Image must be 5 MB or smaller." }));
            return;
        }

        setErrors((prev) => ({ ...prev, avatar: "" }));
        setAvatarFile(file);
    };

    const handleReset = () => {
        setForm(toForm(user));
        setAvatarFile(null);
        setErrors({});
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

        const data = new FormData();
        data.append("name", form.name.trim());
        data.append("phone", form.phone.trim());
        data.append("address", form.address.trim());
        if (avatarFile) data.append("avatar", avatarFile);

        try {
            const response = await updateProfile(data);
            const updated = response?.data;

            if (updated) {
                updateUser(updated);
                setForm(toForm(updated));
            }

            // The API silently ignores the photo if it couldn't be stored
            if (avatarFile && updated && updated.avatar?.url === user?.avatar?.url) {
                toast("Details saved, but your photo couldn't be uploaded right now.", { icon: "⚠️" });
            } else {
                toast.success("Profile updated.");
            }

            setAvatarFile(null);
        } catch (err) {
            setServerError(getErrorMessage(err, "Couldn't update your profile."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card as="form" onSubmit={handleSubmit} noValidate>
            <CardHeader title="Personal details" description="This is used to prefill your delivery details at checkout." />

            <div className="mb-6 flex flex-wrap items-center gap-4">
                <Avatar src={previewUrl || user?.avatar?.url} name={form.name || user?.name} size={72} />
                <div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" icon={Camera} onClick={() => fileRef.current?.click()}>
                            {user?.avatar?.url || avatarFile ? "Change photo" : "Upload photo"}
                        </Button>
                        {avatarFile && (
                            <Button variant="ghost" size="sm" icon={X} onClick={() => setAvatarFile(null)}>
                                Undo
                            </Button>
                        )}
                    </div>
                    {errors.avatar ? (
                        <p className="mt-1.5 text-xs font-medium text-danger">{errors.avatar}</p>
                    ) : (
                        <p className="mt-1.5 text-xs text-muted">JPG, PNG, WEBP or GIF, up to 5 MB.</p>
                    )}
                </div>
                <input
                    ref={fileRef}
                    type="file"
                    accept={AVATAR_TYPES.join(",")}
                    className="hidden"
                    onChange={handleAvatar}
                    aria-label="Upload profile photo"
                />
            </div>

            <Alert className="mb-5">{serverError}</Alert>

            <div className="grid gap-4 sm:grid-cols-2">
                <Input
                    label="Full name"
                    name="name"
                    autoComplete="name"
                    icon={User}
                    value={form.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                />
                <Input
                    label="Mobile number"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    icon={Phone}
                    value={form.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    required
                />
                <Input
                    label="Email address"
                    name="email"
                    type="email"
                    icon={Mail}
                    value={user?.email || ""}
                    disabled
                    hint="Email can't be changed."
                    className="sm:col-span-2"
                />
                <Textarea
                    label="Delivery address"
                    name="address"
                    rows={3}
                    autoComplete="street-address"
                    placeholder="House / flat no., street, area"
                    value={form.address}
                    onChange={handleChange}
                    error={errors.address}
                    className="sm:col-span-2"
                />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
                <Button variant="ghost" onClick={handleReset} disabled={!dirty || saving}>
                    Discard changes
                </Button>
                <Button type="submit" icon={Save} loading={saving} disabled={!dirty}>
                    Save changes
                </Button>
            </div>

            <p className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted">
                <MapPin size={13} /> Your address is only shared with our delivery team.
            </p>
        </Card>
    );
};

export default ProfileForm;
