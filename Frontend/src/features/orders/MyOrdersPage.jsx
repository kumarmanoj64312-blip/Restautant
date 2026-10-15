import { useCallback, useEffect, useState } from "react";
import { ImageOff, ReceiptText, RotateCcw, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { getErrorMessage, unwrapList, unwrapPagination } from "../../api/client";
import { cancelOrder, getMyOrders } from "../../api/orderApi";
import {
    Button,
    Card,
    ConfirmDialog,
    EmptyState,
    ErrorState,
    PageHeader,
    Pagination,
    Skeleton,
    StatusBadge,
} from "../../components/ui";
import { formatCurrency, formatDateTime, formatOrderId } from "../../utils/format";
import { useAuth } from "../auth/AuthContext";
import StaffNotice from "../cart/StaffNotice";
import OrderProgress from "./OrderProgress";

const PAGE_SIZE = 5;
const CANCELLABLE = ["Pending", "Confirmed"];

const OrderCard = ({ order, onCancel }) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const address = order.shippingAddress;

    return (
        <Card as="article" padding="none" className="overflow-hidden">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-cream/40 px-4 py-4 sm:px-6">
                <div>
                    <h2 className="font-display text-lg font-semibold text-ink">
                        Order {formatOrderId(order._id)}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                        Placed {formatDateTime(order.createdAt)}
                        {order.orderNumber && <span className="hidden sm:inline"> · Ref {order.orderNumber}</span>}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={order.orderStatus} />
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                        Payment <StatusBadge status={order.paymentStatus} />
                    </span>
                </div>
            </header>

            <div className="space-y-6 px-4 py-5 sm:px-6">
                <OrderProgress status={order.orderStatus} cancelledAt={order.cancelledAt} />

                <ul className="divide-y divide-line">
                    {items.map((item, index) => (
                        <li key={`${item.menu?._id || item.menu || item.name}-${index}`} className="flex items-center gap-3 py-3">
                            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                                {item.image?.url ? (
                                    <img src={item.image.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center text-muted">
                                        <ImageOff size={16} />
                                    </span>
                                )}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-ink">{item.name}</span>
                                <span className="block text-xs text-muted">
                                    {item.quantity} × {formatCurrency(item.price)}
                                </span>
                            </span>
                            <span className="text-sm font-semibold text-ink">
                                {formatCurrency(item.total ?? item.price * item.quantity)}
                            </span>
                        </li>
                    ))}
                </ul>

                <div className="flex flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="text-xs text-muted">
                        <p>
                            <span className="font-semibold text-ink">{order.paymentMethod}</span>
                        </p>
                        {address && (
                            <p className="mt-1 max-w-sm">
                                Deliver to {address.name}, {address.address}, {address.city}
                                {address.pincode ? ` - ${address.pincode}` : ""}
                            </p>
                        )}
                        {order.notes && <p className="mt-1 italic">“{order.notes}”</p>}
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                        {CANCELLABLE.includes(order.orderStatus) && (
                            <Button variant="danger-outline" size="sm" icon={XCircle} onClick={() => onCancel(order)}>
                                Cancel order
                            </Button>
                        )}
                        <p className="text-right">
                            <span className="block text-xs text-muted">Total</span>
                            <span className="font-display text-xl font-semibold text-brand">
                                {formatCurrency(order.totalAmount)}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const MyOrdersPage = () => {
    const { user, isStaff } = useAuth();

    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(!isStaff);
    const [error, setError] = useState("");
    const [toCancel, setToCancel] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    const loadOrders = useCallback(async (pageToLoad) => {
        try {
            const response = await getMyOrders({ page: pageToLoad, limit: PAGE_SIZE });
            setOrders(unwrapList(response));
            setPagination(unwrapPagination(response));
            setError("");
        } catch (err) {
            setError(getErrorMessage(err, "We couldn't load your orders."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isStaff) loadOrders(page);
    }, [isStaff, page, loadOrders]);

    const changePage = (next) => {
        setLoading(true);
        setPage(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancel = async () => {
        if (!toCancel) return;
        setCancelling(true);

        try {
            const response = await cancelOrder(toCancel._id);
            const updated = response?.data;

            setOrders((prev) =>
                prev.map((order) =>
                    order._id === toCancel._id
                        ? { ...order, ...(updated || {}), orderStatus: "Cancelled", items: order.items }
                        : order
                )
            );
            toast.success(`Order ${formatOrderId(toCancel._id)} cancelled.`);
            setToCancel(null);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't cancel this order."));
        } finally {
            setCancelling(false);
        }
    };

    const renderBody = () => {
        if (isStaff) return <StaffNotice role={user?.role} />;

        if (loading) {
            return (
                <div className="space-y-5">
                    {[0, 1].map((key) => (
                        <Skeleton key={key} className="h-80 rounded-2xl" />
                    ))}
                </div>
            );
        }

        if (error) {
            return (
                <Card padding="none">
                    <ErrorState
                        message={error}
                        onRetry={() => {
                            setLoading(true);
                            loadOrders(page);
                        }}
                    />
                </Card>
            );
        }

        if (orders.length === 0) {
            return (
                <Card padding="none">
                    <EmptyState
                        icon={ReceiptText}
                        title="No orders yet"
                        description="When you place an order, you'll be able to track it here."
                        action={<Button to="/menu">Order something tasty</Button>}
                    />
                </Card>
            );
        }

        return (
            <>
                <div className="space-y-5">
                    {orders.map((order) => (
                        <OrderCard key={order._id} order={order} onCancel={setToCancel} />
                    ))}
                </div>
                <Pagination
                    className="mt-8"
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={changePage}
                />
            </>
        );
    };

    return (
        <div className="container-page max-w-4xl py-8 sm:py-12">
            <PageHeader
                eyebrow="Account"
                title="My orders"
                description={
                    !isStaff && pagination.totalRecords > 0
                        ? `${pagination.totalRecords} ${pagination.totalRecords === 1 ? "order" : "orders"} so far`
                        : "Track and manage your orders."
                }
                actions={
                    !isStaff &&
                    !loading && (
                        <Button
                            variant="outline"
                            size="sm"
                            icon={RotateCcw}
                            onClick={() => {
                                setLoading(true);
                                loadOrders(page);
                            }}
                        >
                            Refresh
                        </Button>
                    )
                }
            />

            {renderBody()}

            <ConfirmDialog
                open={!!toCancel}
                onClose={() => setToCancel(null)}
                onConfirm={handleCancel}
                loading={cancelling}
                title="Cancel this order?"
                message={
                    toCancel
                        ? `Order ${formatOrderId(toCancel._id)} (${formatCurrency(toCancel.totalAmount)}) will be cancelled. This can't be undone.`
                        : ""
                }
                confirmText="Cancel order"
            />
        </div>
    );
};

export default MyOrdersPage;
