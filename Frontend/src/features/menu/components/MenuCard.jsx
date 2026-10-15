import { Link } from "react-router-dom";
import { Flame, Plus, UtensilsCrossed } from "lucide-react";
import { Button, Skeleton } from "../../../components/ui";
import PriceTag from "./PriceTag";
import useAddToCart from "../useAddToCart";
import { getDiscountPercent } from "../menuUtils";

const MenuCard = ({ menu }) => {
    const { add, pendingId, canOrder } = useAddToCart();
    const available = menu.isAvailable !== false;
    const detailsPath = `/menu/${menu._id}`;
    const discount = getDiscountPercent(menu);

    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift">
            {/* Duplicate of the title link, so it stays out of the tab order */}
            <Link to={detailsPath} tabIndex={-1} className="relative block aspect-4/3 overflow-hidden bg-cream">
                {menu.image?.url ? (
                    <img
                        src={menu.image.url}
                        alt={menu.name}
                        loading="lazy"
                        className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                            available ? "" : "grayscale-60"
                        }`}
                    />
                ) : (
                    <span className="flex h-full w-full items-center justify-center text-muted/60">
                        <UtensilsCrossed size={40} aria-hidden="true" />
                        <span className="sr-only">{menu.name}</span>
                    </span>
                )}

                <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {menu.isPopular && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-bold text-brand-dark shadow-sm">
                            <Flame size={13} aria-hidden="true" /> Popular
                        </span>
                    )}
                    {discount > 0 && (
                        <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                            {discount}% off
                        </span>
                    )}
                </span>

                {!available && (
                    <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-2 text-center text-xs font-semibold text-white">
                        Currently unavailable
                    </span>
                )}
            </Link>

            <div className="flex flex-1 flex-col p-4 sm:p-5">
                {menu.category?.name && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">{menu.category.name}</p>
                )}
                <h3 className="mt-1 line-clamp-1 text-base font-bold text-ink sm:text-lg">
                    <Link to={detailsPath} className="transition hover:text-brand">
                        {menu.name}
                    </Link>
                </h3>
                {menu.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{menu.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <PriceTag menu={menu} />

                    {!available ? (
                        <span className="text-xs font-semibold text-muted">Unavailable</span>
                    ) : canOrder ? (
                        <Button
                            size="sm"
                            icon={Plus}
                            loading={pendingId === menu._id}
                            onClick={() => add(menu)}
                            aria-label={`Add ${menu.name} to cart`}
                        >
                            Add
                        </Button>
                    ) : (
                        <Button size="sm" variant="outline" to={detailsPath}>
                            View
                        </Button>
                    )}
                </div>
            </div>
        </article>
    );
};

// Placeholder card while dishes load
export const MenuCardSkeleton = () => (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card" aria-hidden="true">
        <Skeleton className="aspect-4/3 rounded-none" />
        <div className="space-y-3 p-5">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-9 w-20" />
            </div>
        </div>
    </div>
);

export default MenuCard;
