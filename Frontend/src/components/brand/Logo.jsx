import { Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import { SITE } from "../../config/site";

// tone="dark" for light backgrounds, tone="light" for dark backgrounds
const Logo = ({ to = "/", tone = "dark", compact = false, className = "" }) => (
    <Link to={to} className={`inline-flex items-center gap-2.5 ${className}`} aria-label={`${SITE.name} home`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-sm shadow-brand/30">
            <UtensilsCrossed size={20} />
        </span>
        {!compact && (
            <span className="leading-none">
                <span className={`block font-display text-xl font-semibold ${tone === "light" ? "text-white" : "text-ink"}`}>
                    {SITE.name}
                </span>
                <span className={`mt-0.5 block text-[10px] font-bold uppercase tracking-[0.2em] ${tone === "light" ? "text-orange-300" : "text-brand"}`}>
                    Kitchen & Bar
                </span>
            </span>
        )}
    </Link>
);

export default Logo;
