import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { getInitials } from "../../utils/format";

/**
 * Page title row used at the top of admin and account pages.
 * <PageHeader title="Menu" description="Manage dishes" actions={<Button>Add</Button>} />
 */
export const PageHeader = ({ title, description, actions, eyebrow, className = "" }) => (
    <div className={`mb-6 flex flex-wrap items-end justify-between gap-4 ${className}`}>
        <div>
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
);

/**
 * Metric tile for dashboards.
 * <StatCard label="Revenue" value="₹12,400" icon={IndianRupee} hint="This month" />
 */
export const StatCard = ({ label, value, icon: Icon, hint, tone = "brand" }) => {
    const tones = {
        brand: "bg-brand-soft text-brand",
        success: "bg-green-50 text-green-700",
        info: "bg-sky-50 text-sky-700",
        warning: "bg-amber-50 text-amber-700",
        danger: "bg-red-50 text-red-700",
    };

    return (
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted">{label}</p>
                {Icon && (
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone] || tones.brand}`}>
                        <Icon size={20} />
                    </span>
                )}
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
    );
};

// Round avatar with image or initials
export const Avatar = ({ src, name = "", size = 40, className = "" }) => (
    <span
        style={{ width: size, height: size, fontSize: size * 0.38 }}
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand font-bold text-white ${className}`}
    >
        {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : getInitials(name)}
    </span>
);

/**
 * Image picker with preview.
 * <ImageUpload value={file} existingUrl={menu.image?.url} onChange={setFile} />
 */
export const ImageUpload = ({ value, existingUrl = "", onChange, label = "Image", hint = "JPG, PNG or WEBP, up to 5 MB", error }) => {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState("");

    useEffect(() => {
        if (!value) {
            setPreview("");
            return undefined;
        }

        const url = URL.createObjectURL(value);
        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [value]);

    const shown = preview || existingUrl;

    return (
        <div className="space-y-1.5">
            {label && <p className="text-sm font-semibold text-ink">{label}</p>}

            <div
                className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-canvas ${
                    error ? "border-danger" : "border-line"
                }`}
            >
                {shown ? (
                    <>
                        <img src={shown} alt="Preview" className="h-full w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-ink/60 to-transparent p-3">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink"
                            >
                                Change
                            </button>
                            {value && (
                                <button
                                    type="button"
                                    onClick={() => onChange(null)}
                                    aria-label="Remove selected image"
                                    className="rounded-lg bg-white/95 p-1.5 text-danger"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted transition hover:text-brand"
                    >
                        <ImagePlus size={30} />
                        <span className="text-sm font-semibold">Click to upload</span>
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onChange(file);
                    event.target.value = "";
                }}
            />

            {error ? <p className="text-xs font-medium text-danger">{error}</p> : <p className="text-xs text-muted">{hint}</p>}
        </div>
    );
};

/**
 * Horizontal pill filter.
 * <Tabs value={tab} onChange={setTab} items={[{ value: "all", label: "All", count: 12 }]} />
 */
export const Tabs = ({ items, value, onChange, className = "" }) => (
    <div className={`flex gap-2 overflow-x-auto pb-1 ${className}`}>
        {items.map((item) => (
            <button
                key={item.value}
                type="button"
                onClick={() => onChange(item.value)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    value === item.value
                        ? "bg-ink text-white"
                        : "border border-line bg-surface text-ink hover:border-brand hover:text-brand"
                }`}
            >
                {item.label}
                {item.count !== undefined && (
                    <span
                        className={`rounded-full px-1.5 text-xs ${
                            value === item.value ? "bg-white/20" : "bg-cream text-muted"
                        }`}
                    >
                        {item.count}
                    </span>
                )}
            </button>
        ))}
    </div>
);

// Quantity stepper used in cart and POS
export const QuantityStepper = ({ value, onChange, min = 1, max = 99, size = "md", disabled = false }) => {
    const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";

    return (
        <div className="inline-flex items-center rounded-xl border border-line bg-surface">
            <button
                type="button"
                onClick={() => onChange(value - 1)}
                disabled={disabled || value <= min}
                aria-label="Decrease quantity"
                className={`${box} flex items-center justify-center rounded-l-xl text-lg font-bold text-ink transition hover:bg-cream disabled:opacity-40`}
            >
                −
            </button>
            <span className="min-w-8 text-center text-sm font-bold">{value}</span>
            <button
                type="button"
                onClick={() => onChange(value + 1)}
                disabled={disabled || value >= max}
                aria-label="Increase quantity"
                className={`${box} flex items-center justify-center rounded-r-xl text-lg font-bold text-ink transition hover:bg-cream disabled:opacity-40`}
            >
                +
            </button>
        </div>
    );
};
