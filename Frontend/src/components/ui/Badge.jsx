import { STATUS_TONE } from "../../utils/constants";

const TONES = {
    neutral: "bg-stone-100 text-stone-700 ring-stone-200",
    brand: "bg-brand-soft text-brand-dark ring-orange-200",
    success: "bg-green-50 text-green-700 ring-green-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    danger: "bg-red-50 text-red-700 ring-red-200",
    info: "bg-sky-50 text-sky-700 ring-sky-200",
};

const Badge = ({ tone = "neutral", dot = false, className = "", children }) => (
    <span
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
            TONES[tone] || TONES.neutral
        } ${className}`}
    >
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
        {children}
    </span>
);

// Picks the colour from the status name: <StatusBadge status="Delivered" />
export const StatusBadge = ({ status, className = "" }) => (
    <Badge tone={STATUS_TONE[status] || "neutral"} dot className={className}>
        {status || "Unknown"}
    </Badge>
);

// Green "Veg" / red "Non Veg" marker, Indian menu style
export const VegMark = ({ isVeg = true, className = "" }) => (
    <span
        title={isVeg ? "Veg" : "Non veg"}
        className={`inline-flex h-4 w-4 items-center justify-center rounded-[3px] border-[1.5px] ${
            isVeg ? "border-green-600" : "border-red-600"
        } ${className}`}
    >
        <span className={`h-2 w-2 rounded-full ${isVeg ? "bg-green-600" : "bg-red-600"}`} />
    </span>
);

export default Badge;
