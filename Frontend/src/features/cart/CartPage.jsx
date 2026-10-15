import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ImageOff, ShoppingBag, Trash2, UtensilsCrossed } from "lucide-react";
import toast from "react-hot-toast";
import { clearCart, getCart, removeCartItem, updateCartItem } from "../../api/cartApi";
import { getErrorMessage } from "../../api/client";
import {
    Alert,
    Button,
    Card,
    ConfirmDialog,
    EmptyState,
    ErrorState,
    PageHeader,
    QuantityStepper,
    Skeleton,
} from "../../components/ui";
import { formatCurrency } from "../../utils/format";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "./CartContext";
import { extractCart, getCartItems, getUnitPrice, isItemOrderable, summarizeCart } from "./cartUtils";
import OrderSummary from "./OrderSummary";
import useSettings from "../../hooks/useSettings";
import StaffNotice from "./StaffNotice";

const CartSkeleton = () => (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
            {[0, 1, 2].map((key) => (
                <Skeleton key={key} className="h-32 rounded-2xl" />
            ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
    </div>
);

const CartItemRow = ({ item, busy, onQuantity, onRemove }) => {
    const menu = item.menu;
    const orderable = isItemOrderable(item);
    const unitPrice = getUnitPrice(item);
    const hasDiscount = menu && Number(menu.discountPrice) > 0 && Number(menu.discountPrice) < Number(menu.price);

    return (
        <li className={`flex gap-4 p-4 sm:p-5 ${busy ? "opacity-60" : ""}`}>
            <Link
                to={menu?._id ? `/menu/${menu._id}` : "/menu"}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream sm:h-24 sm:w-24"
            >
                {menu?.image?.url ? (
                    <img src={menu.image.url} alt={menu.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                    <span className="flex h-full w-full items-center justify-center text-muted">
                        <ImageOff size={22} />
                    </span>
                )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate font-semibold text-ink">{menu?.name || "Unavailable dish"}</h3>
                        <p className="mt-0.5 text-sm text-muted">
                            {formatCurrency(unitPrice)}
                            {hasDiscount && (
                                <span className="ml-2 text-xs line-through">{formatCurrency(menu.price)}</span>
                            )}
                        </p>
                        {!orderable && (
                            <p className="mt-1 text-xs font-medium text-danger">
                                {menu ? "Currently unavailable. Remove it to continue." : "This dish was removed from the menu."}
                            </p>
                        )}
                    </div>

                    {menu?._id && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onRemove(item)}
                            disabled={busy}
                            aria-label={`Remove ${menu.name}`}
                            className="text-muted hover:text-danger"
                        >
                            <Trash2 size={16} />
                        </Button>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3">
                    <QuantityStepper
                        size="sm"
                        value={item.quantity}
                        onChange={(quantity) => onQuantity(item, quantity)}
                        disabled={busy || !menu?._id}
                    />
                    <p className="font-bold text-ink">{formatCurrency(unitPrice * item.quantity)}</p>
                </div>
            </div>
        </li>
    );
};

const CartPage = () => {
    const { user, isStaff } = useAuth();
    const { setCartFromResponse } = useCart();

    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(!isStaff);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState(null);
    const [confirmClear, setConfirmClear] = useState(false);
    const [clearing, setClearing] = useState(false);

    const loadCart = useCallback(async () => {
        try {
            const response = await getCart();
            const nextCart = extractCart(response);
            setCart(nextCart);
            setCartFromResponse(nextCart);
            setError("");
        } catch (err) {
            setError(getErrorMessage(err, "We couldn't load your cart."));
        } finally {
            setLoading(false);
        }
    }, [setCartFromResponse]);

    useEffect(() => {
        if (!isStaff) loadCart();
    }, [isStaff, loadCart]);

    const items = getCartItems(cart);
    const settings = useSettings();
    const summary = summarizeCart(items, settings);

    const applyResponse = (response) => {
        const nextCart = extractCart(response);
        setCart(nextCart);
        setCartFromResponse(nextCart);
    };

    const handleQuantity = async (item, quantity) => {
        if (quantity < 1 || busyId) return;
        setBusyId(item.menu._id);

        try {
            applyResponse(await updateCartItem(item.menu._id, quantity));
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't update the quantity."));
        } finally {
            setBusyId(null);
        }
    };

    const handleRemove = async (item) => {
        if (busyId) return;
        setBusyId(item.menu._id);

        try {
            applyResponse(await removeCartItem(item.menu._id));
            toast.success(`${item.menu.name} removed from cart.`);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't remove the item."));
        } finally {
            setBusyId(null);
        }
    };

    const handleClear = async () => {
        setClearing(true);

        try {
            await clearCart();
            const emptied = { ...cart, items: [] };
            setCart(emptied);
            setCartFromResponse(emptied);
            setConfirmClear(false);
            toast.success("Cart cleared.");
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't clear the cart."));
        } finally {
            setClearing(false);
        }
    };

    const retry = () => {
        setLoading(true);
        setError("");
        loadCart();
    };

    const renderBody = () => {
        if (isStaff) return <StaffNotice role={user?.role} />;
        if (loading) return <CartSkeleton />;

        if (error) {
            return (
                <Card padding="none">
                    <ErrorState message={error} onRetry={retry} />
                </Card>
            );
        }

        if (items.length === 0) {
            return (
                <Card padding="none">
                    <EmptyState
                        icon={ShoppingBag}
                        title="Your cart is empty"
                        description="Looks like you haven't added anything yet. Explore the menu and pick something delicious."
                        action={
                            <Button to="/menu" icon={UtensilsCrossed}>
                                Browse the menu
                            </Button>
                        }
                    />
                </Card>
            );
        }

        return (
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
                <Card padding="none" className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
                        <h2 className="font-bold text-ink">
                            Items <span className="font-medium text-muted">({items.length})</span>
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setConfirmClear(true)}
                            className="text-danger hover:bg-red-50"
                        >
                            Clear cart
                        </Button>
                    </div>
                    <ul className="divide-y divide-line">
                        {items.map((item, index) => (
                            <CartItemRow
                                key={item.menu?._id || `missing-${index}`}
                                item={item}
                                busy={!!item.menu?._id && busyId === item.menu._id}
                                onQuantity={handleQuantity}
                                onRemove={handleRemove}
                            />
                        ))}
                    </ul>
                </Card>

                <Card className="lg:sticky lg:top-24">
                    <h2 className="mb-5 font-display text-xl font-semibold text-ink">Order summary</h2>
                    <OrderSummary {...summary} />

                    {summary.hasUnavailable && (
                        <Alert tone="warning" className="mt-5">
                            Some items can't be ordered right now. Remove them (or clear the cart) to check out.
                        </Alert>
                    )}

                    <Button
                        to={summary.hasUnavailable || summary.orderable.length === 0 ? undefined : "/checkout"}
                        disabled={summary.hasUnavailable || summary.orderable.length === 0}
                        size="lg"
                        fullWidth
                        iconRight={ArrowRight}
                        className="mt-6"
                    >
                        Proceed to checkout
                    </Button>
                    <Button to="/menu" variant="ghost" fullWidth className="mt-2">
                        Continue shopping
                    </Button>
                </Card>
            </div>
        );
    };

    return (
        <div className="container-page py-8 sm:py-12">
            <PageHeader eyebrow="Your order" title="Shopping cart" description="Review your dishes before checkout." />

            {renderBody()}

            <ConfirmDialog
                open={confirmClear}
                onClose={() => setConfirmClear(false)}
                onConfirm={handleClear}
                loading={clearing}
                title="Clear your cart?"
                message="All items will be removed from your cart. This can't be undone."
                confirmText="Clear cart"
            />
        </div>
    );
};

export default CartPage;
