import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Eyebrow + serif title row used by every home section
const SectionHeading = ({ id, eyebrow, title, description, linkTo, linkLabel = "View all", align = "left" }) => (
    <div
        className={`mb-8 flex flex-wrap items-end gap-4 sm:mb-10 ${
            align === "center" ? "flex-col items-center text-center" : "justify-between"
        }`}
    >
        <div className={align === "center" ? "max-w-2xl" : "max-w-xl"}>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id={id} className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h2>
            {description && <p className="mt-3 text-muted">{description}</p>}
        </div>
        {linkTo && (
            <Link
                to={linkTo}
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition hover:text-brand-dark"
            >
                {linkLabel}
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
        )}
    </div>
);

export default SectionHeading;
