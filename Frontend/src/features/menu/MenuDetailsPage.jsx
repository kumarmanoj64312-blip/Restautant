import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChefHat, Clock, Flame, ShoppingBag, UtensilsCrossed, Zap } from "lucide-react";
import { getMenuById, getMenus } from "../../api/menuApi";
import { getErrorMessage, unwrapList } from "../../api/client";
import { Badge, Button, EmptyState, ErrorState, QuantityStepper, Skeleton } from "../../components/ui";
import { formatCurrency, getMenuPrice } from "../../utils/format";
import MenuCard from "./components/MenuCard";
import PriceTag from "./components/PriceTag";
import useAddToCart from "./useAddToCart";
import { getCategoryId, getDiscountPercent } from "./menuUtils";

const DetailsSkeleton = () => (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-14" role="status">
        <span className="sr-only">Loading dish…</span>
        <Skeleton className="aspect-4/3 rounded-3xl" />
        <div className="space-y-4 py-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-60" />
        </div>
    </div>
);

const MenuDetailsPage = () => {
    const { id } = useParams();
    const { add, pendingId, canOrder } = useAddToCart();

    const [menu, setMenu] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [buying, setBuying] = useState(false);
    // Latest requested id, so slow responses for a previous dish are ignored
    const latestId = useRef(id);

    const load = useCallback(async () => {
        latestId.current = id;
        setLoading(true);
        setError("");
        setNotFound(false);
        setRelated([]);
        setQuantity(1);

        try {
            const response = await getMenuById(id);
            const item = response?.data;
            if (latestId.current !== id) return;

            if (!item?._id) {
                setNotFound(true);
                return;
            }

            setMenu(item);

            // "More like this" is a nice-to-have; ignore failures
            const categoryId = getCategoryId(item);
            getMenus()
                .then((res) => {
                    if (latestId.current !== id) return;
                    setRelated(
                        unwrapList(res)
                            .filter((dish) => dish._id !== item._id && getCategoryId(dish) === categoryId)
                            .filter((dish) => dish.isAvailable !== false)
                            .slice(0, 4)
                    );
                })
                .catch(() => {});
        } catch (err) {
            if (latestId.current !== id) return;
            const status = err?.response?.status;

            if (status === 404 || status === 400) setNotFound(true);
            else setError(getErrorMessage(err, "We couldn't load this dish."));
        } finally {
            if (latestId.current === id) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const handleAdd = () => add(menu, quantity);

    const handleOrderNow = async () => {
        setBuying(true);
        await add(menu, quantity, { redirectTo: "/cart" });
        setBuying(false);
    };

    if (loading) {
        return (
            <div className="container-page py-10 sm:py-14">
                <DetailsSkeleton />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="container-page py-16">
                <EmptyState
                    icon={UtensilsCrossed}
                    title="Dish not found"
                    description="This dish may have been removed from the menu."
                    action={<Button to="/menu">Browse the menu</Button>}
                />
            </div>
        );
    }

    if (error || !menu) {
        return (
            <div className="container-page py-16">
                <ErrorState message={error} onRetry={load} />
            </div>
        );
    }

    const available = menu.isAvailable !== false;
    const discount = getDiscountPercent(menu);
    const busy = pendingId === menu._id;

    return (
        <>
            <section className="container-page py-8 sm:py-12">
                <Link
                    to="/menu"
                    className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-brand"
                >
                    <ArrowLeft size={16} /> Back to menu
                </Link>

                <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
                    <div className="relative animate-fade-in overflow-hidden rounded-3xl bg-cream shadow-card">
                        {menu.image?.url ? (
                            <img
                                src={menu.image.url}
                                alt={menu.name}
                                className={`aspect-4/3 w-full object-cover ${available ? "" : "grayscale-60"}`}
                            />
                        ) : (
                            <div className="flex aspect-4/3 items-center justify-center text-muted/50">
                                <UtensilsCrossed size={64} aria-hidden="true" />
                            </div>
                        )}
                        {discount > 0 && (
                            <span className="absolute left-4 top-4 rounded-full bg-brand px-3 py-1.5 text-sm font-bold text-white shadow">
                                {discount}% off
                            </span>
                        )}
                    </div>

                    <div className="animate-fade-up">
                        <div className="flex flex-wrap items-center gap-2">
                            {menu.category?.name && (
                                <Link to={`/menu?category=${menu.category._id}`}>
                                    <Badge tone="brand">{menu.category.name}</Badge>
                                </Link>
                            )}
                            {menu.isPopular && (
                                <Badge tone="warning">
                                    <Flame size={12} aria-hidden="true" /> Popular
                                </Badge>
                            )}
                            <Badge tone={available ? "success" : "neutral"} dot>
                                {available ? "Available" : "Currently unavailable"}
                            </Badge>
                        </div>

                        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">
                            {menu.name}
                        </h1>

                        <PriceTag menu={menu} size="lg" className="mt-4" />
                        {discount > 0 && (
                            <p className="mt-1 text-sm font-semibold text-success">
                                You save {formatCurrency(Number(menu.price) - getMenuPrice(menu))}
                            </p>
                        )}

                        {menu.description && (
                            <p className="mt-6 max-w-prose leading-relaxed text-muted">{menu.description}</p>
                        )}

                        <div className="mt-8 rounded-2xl border border-line bg-surface p-5 shadow-card">
                            {!available ? (
                                <p className="text-sm text-muted">
                                    This dish is currently unavailable. Please check back later or explore other dishes.
                                </p>
                            ) : !canOrder ? (
                                <p className="text-sm text-muted">
                                    You&apos;re signed in with a staff account. Online ordering is for customers only.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    <div className="flex items-center justify-between gap-4 sm:justify-start">
                                        <span className="text-sm font-semibold text-ink" id="qty-label">
                                            Quantity
                                        </span>
                                        <div role="group" aria-labelledby="qty-label">
                                            <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={20} />
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-wrap gap-2 sm:justify-end">
                                        <Button
                                            size="lg"
                                            icon={ShoppingBag}
                                            onClick={handleAdd}
                                            loading={busy && !buying}
                                            disabled={busy}
                                            className="flex-1 sm:flex-none"
                                        >
                                            Add · {formatCurrency(getMenuPrice(menu) * quantity)}
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="secondary"
                                            icon={Zap}
                                            onClick={handleOrderNow}
                                            loading={buying}
                                            disabled={busy}
                                            className="flex-1 sm:flex-none"
                                        >
                                            Order now
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                            <li className="flex items-center gap-3 rounded-2xl bg-cream/70 p-4">
                                <ChefHat size={20} className="shrink-0 text-brand" aria-hidden="true" />
                                <span className="text-muted">Cooked fresh when you order</span>
                            </li>
                            <li className="flex items-center gap-3 rounded-2xl bg-cream/70 p-4">
                                <Clock size={20} className="shrink-0 text-brand" aria-hidden="true" />
                                <span className="text-muted">Ready in about 25–35 minutes</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {related.length > 0 && (
                <section className="container-page pb-16">
                    <div className="mb-6 flex items-end justify-between gap-4">
                        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">More like this</h2>
                        {menu.category?._id && (
                            <Link
                                to={`/menu?category=${menu.category._id}`}
                                className="text-sm font-semibold text-brand hover:text-brand-dark"
                            >
                                See all
                            </Link>
                        )}
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {related.map((dish) => (
                            <MenuCard key={dish._id} menu={dish} />
                        ))}
                    </div>
                </section>
            )}
        </>
    );
};

export default MenuDetailsPage;
