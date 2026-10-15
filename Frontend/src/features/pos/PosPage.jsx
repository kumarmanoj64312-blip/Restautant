import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BellRing, Search, ShoppingBag, Trash2 } from "lucide-react";
import { getMenus } from "../../api/menuApi";
import { createPosOrder, getAllOrders, updateOrderStatus } from "../../api/orderApi";
import { getErrorMessage, unwrapList } from "../../api/client";
import { Alert, Button, EmptyState, ErrorState, Input, QuantityStepper, Skeleton, Tabs } from "../../components/ui";
import { formatCurrency, formatOrderId, getMenuPrice } from "../../utils/format";
import useSettings, { calculateCharges } from "../../hooks/useSettings";

const ORDER_TYPES = ["Dine In", "Takeaway"];
const PAYMENT_METHODS = ["Cash", "UPI", "Card"];
const READY_REFRESH_INTERVAL = 20000;

const INITIAL_DETAILS = {
    orderType: "Dine In",
    tableNumber: "",
    customerName: "",
    customerPhone: "",
    paymentMethod: "Cash",
    isPaid: true,
    notes: "",
};

const isDelivery = (order) => !order.orderType || order.orderType === "Delivery";

const PosPage = () => {
    const [menus, setMenus] = useState([]);
    const [menuLoading, setMenuLoading] = useState(true);
    const [menuError, setMenuError] = useState("");
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    const [cart, setCart] = useState([]);
    const [details, setDetails] = useState(INITIAL_DETAILS);
    const [placing, setPlacing] = useState(false);
    const [formError, setFormError] = useState("");

    const [readyOrders, setReadyOrders] = useState([]);
    const settings = useSettings();
    const [servingId, setServingId] = useState(null);

    // ---------- Menu ----------
    const loadMenus = useCallback(async () => {
        try {
            const response = await getMenus();
            setMenus(unwrapList(response));
            setMenuError("");
        } catch (err) {
            setMenuError(getErrorMessage(err, "Failed to load menu."));
        } finally {
            setMenuLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMenus();
    }, [loadMenus]);

    // ---------- Ready orders to hand over ----------
    const loadReadyOrders = useCallback(async () => {
        try {
            const response = await getAllOrders({ orderStatus: "Ready", sort: "updatedAt", order: "asc", limit: 50 });
            setReadyOrders(unwrapList(response));
        } catch {
            // Non-critical: keep the last known list
        }
    }, []);

    useEffect(() => {
        loadReadyOrders();
        const timer = setInterval(loadReadyOrders, READY_REFRESH_INTERVAL);
        return () => clearInterval(timer);
    }, [loadReadyOrders]);

    // ---------- Filtering ----------
    const availableMenus = useMemo(() => menus.filter((menu) => menu.isAvailable), [menus]);

    const categoryTabs = useMemo(() => {
        const map = new Map();

        availableMenus.forEach((menu) => {
            if (!menu.category?._id) return;
            const entry = map.get(menu.category._id) || { value: menu.category._id, label: menu.category.name, count: 0 };
            entry.count += 1;
            map.set(menu.category._id, entry);
        });

        return [{ value: "all", label: "All", count: availableMenus.length }, ...map.values()];
    }, [availableMenus]);

    const visibleMenus = useMemo(() => {
        const term = search.trim().toLowerCase();

        return availableMenus.filter(
            (menu) =>
                (activeCategory === "all" || menu.category?._id === activeCategory) &&
                (!term || menu.name.toLowerCase().includes(term))
        );
    }, [availableMenus, search, activeCategory]);

    // ---------- Cart ----------
    const addToCart = (menu) => {
        setFormError("");
        setCart((prev) => {
            const existing = prev.find((item) => item.menu === menu._id);

            if (existing) {
                return prev.map((item) => (item.menu === menu._id ? { ...item, quantity: item.quantity + 1 } : item));
            }

            return [...prev, { menu: menu._id, name: menu.name, price: getMenuPrice(menu), quantity: 1 }];
        });
    };

    const setQuantity = (menuId, quantity) => {
        setCart((prev) =>
            prev
                .map((item) => (item.menu === menuId ? { ...item, quantity } : item))
                .filter((item) => item.quantity > 0)
        );
    };

    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    // Counter orders: tax applies, no delivery charge (same as backend)
    const charges = calculateCharges(subtotal, settings, { includeDelivery: false });

    const setDetail = (name, value) => {
        setDetails((prev) => ({ ...prev, [name]: value }));
        setFormError("");
    };

    const clearOrder = () => {
        setCart([]);
        setDetails(INITIAL_DETAILS);
        setFormError("");
    };

    // ---------- Place order ----------
    const handlePlaceOrder = async () => {
        if (placing) return;

        if (cart.length === 0) {
            setFormError("Add at least one item.");
            return;
        }

        if (details.orderType === "Dine In" && !details.tableNumber.trim()) {
            setFormError("Enter a table number for dine-in orders.");
            return;
        }

        if (details.customerPhone && !/^[6-9]\d{9}$/.test(details.customerPhone)) {
            setFormError("Enter a valid 10-digit phone number, or leave it empty.");
            return;
        }

        try {
            setPlacing(true);

            const response = await createPosOrder({
                items: cart.map(({ menu, quantity }) => ({ menu, quantity })),
                orderType: details.orderType,
                tableNumber: details.tableNumber.trim(),
                customerName: details.customerName.trim(),
                customerPhone: details.customerPhone.trim(),
                paymentMethod: details.paymentMethod,
                isPaid: details.isPaid,
                notes: details.notes.trim(),
            });

            const order = response?.data;
            toast.success(`Order ${formatOrderId(order?._id)} sent to kitchen · ${formatCurrency(order?.totalAmount)}`);
            clearOrder();
        } catch (err) {
            setFormError(getErrorMessage(err, "Failed to place order."));
        } finally {
            setPlacing(false);
        }
    };

    // ---------- Hand over a ready order ----------
    const handleServe = async (order) => {
        if (servingId) return;

        try {
            setServingId(order._id);
            await updateOrderStatus(order._id, isDelivery(order) ? "Out for Delivery" : "Delivered");
            setReadyOrders((prev) => prev.filter((item) => item._id !== order._id));
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to update order."));
        } finally {
            setServingId(null);
        }
    };

    return (
        <div className="flex flex-1 flex-col lg:h-[calc(100vh-4rem)]">
            {/* Ready orders strip */}
            {readyOrders.length > 0 && (
                <div className="flex items-center gap-3 overflow-x-auto border-b border-green-200 bg-green-50 px-4 py-2.5 sm:px-6">
                    <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-green-800">
                        <BellRing size={16} />
                        Ready ({readyOrders.length})
                    </span>

                    {readyOrders.map((order) => (
                        <div
                            key={order._id}
                            className="flex shrink-0 items-center gap-2 rounded-xl border border-green-200 bg-surface py-1 pl-3 pr-1 text-sm"
                        >
                            <span className="font-bold">{formatOrderId(order._id)}</span>
                            <span className="text-muted">
                                {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType || "Delivery"}
                            </span>
                            <Button size="sm" className="!h-7 !bg-green-600 hover:!bg-green-700" loading={servingId === order._id} onClick={() => handleServe(order)}>
                                {isDelivery(order) ? "Dispatch" : "Served"}
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
                {/* ---------- Menu ---------- */}
                <section className="flex-1 p-4 sm:p-6 lg:overflow-y-auto">
                    <Input
                        icon={Search}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search dishes..."
                        aria-label="Search dishes"
                        className="mb-4"
                    />

                    <Tabs items={categoryTabs} value={activeCategory} onChange={setActiveCategory} className="mb-5" />

                    {menuLoading ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                            {[...Array(8)].map((_, index) => (
                                <Skeleton key={index} className="h-44" />
                            ))}
                        </div>
                    ) : menuError ? (
                        <ErrorState message={menuError} onRetry={loadMenus} />
                    ) : visibleMenus.length === 0 ? (
                        <EmptyState title="No dishes found" description="Try another search or category." />
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                            {visibleMenus.map((menu) => {
                                const inCart = cart.find((item) => item.menu === menu._id);

                                return (
                                    <button
                                        key={menu._id}
                                        type="button"
                                        onClick={() => addToCart(menu)}
                                        className={`group relative overflow-hidden rounded-2xl border bg-surface text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lift ${
                                            inCart ? "border-brand ring-2 ring-brand/20" : "border-line"
                                        }`}
                                    >
                                        <div className="h-28 overflow-hidden bg-brand-soft">
                                            {menu.image?.url && (
                                                <img
                                                    src={menu.image.url}
                                                    alt=""
                                                    loading="lazy"
                                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                                />
                                            )}
                                        </div>

                                        {inCart && (
                                            <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-brand px-2 text-sm font-bold text-white shadow">
                                                {inCart.quantity}
                                            </span>
                                        )}

                                        <div className="p-3">
                                            <p className="line-clamp-1 text-sm font-bold">{menu.name}</p>
                                            <p className="mt-0.5 text-sm font-extrabold text-brand">
                                                {formatCurrency(getMenuPrice(menu))}
                                                {menu.discountPrice > 0 && (
                                                    <span className="ml-1.5 text-xs font-medium text-muted line-through">
                                                        {formatCurrency(menu.price)}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ---------- Bill ---------- */}
                <aside className="flex w-full flex-col border-t border-line bg-surface lg:w-[420px] lg:border-l lg:border-t-0">
                    <div className="space-y-3 border-b border-line p-4">
                        <div className="grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1">
                            {ORDER_TYPES.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setDetail("orderType", type)}
                                    className={`rounded-lg py-2 text-sm font-bold transition ${
                                        details.orderType === type ? "bg-surface text-brand shadow-sm" : "text-muted"
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {details.orderType === "Dine In" && (
                                <Input
                                    value={details.tableNumber}
                                    onChange={(event) => setDetail("tableNumber", event.target.value)}
                                    placeholder="Table no. *"
                                    aria-label="Table number"
                                    className="col-span-2"
                                />
                            )}
                            <Input
                                value={details.customerName}
                                onChange={(event) => setDetail("customerName", event.target.value)}
                                placeholder="Customer name"
                                aria-label="Customer name"
                            />
                            <Input
                                value={details.customerPhone}
                                onChange={(event) => setDetail("customerPhone", event.target.value.replace(/\D/g, ""))}
                                placeholder="Phone"
                                aria-label="Customer phone"
                                inputMode="numeric"
                                maxLength={10}
                            />
                        </div>
                    </div>

                    {/* Items */}
                    <div className="flex-1 p-4 lg:overflow-y-auto">
                        {cart.length === 0 ? (
                            <EmptyState icon={ShoppingBag} title="No items yet" description="Tap a dish to add it to the bill." className="!py-10" />
                        ) : (
                            <ul className="divide-y divide-line">
                                {cart.map((item) => (
                                    <li key={item.menu} className="flex items-center gap-3 py-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold">{item.name}</p>
                                            <p className="text-xs text-muted">{formatCurrency(item.price)} each</p>
                                        </div>
                                        <QuantityStepper
                                            size="sm"
                                            min={0}
                                            value={item.quantity}
                                            onChange={(quantity) => setQuantity(item.menu, quantity)}
                                        />
                                        <p className="w-16 text-right text-sm font-bold">{formatCurrency(item.price * item.quantity)}</p>
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(item.menu, 0)}
                                            aria-label={`Remove ${item.name}`}
                                            className="text-muted transition hover:text-danger"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Payment + total */}
                    <div className="space-y-3 border-t border-line p-4">
                        <textarea
                            value={details.notes}
                            onChange={(event) => setDetail("notes", event.target.value)}
                            rows={2}
                            placeholder="Kitchen notes (e.g. less spicy)"
                            aria-label="Kitchen notes"
                            className="w-full resize-none rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                        />

                        <div className="grid grid-cols-3 gap-2">
                            {PAYMENT_METHODS.map((method) => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setDetail("paymentMethod", method)}
                                    className={`rounded-xl border py-2 text-sm font-bold transition ${
                                        details.paymentMethod === method
                                            ? "border-brand bg-brand-soft text-brand-dark"
                                            : "border-line hover:border-brand/50"
                                    }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>

                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={details.isPaid}
                                onChange={(event) => setDetail("isPaid", event.target.checked)}
                                className="h-4 w-4 accent-brand"
                            />
                            Payment received
                        </label>

                        <div className="rounded-xl bg-canvas px-4 py-3">
                            {charges.tax > 0 && (
                                <div className="mb-1 space-y-0.5 text-sm text-muted">
                                    <p className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span>Tax ({charges.taxRate}%)</span>
                                        <span>{formatCurrency(charges.tax)}</span>
                                    </p>
                                </div>
                            )}
                            <p className="flex items-end justify-between">
                                <span className="text-sm text-muted">
                                    Total · {itemCount} {itemCount === 1 ? "item" : "items"}
                                </span>
                                <span className="text-2xl font-extrabold">{formatCurrency(charges.total)}</span>
                            </p>
                        </div>

                        <Alert>{formError}</Alert>

                        <div className="grid grid-cols-3 gap-2">
                            <Button variant="outline" size="lg" onClick={clearOrder} disabled={placing || cart.length === 0}>
                                Clear
                            </Button>
                            <Button size="lg" className="col-span-2" loading={placing} disabled={cart.length === 0} onClick={handlePlaceOrder}>
                                Place order
                            </Button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default PosPage;
