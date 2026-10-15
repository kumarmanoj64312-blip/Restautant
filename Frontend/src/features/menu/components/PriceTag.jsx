import { formatCurrency, getMenuPrice } from "../../../utils/format";

const SIZES = {
    md: { price: "text-lg", original: "text-sm" },
    lg: { price: "text-3xl sm:text-4xl", original: "text-lg" },
};

// Selling price, with the original struck through when discounted
const PriceTag = ({ menu, size = "md", className = "" }) => {
    const price = getMenuPrice(menu);
    const original = Number(menu?.price) || 0;
    const discounted = Number(menu?.discountPrice) > 0 && price < original;
    const styles = SIZES[size] || SIZES.md;

    return (
        <p className={`flex flex-wrap items-baseline gap-x-2 ${className}`}>
            <span className={`font-extrabold tracking-tight text-ink ${styles.price}`}>
                {formatCurrency(price)}
            </span>
            {discounted && (
                <span className={`text-muted line-through ${styles.original}`}>
                    <span className="sr-only">Was </span>
                    {formatCurrency(original)}
                </span>
            )}
        </p>
    );
};

export default PriceTag;
