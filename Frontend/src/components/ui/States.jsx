import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import Button from "./Button";

/**
 * <EmptyState icon={ShoppingBag} title="Your cart is empty" description="..." action={<Button to="/menu">Browse menu</Button>} />
 */
export const EmptyState = ({ icon: Icon = Inbox, title, description, action, className = "" }) => (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon size={26} />
        </span>
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
    </div>
);

// <ErrorState message={error} onRetry={load} />
export const ErrorState = ({ title = "Something went wrong", message, onRetry, className = "" }) => (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-danger">
            <AlertTriangle size={26} />
        </span>
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
        {onRetry && (
            <Button variant="outline" icon={RefreshCw} onClick={onRetry} className="mt-5">
                Try again
            </Button>
        )}
    </div>
);

// Inline alert box for form errors / notices
export const Alert = ({ tone = "danger", children, className = "" }) => {
    const tones = {
        danger: "border-red-200 bg-red-50 text-red-700",
        success: "border-green-200 bg-green-50 text-green-700",
        warning: "border-amber-200 bg-amber-50 text-amber-800",
        info: "border-sky-200 bg-sky-50 text-sky-700",
    };

    if (!children) return null;

    return (
        <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${tones[tone] || tones.danger} ${className}`}>
            {children}
        </div>
    );
};

// Grey placeholder block while content loads
export const Skeleton = ({ className = "" }) => (
    <div className={`animate-pulse rounded-xl bg-cream ${className}`} />
);
