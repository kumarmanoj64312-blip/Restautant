import { Loader2 } from "lucide-react";

export const Spinner = ({ size = 18, className = "" }) => (
    <Loader2 size={size} className={`animate-spin ${className}`} aria-hidden="true" />
);

// Centered loader for a page or a section
export const PageLoader = ({ text = "Loading...", fullScreen = false }) => (
    <div
        role="status"
        className={`flex flex-col items-center justify-center gap-3 text-muted ${
            fullScreen ? "min-h-screen" : "min-h-[280px]"
        }`}
    >
        <Spinner size={30} className="text-brand" />
        <p className="text-sm font-medium">{text}</p>
    </div>
);

export default Spinner;
