import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";

import { createCategory, getCategoryById, updateCategory } from "../../../api/categoryApi";
import { getErrorMessage } from "../../../api/client";
import {
    Alert,
    Button,
    Card,
    CardHeader,
    ErrorState,
    ImageUpload,
    Input,
    PageHeader,
    PageLoader,
    Switch,
    Textarea,
} from "../../../components/ui";

const EMPTY_FORM = {
    name: "",
    description: "",
    sortOrder: "0",
    isActive: true,
};

const BACK_PATH = "/admin/categories";
const DESCRIPTION_LIMIT = 500;

// Same rules as Backend categoryValidation
const validate = (form) => {
    const errors = {};
    const name = form.name.trim();

    if (!name) errors.name = "Name is required.";
    else if (name.length < 3) errors.name = "Name must be at least 3 characters.";
    else if (name.length > 50) errors.name = "Name cannot exceed 50 characters.";

    if (form.description.length > DESCRIPTION_LIMIT) {
        errors.description = `Description cannot exceed ${DESCRIPTION_LIMIT} characters.`;
    }

    if (form.sortOrder !== "" && !Number.isInteger(Number(form.sortOrder))) {
        errors.sortOrder = "Sort order must be a whole number.";
    }

    return errors;
};

const CategoryFormPage = () => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState(EMPTY_FORM);
    const [image, setImage] = useState(null);
    const [existingImage, setExistingImage] = useState("");

    const [loading, setLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState("");
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [saving, setSaving] = useState(false);

    const loadCategory = useCallback(async () => {
        if (!id) return;

        try {
            const res = await getCategoryById(id);
            const category = res?.data || {};

            setForm({
                name: category.name || "",
                description: category.description || "",
                sortOrder: String(category.sortOrder ?? 0),
                isActive: category.isActive ?? true,
            });
            setExistingImage(category.image?.url || "");
            setLoadError("");
        } catch (err) {
            setLoadError(getErrorMessage(err, "Could not load this category."));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadCategory();
    }, [loadCategory]);

    const retry = () => {
        setLoading(true);
        setLoadError("");
        loadCategory();
    };

    const setField = (name, value) => {
        setForm((current) => ({ ...current, [name]: value }));
        setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
    };

    const handleChange = (event) => setField(event.target.name, event.target.value);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitError("");

        const nextErrors = validate(form);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            toast.error("Please fix the highlighted fields.");
            return;
        }

        // Backend parses isActive as "true"/"false" and sortOrder with Number()
        const payload = new FormData();
        payload.append("name", form.name.trim());
        payload.append("description", form.description.trim());
        payload.append("sortOrder", String(Number(form.sortOrder) || 0));
        payload.append("isActive", String(form.isActive));
        if (image) payload.append("image", image);

        setSaving(true);
        try {
            if (isEdit) {
                await updateCategory(id, payload);
                toast.success("Category updated.");
            } else {
                await createCategory(payload);
                toast.success("Category created.");
            }
            navigate(BACK_PATH);
        } catch (err) {
            const message = getErrorMessage(err, "Could not save the category.");
            setSubmitError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const header = (
        <PageHeader
            eyebrow="Catalogue"
            title={isEdit ? "Edit category" : "Add category"}
            description={isEdit ? "Update the name, image or visibility." : "Create a new section for your menu."}
            actions={
                <Button variant="outline" icon={ArrowLeft} to={BACK_PATH}>
                    Back to categories
                </Button>
            }
        />
    );

    if (loading) {
        return (
            <div>
                {header}
                <PageLoader text="Loading category..." />
            </div>
        );
    }

    if (loadError) {
        return (
            <div>
                {header}
                <Card>
                    <ErrorState message={loadError} onRetry={retry} />
                </Card>
            </div>
        );
    }

    return (
        <div>
            {header}

            <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <Card className="space-y-5">
                    <CardHeader title="Category details" className="mb-0" />

                    <Alert>{submitError}</Alert>

                    <Input
                        label="Name"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        error={errors.name}
                        placeholder="e.g. Starters"
                        maxLength={50}
                        hint="3 to 50 characters. Must be unique."
                    />

                    <Textarea
                        label="Description"
                        name="description"
                        rows={4}
                        value={form.description}
                        onChange={handleChange}
                        error={errors.description}
                        maxLength={DESCRIPTION_LIMIT}
                        hint={`${form.description.length}/${DESCRIPTION_LIMIT} characters`}
                        placeholder="A short line shown under the category name"
                    />

                    <Input
                        label="Sort order"
                        name="sortOrder"
                        type="number"
                        inputMode="numeric"
                        step="1"
                        value={form.sortOrder}
                        onChange={handleChange}
                        error={errors.sortOrder}
                        hint="Lower numbers appear first."
                        className="sm:max-w-xs"
                    />
                </Card>

                <div className="space-y-6">
                    <Card>
                        <ImageUpload
                            label="Image"
                            value={image}
                            existingUrl={existingImage}
                            onChange={setImage}
                            hint={isEdit && existingImage ? "Upload a new image to replace the current one." : "Optional. JPG, PNG or WEBP, up to 5 MB"}
                        />
                    </Card>

                    <Card>
                        <Switch
                            checked={form.isActive}
                            onChange={(next) => setField("isActive", next)}
                            label="Active"
                            description="Inactive categories are hidden from customers."
                        />
                    </Card>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row lg:flex-col-reverse">
                        <Button variant="outline" to={BACK_PATH} fullWidth>
                            Cancel
                        </Button>
                        <Button type="submit" icon={Save} loading={saving} fullWidth>
                            {isEdit ? "Save changes" : "Create category"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CategoryFormPage;
