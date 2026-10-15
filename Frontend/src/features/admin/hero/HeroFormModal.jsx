import { useState } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

import { createHero, updateHero } from "../../../api/heroApi";
import { getErrorMessage } from "../../../api/client";
import { Alert, Button, ImageUpload, Input, Modal, Switch, Textarea } from "../../../components/ui";

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

// Initial form values from an existing banner (or defaults from heroService.createHero)
const buildForm = (hero, nextOrder) => ({
    title: hero?.title || "",
    subtitle: hero?.subtitle || "",
    description: hero?.description || "",
    badge: hero?.badge || "",
    offerText: hero?.offerText || "",
    buttonText: hero?.buttonText ?? "Order Now",
    buttonLink: hero?.buttonLink ?? "/menu",
    backgroundColor: hero?.backgroundColor || "#ffffff",
    textColor: hero?.textColor || "#000000",
    displayOrder: String(hero?.displayOrder ?? nextOrder),
    isActive: hero ? hero.isActive !== false : true,
    startDate: toDateInput(hero?.startDate),
    endDate: toDateInput(hero?.endDate),
});

const validate = (form, image, isEdit) => {
    const errors = {};

    if (!isEdit && !image) errors.image = "A banner image is required.";
    if (form.title.length > 120) errors.title = "Keep the title under 120 characters.";

    const order = Number(form.displayOrder);
    if (form.displayOrder === "" || !Number.isInteger(order) || order < 0) {
        errors.displayOrder = "Use a whole number, 0 or more.";
    }

    if (form.buttonLink && !/^(\/|https?:\/\/)/i.test(form.buttonLink.trim())) {
        errors.buttonLink = "Start with / for a page on this site, or http(s)://.";
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
        errors.endDate = "End date must be on or after the start date.";
    }

    return errors;
};

/**
 * Create / edit a hero banner. Remount with a new `key` each time it opens
 * so the form starts from the given hero.
 */
const HeroFormModal = ({ open, hero, nextOrder = 1, onClose, onSaved }) => {
    const isEdit = Boolean(hero?._id);

    const [form, setForm] = useState(() => buildForm(hero, nextOrder));
    const [image, setImage] = useState(null);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [saving, setSaving] = useState(false);

    const setField = (name, value) => {
        setForm((current) => ({ ...current, [name]: value }));
        setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
    };

    const handleChange = (event) => setField(event.target.name, event.target.value);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitError("");

        const nextErrors = validate(form, image, isEdit);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        // Field names follow heroService.createHero / updateHero
        const payload = new FormData();
        ["title", "subtitle", "description", "badge", "offerText", "buttonText", "buttonLink", "backgroundColor", "textColor"].forEach(
            (key) => payload.append(key, form[key].trim())
        );
        payload.append("displayOrder", String(Number(form.displayOrder)));
        payload.append("isActive", String(form.isActive));
        if (form.startDate) payload.append("startDate", form.startDate);
        if (form.endDate) payload.append("endDate", form.endDate);
        if (image) payload.append("image", image);

        setSaving(true);
        try {
            const res = isEdit ? await updateHero(hero._id, payload) : await createHero(payload);
            toast.success(isEdit ? "Banner updated." : "Banner created.");
            onSaved?.(res?.data);
        } catch (err) {
            const message = getErrorMessage(err, "Could not save the banner.");
            setSubmitError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={saving ? undefined : onClose}
            size="xl"
            title={isEdit ? "Edit banner" : "New banner"}
            description="Shown in the carousel at the top of the home page."
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button type="submit" form="hero-form" icon={Save} loading={saving}>
                        {isEdit ? "Save changes" : "Create banner"}
                    </Button>
                </>
            }
        >
            <form id="hero-form" onSubmit={handleSubmit} noValidate className="space-y-5">
                <Alert>{submitError}</Alert>

                <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
                    {/* Text content */}
                    <div className="space-y-4">
                        <Input label="Title" name="title" value={form.title} onChange={handleChange} error={errors.title} placeholder="e.g. Weekend Biryani Festival" />
                        <Input label="Subtitle" name="subtitle" value={form.subtitle} onChange={handleChange} placeholder="A short supporting line" />
                        <Textarea label="Description" name="description" rows={3} value={form.description} onChange={handleChange} />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="Badge" name="badge" value={form.badge} onChange={handleChange} placeholder="e.g. New" />
                            <Input label="Offer text" name="offerText" value={form.offerText} onChange={handleChange} placeholder="e.g. 20% off" />
                            <Input label="Button text" name="buttonText" value={form.buttonText} onChange={handleChange} />
                            <Input
                                label="Button link"
                                name="buttonLink"
                                value={form.buttonLink}
                                onChange={handleChange}
                                error={errors.buttonLink}
                                placeholder="/menu"
                            />
                            <Input label="Start date" name="startDate" type="date" value={form.startDate} onChange={handleChange} hint="Optional" />
                            <Input
                                label="End date"
                                name="endDate"
                                type="date"
                                value={form.endDate}
                                onChange={handleChange}
                                error={errors.endDate}
                                hint="Optional"
                            />
                        </div>
                    </div>

                    {/* Image and settings */}
                    <div className="space-y-4">
                        <ImageUpload
                            label={isEdit ? "Banner image" : "Banner image *"}
                            value={image}
                            existingUrl={hero?.image?.url || ""}
                            onChange={(file) => {
                                setImage(file);
                                setErrors((current) => ({ ...current, image: undefined }));
                            }}
                            error={errors.image}
                            hint="Wide images (16:9) work best. Up to 5 MB."
                        />

                        <Input
                            label="Display order"
                            name="displayOrder"
                            type="number"
                            min="0"
                            step="1"
                            value={form.displayOrder}
                            onChange={handleChange}
                            error={errors.displayOrder}
                            hint="Lower numbers show first."
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <label className="space-y-1.5">
                                <span className="block text-sm font-semibold text-ink">Background</span>
                                <input
                                    type="color"
                                    name="backgroundColor"
                                    value={form.backgroundColor}
                                    onChange={handleChange}
                                    className="h-11 w-full cursor-pointer rounded-xl border border-line bg-surface p-1"
                                />
                            </label>
                            <label className="space-y-1.5">
                                <span className="block text-sm font-semibold text-ink">Text colour</span>
                                <input
                                    type="color"
                                    name="textColor"
                                    value={form.textColor}
                                    onChange={handleChange}
                                    className="h-11 w-full cursor-pointer rounded-xl border border-line bg-surface p-1"
                                />
                            </label>
                        </div>

                        <Switch
                            checked={form.isActive}
                            onChange={(next) => setField("isActive", next)}
                            label="Active"
                            description="Inactive banners are hidden on the site."
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default HeroFormModal;
