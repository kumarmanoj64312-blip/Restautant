import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";

import { createMenu, getMenuById, updateMenu } from "../../../api/menuApi";
import { getCategories } from "../../../api/categoryApi";
import { getErrorMessage, unwrapList } from "../../../api/client";
import { formatCurrency } from "../../../utils/format";
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
    Select,
    Switch,
    Textarea,
} from "../../../components/ui";

const EMPTY_FORM = {
    name: "",
    category: "",
    description: "",
    price: "",
    discountPrice: "",
    isAvailable: true,
    isPopular: false,
};

const BACK_PATH = "/admin/menu";

// Client checks mirroring Backend menuService / menuValidation
const validate = (form, image, isEdit) => {
    const errors = {};
    const price = Number(form.price);
    const discount = form.discountPrice === "" ? 0 : Number(form.discountPrice);

    if (!form.name.trim()) errors.name = "Name is required.";
    else if (form.name.trim().length > 100) errors.name = "Keep the name under 100 characters.";

    if (!form.category) errors.category = "Choose a category.";
    if (!form.description.trim()) errors.description = "Description is required.";

    if (form.price === "" || !Number.isFinite(price) || price <= 0) {
        errors.price = "Enter a price greater than 0.";
    }

    if (form.discountPrice !== "") {
        if (!Number.isFinite(discount) || discount < 0) {
            errors.discountPrice = "Discount price cannot be negative.";
        } else if (discount > 0 && Number.isFinite(price) && discount >= price) {
            errors.discountPrice = "Discount price must be lower than the price.";
        }
    }

    if (!isEdit && !image) errors.image = "An image is required for new items.";

    return errors;
};

const MenuFormPage = () => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState(EMPTY_FORM);
    const [image, setImage] = useState(null);
    const [existingImage, setExistingImage] = useState("");
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [categoryRes, menuRes] = await Promise.all([
                getCategories({ limit: 100, sort: "sortOrder", order: "asc" }),
                id ? getMenuById(id) : Promise.resolve(null),
            ]);

            setCategories(unwrapList(categoryRes));

            const menu = menuRes?.data;
            if (menu) {
                setForm({
                    name: menu.name || "",
                    category: menu.category?._id || menu.category || "",
                    description: menu.description || "",
                    price: menu.price ?? "",
                    discountPrice: Number(menu.discountPrice) > 0 ? menu.discountPrice : "",
                    isAvailable: menu.isAvailable ?? true,
                    isPopular: !!menu.isPopular,
                });
                setExistingImage(menu.image?.url || "");
            }

            setLoadError("");
        } catch (err) {
            setLoadError(getErrorMessage(err, isEdit ? "Could not load this menu item." : "Could not load categories."));
        } finally {
            setLoading(false);
        }
    }, [id, isEdit]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const retry = () => {
        setLoading(true);
        setLoadError("");
        loadData();
    };

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

        if (Object.keys(nextErrors).length > 0) {
            toast.error("Please fix the highlighted fields.");
            return;
        }

        // Field names match req.body in menuService; booleans go as "true"/"false"
        const payload = new FormData();
        payload.append("name", form.name.trim());
        payload.append("category", form.category);
        payload.append("description", form.description.trim());
        payload.append("price", String(Number(form.price)));
        payload.append("discountPrice", form.discountPrice === "" ? "0" : String(Number(form.discountPrice)));
        payload.append("isAvailable", String(form.isAvailable));
        payload.append("isPopular", String(form.isPopular));
        if (image) payload.append("image", image);

        setSaving(true);
        try {
            if (isEdit) {
                await updateMenu(id, payload);
                toast.success("Menu item updated.");
            } else {
                await createMenu(payload);
                toast.success("Menu item created.");
            }
            navigate(BACK_PATH);
        } catch (err) {
            const message = getErrorMessage(err, "Could not save the menu item.");
            setSubmitError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const title = isEdit ? "Edit menu item" : "Add menu item";
    const header = (
        <PageHeader
            eyebrow="Catalogue"
            title={title}
            description={isEdit ? "Update the dish details, price or photo." : "Create a new dish for your menu."}
            actions={
                <Button variant="outline" icon={ArrowLeft} to={BACK_PATH}>
                    Back to menu
                </Button>
            }
        />
    );

    if (loading) {
        return (
            <div>
                {header}
                <PageLoader text={isEdit ? "Loading menu item..." : "Loading..."} />
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

    const price = Number(form.price) || 0;
    const discount = Number(form.discountPrice) || 0;
    const showSaving = discount > 0 && discount < price;

    return (
        <div>
            {header}

            <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                {/* Left: details */}
                <Card className="space-y-5">
                    <CardHeader title="Dish details" description="What customers see on the menu." className="mb-0" />

                    <Alert>{submitError}</Alert>

                    <Input
                        label="Name"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        error={errors.name}
                        placeholder="e.g. Paneer Butter Masala"
                        maxLength={100}
                    />

                    <Select
                        label="Category"
                        name="category"
                        required
                        value={form.category}
                        onChange={handleChange}
                        error={errors.category}
                        placeholder="Choose a category"
                        hint={categories.length === 0 ? "No categories yet. Create one under Categories first." : undefined}
                        options={categories.map((category) => ({
                            value: category._id,
                            label: category.isActive === false ? `${category.name} (inactive)` : category.name,
                        }))}
                    />

                    <Textarea
                        label="Description"
                        name="description"
                        required
                        rows={5}
                        value={form.description}
                        onChange={handleChange}
                        error={errors.description}
                        placeholder="Ingredients, taste, portion size..."
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Input
                            label="Price (₹)"
                            name="price"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            required
                            value={form.price}
                            onChange={handleChange}
                            error={errors.price}
                            placeholder="0.00"
                        />
                        <Input
                            label="Discount price (₹)"
                            name="discountPrice"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={form.discountPrice}
                            onChange={handleChange}
                            error={errors.discountPrice}
                            hint="Optional. Leave empty for no discount."
                            placeholder="0.00"
                        />
                    </div>

                    {showSaving && (
                        <p className="rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand-dark">
                            Customers pay <strong>{formatCurrency(discount)}</strong> instead of{" "}
                            <span className="line-through">{formatCurrency(price)}</span> (save{" "}
                            {Math.round(((price - discount) / price) * 100)}%).
                        </p>
                    )}
                </Card>

                {/* Right: image, toggles, actions */}
                <div className="space-y-6">
                    <Card>
                        <ImageUpload
                            label={isEdit ? "Photo" : "Photo *"}
                            value={image}
                            existingUrl={existingImage}
                            onChange={(file) => {
                                setImage(file);
                                setErrors((current) => ({ ...current, image: undefined }));
                            }}
                            error={errors.image}
                            hint={isEdit ? "Upload a new photo to replace the current one." : undefined}
                        />
                    </Card>

                    <Card className="space-y-4">
                        <CardHeader title="Visibility" className="mb-1" />
                        <Switch
                            checked={form.isAvailable}
                            onChange={(next) => setField("isAvailable", next)}
                            label="Available to order"
                            description="Turn off when the dish is sold out."
                        />
                        <Switch
                            checked={form.isPopular}
                            onChange={(next) => setField("isPopular", next)}
                            label="Popular dish"
                            description="Featured on the home page."
                        />
                    </Card>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row lg:flex-col-reverse">
                        <Button variant="outline" to={BACK_PATH} fullWidth>
                            Cancel
                        </Button>
                        <Button type="submit" icon={Save} loading={saving} fullWidth>
                            {isEdit ? "Save changes" : "Create item"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default MenuFormPage;
