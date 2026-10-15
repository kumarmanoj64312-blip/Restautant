const PADDING = {
    none: "",
    sm: "p-4",
    md: "p-5 sm:p-6",
    lg: "p-6 sm:p-8",
};

// White rounded surface used for panels, forms and tables
const Card = ({ as: Tag = "div", padding = "md", className = "", children, ...props }) => (
    <Tag
        className={`rounded-2xl border border-line bg-surface shadow-card ${PADDING[padding] ?? PADDING.md} ${className}`}
        {...props}
    >
        {children}
    </Tag>
);

export const CardHeader = ({ title, description, action, className = "" }) => (
    <div className={`mb-5 flex flex-wrap items-start justify-between gap-3 ${className}`}>
        <div>
            <h2 className="text-base font-bold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {action}
    </div>
);

export default Card;
