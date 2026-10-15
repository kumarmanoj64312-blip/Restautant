import { Link } from "react-router-dom";
import Spinner from "./Spinner";

const VARIANTS = {
    primary: "bg-brand text-white shadow-sm hover:bg-brand-dark",
    secondary: "bg-ink text-white hover:bg-ink/90",
    outline: "border border-line bg-surface text-ink hover:border-brand hover:text-brand",
    ghost: "text-ink hover:bg-cream",
    soft: "bg-brand-soft text-brand-dark hover:bg-brand/15",
    danger: "bg-danger text-white hover:bg-red-700",
    "danger-outline": "border border-red-200 bg-surface text-danger hover:bg-red-50",
};

const SIZES = {
    sm: "h-9 px-3 text-sm gap-1.5 rounded-lg",
    md: "h-11 px-4 text-sm gap-2 rounded-xl",
    lg: "h-12 px-6 text-base gap-2 rounded-xl",
    icon: "h-10 w-10 rounded-xl",
    "icon-sm": "h-8 w-8 rounded-lg",
};

/**
 * <Button>Save</Button>
 * <Button to="/menu" variant="outline">Browse</Button>   // renders a Link
 * <Button loading icon={Plus}>Add</Button>
 */
const Button = ({
    variant = "primary",
    size = "md",
    to,
    href,
    loading = false,
    disabled = false,
    icon: Icon,
    iconRight: IconRight,
    fullWidth = false,
    className = "",
    children,
    type = "button",
    ...props
}) => {
    const classes = [
        "inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition",
        "disabled:pointer-events-none disabled:opacity-55",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth ? "w-full" : "",
        className,
    ].join(" ");

    const iconSize = size === "sm" || size === "icon-sm" ? 15 : 18;

    const content = (
        <>
            {loading ? <Spinner size={iconSize} /> : Icon && <Icon size={iconSize} />}
            {children}
            {IconRight && !loading && <IconRight size={iconSize} />}
        </>
    );

    if (to) {
        return (
            <Link to={to} className={classes} {...props}>
                {content}
            </Link>
        );
    }

    if (href) {
        return (
            <a href={href} className={classes} {...props}>
                {content}
            </a>
        );
    }

    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={classes}
            {...props}
        >
            {content}
        </button>
    );
};

export default Button;
