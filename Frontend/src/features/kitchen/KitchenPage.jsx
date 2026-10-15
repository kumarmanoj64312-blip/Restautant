import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Clock, RefreshCw, StickyNote, UtensilsCrossed } from "lucide-react";
import { getKitchenOrders, updateOrderStatus } from "../../api/orderApi";
import { getErrorMessage } from "../../api/client";
import { Badge, Button, ErrorState, PageLoader } from "../../components/ui";
import { formatOrderId } from "../../utils/format";
import { useAuth } from "../auth/AuthContext";
import { PERMISSIONS } from "../../utils/constants";

const REFRESH_INTERVAL = 15000;

// Each column groups one or more order statuses
const COLUMNS = [
    { key: "new", title: "New orders", statuses: ["Pending", "Confirmed"], tone: "info", accent: "border-l-sky-500" },
    { key: "preparing", title: "Preparing", statuses: ["Preparing"], tone: "warning", accent: "border-l-amber-500" },
    { key: "ready", title: "Ready for pickup", statuses: ["Ready"], tone: "success", accent: "border-l-green-600" },
];

// What the kitchen does next with a ticket
const NEXT_ACTION = {
    Pending: { label: "Accept", next: "Confirmed" },
    Confirmed: { label: "Start cooking", next: "Preparing" },
    Preparing: { label: "Mark ready", next: "Ready" },
};

const minutesSince = (date, now) => Math.max(0, Math.floor((now - new Date(date).getTime()) / 60000));

const ageColor = (minutes) => {
    if (minutes >= 20) return "bg-red-50 text-red-700";
    if (minutes >= 10) return "bg-amber-50 text-amber-700";
    return "bg-cream text-muted";
};

const KitchenPage = () => {
    const canUpdate = useAuth().can(PERMISSIONS.KITCHEN_UPDATE);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [now, setNow] = useState(() => Date.now());

    const loadOrders = useCallback(async () => {
        try {
            const response = await getKitchenOrders();
            setOrders(Array.isArray(response?.data) ? response.data : []);
            setError("");
        } catch (err) {
            setError(getErrorMessage(err, "Failed to load kitchen orders."));
        } finally {
            setLoading(false);
            setRefreshing(false);
            setNow(Date.now());
        }
    }, []);

    // Initial load, auto refresh, and a clock for ticket ages
    useEffect(() => {
        loadOrders();

        const refreshTimer = setInterval(loadOrders, REFRESH_INTERVAL);
        const clockTimer = setInterval(() => setNow(Date.now()), 30000);

        return () => {
            clearInterval(refreshTimer);
            clearInterval(clockTimer);
        };
    }, [loadOrders]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    const handleAdvance = async (order) => {
        const action = NEXT_ACTION[order.orderStatus];
        if (!action || updatingId) return;

        try {
            setUpdatingId(order._id);
            await updateOrderStatus(order._id, action.next);

            // Move the ticket right away instead of waiting for the next refresh
            setOrders((prev) =>
                prev.map((item) => (item._id === order._id ? { ...item, orderStatus: action.next } : item))
            );
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to update order."));
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) return <PageLoader text="Loading orders..." />;

    return (
        <div className="flex flex-1 flex-col p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl font-semibold">Kitchen</h1>
                    <p className="text-sm text-muted">
                        {orders.length} active {orders.length === 1 ? "ticket" : "tickets"} · refreshes every 15 seconds
                    </p>
                </div>
                <Button variant="outline" icon={RefreshCw} loading={refreshing} onClick={handleRefresh}>
                    Refresh
                </Button>
            </div>

            {error && orders.length === 0 ? (
                <ErrorState message={error} onRetry={handleRefresh} />
            ) : (
                <div className="grid flex-1 gap-4 lg:grid-cols-3">
                    {COLUMNS.map((column) => {
                        const columnOrders = orders.filter((order) => column.statuses.includes(order.orderStatus));

                        return (
                            <section key={column.key} className="flex flex-col rounded-2xl border border-line bg-surface/60 p-3">
                                <div className="mb-3 flex items-center justify-between px-1">
                                    <h2 className="font-bold">{column.title}</h2>
                                    <Badge tone={column.tone}>{columnOrders.length}</Badge>
                                </div>

                                {columnOrders.length === 0 ? (
                                    <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line py-12 text-sm text-muted">
                                        No orders
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {columnOrders.map((order) => (
                                            <OrderTicket
                                                key={order._id}
                                                order={order}
                                                accent={column.accent}
                                                now={now}
                                                updating={updatingId === order._id}
                                                onAdvance={canUpdate ? handleAdvance : null}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const OrderTicket = ({ order, accent, now, updating, onAdvance }) => {
    const minutes = minutesSince(order.createdAt, now);
    const action = NEXT_ACTION[order.orderStatus];

    return (
        <article className={`rounded-xl border border-line border-l-4 ${accent} bg-surface p-4 shadow-card`}>
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-lg font-extrabold">{formatOrderId(order._id)}</p>
                    <p className="text-xs font-medium text-muted">
                        {order.orderType || "Delivery"}
                        {order.tableNumber && ` · Table ${order.tableNumber}`}
                        {order.customerName && ` · ${order.customerName}`}
                    </p>
                </div>
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${ageColor(minutes)}`}>
                    <Clock size={12} />
                    {minutes}m
                </span>
            </div>

            <ul className="mt-3 space-y-1.5 border-t border-dashed border-line pt-3">
                {order.items?.map((item, index) => (
                    <li key={`${order._id}-${index}`} className="flex gap-2 text-[15px]">
                        <span className="min-w-7 font-extrabold text-brand">{item.quantity}×</span>
                        <span className="font-medium">{item.name}</span>
                    </li>
                ))}
            </ul>

            {order.notes && (
                <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-800">
                    <StickyNote size={14} className="mt-0.5 shrink-0" />
                    {order.notes}
                </p>
            )}

            {action ? (
                // View-only kitchen users get no action button
                onAdvance && (
                    <Button fullWidth className="mt-3" loading={updating} onClick={() => onAdvance(order)}>
                        {action.label}
                    </Button>
                )
            ) : (
                <p className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-green-50 py-2.5 text-sm font-semibold text-green-700">
                    <UtensilsCrossed size={15} />
                    Waiting for pickup
                </p>
            )}
        </article>
    );
};

export default KitchenPage;
