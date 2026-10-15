import { useCallback, useMemo, useState } from "react";
import { Eye, RefreshCw, Search, ShoppingBag, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import { cancelOrder, getAllOrders, updateOrderStatus } from "../../../api/orderApi";
import { getErrorMessage, unwrapList, unwrapPagination } from "../../../api/client";
import {
    Button,
    Card,
    ConfirmDialog,
    DataTable,
    ErrorState,
    Input,
    PageHeader,
    Pagination,
    StatusBadge,
    Tabs,
} from "../../../components/ui";
import { ORDER_STATUSES } from "../../../utils/constants";
import { formatCurrency, formatDateTime, formatOrderId } from "../../../utils/format";
import OrderDetailsModal from "./OrderDetailsModal";
import useRequest from "../../../hooks/useRequest";
import {
    canCancelOrder,
    getCustomerContact,
    getCustomerName,
    getItemCount,
    getNextStatuses,
    getOrderTypeLabel,
    matchesOrderSearch,
} from "./orderUtils";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../../utils/constants";

const PAGE_SIZE = 15;

const TAB_ITEMS = [{ value: "all", label: "All" }, ...ORDER_STATUSES.map((status) => ({ value: status, label: status }))];

const OrdersPage = () => {
    const { can } = useAuth();
    const canUpdate = can(PERMISSIONS.ORDERS_UPDATE);
    const canCancel = can(PERMISSIONS.ORDERS_CANCEL);

    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const [toCancel, setToCancel] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const fetchOrders = useCallback(async () => {
        const params = { page, limit: PAGE_SIZE, sort: "createdAt", order: "desc" };
        if (status !== "all") params.orderStatus = status;

        const res = await getAllOrders(params);
        return { rows: unwrapList(res), pagination: unwrapPagination(res) };
    }, [page, status]);

    const { data, loading, refreshing, error, reload, setData } = useRequest(fetchOrders);

    const rows = useMemo(() => data?.rows ?? [], [data]);
    const pagination = data?.pagination;
    const visibleRows = useMemo(() => rows.filter((order) => matchesOrderSearch(order, search)), [rows, search]);
    const selectedOrder = rows.find((order) => order._id === selectedId) || null;

    const changeTab = (value) => {
        setStatus(value);
        setPage(1);
    };

    // Keep populated fields (user, items.menu) and merge the changed ones
    const patchOrder = (id, updated) =>
        setData((prev) =>
            prev
                ? {
                      ...prev,
                      rows: prev.rows.map((order) =>
                          order._id === id
                              ? {
                                    ...order,
                                    orderStatus: updated?.orderStatus ?? order.orderStatus,
                                    paymentStatus: updated?.paymentStatus ?? order.paymentStatus,
                                    deliveredAt: updated?.deliveredAt ?? order.deliveredAt,
                                    cancelledAt: updated?.cancelledAt ?? order.cancelledAt,
                                    updatedAt: updated?.updatedAt ?? order.updatedAt,
                                }
                              : order
                      ),
                  }
                : prev
        );

    const handleStatusChange = async (order, nextStatus) => {
        setBusyId(order._id);

        try {
            const res = await updateOrderStatus(order._id, nextStatus);
            patchOrder(order._id, res?.data ?? { orderStatus: nextStatus });
            toast.success(`Order ${formatOrderId(order._id)} moved to ${nextStatus}.`);

            // The order may no longer belong to the filtered tab
            if (status !== "all") reload();
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not update the order status."));
        } finally {
            setBusyId(null);
        }
    };

    const handleCancel = async () => {
        if (!toCancel) return;
        setBusyId(toCancel._id);

        try {
            const res = await cancelOrder(toCancel._id);
            patchOrder(toCancel._id, res?.data ?? { orderStatus: "Cancelled" });
            toast.success(`Order ${formatOrderId(toCancel._id)} cancelled.`);
            setToCancel(null);
            if (status !== "all") reload();
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not cancel the order."));
        } finally {
            setBusyId(null);
        }
    };

    const columns = [
        {
            key: "id",
            header: "Order",
            render: (order) => (
                <div>
                    <p className="font-semibold text-ink">{formatOrderId(order._id)}</p>
                    {order.orderNumber && <p className="text-xs text-muted">{order.orderNumber}</p>}
                </div>
            ),
        },
        {
            key: "customer",
            header: "Customer",
            render: (order) => (
                <div className="max-w-48">
                    <p className="truncate font-medium text-ink">{getCustomerName(order)}</p>
                    {getCustomerContact(order) && <p className="truncate text-xs text-muted">{getCustomerContact(order)}</p>}
                </div>
            ),
        },
        {
            key: "type",
            header: "Type",
            className: "whitespace-nowrap",
            render: (order) => getOrderTypeLabel(order),
        },
        { key: "items", header: "Items", align: "center", render: (order) => getItemCount(order) },
        {
            key: "total",
            header: "Total",
            align: "right",
            className: "whitespace-nowrap",
            render: (order) => <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>,
        },
        {
            key: "payment",
            header: "Payment",
            render: (order) => (
                <div className="space-y-1">
                    <StatusBadge status={order.paymentStatus} />
                    <p className="whitespace-nowrap text-xs text-muted">{order.paymentMethod}</p>
                </div>
            ),
        },
        {
            key: "status",
            header: "Status",
            render: (order) => {
                const nextStatuses = canUpdate ? getNextStatuses(order) : [];

                return (
                    <div className="space-y-1.5">
                        <StatusBadge status={order.orderStatus} />
                        {nextStatuses.length > 0 && (
                            <select
                                aria-label={`Update status of order ${formatOrderId(order._id)}`}
                                value=""
                                disabled={busyId === order._id}
                                onChange={(event) => event.target.value && handleStatusChange(order, event.target.value)}
                                className="block h-8 w-36 rounded-lg border border-line bg-surface px-2 text-xs font-medium text-ink focus:border-brand focus:outline-none disabled:opacity-50"
                            >
                                <option value="">Move to…</option>
                                {nextStatuses.map((next) => (
                                    <option key={next} value={next}>
                                        {next}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                );
            },
        },
        {
            key: "date",
            header: "Placed",
            className: "whitespace-nowrap text-muted",
            render: (order) => formatDateTime(order.createdAt),
        },
        {
            key: "actions",
            header: "",
            align: "right",
            render: (order) => (
                <div className="flex justify-end gap-1">
                    <Button size="icon-sm" variant="ghost" icon={Eye} aria-label="View order" title="View details" onClick={() => setSelectedId(order._id)} />
                    {canCancel && canCancelOrder(order) && (
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            icon={XCircle}
                            className="text-danger hover:bg-red-50"
                            aria-label="Cancel order"
                            title="Cancel order"
                            disabled={busyId === order._id}
                            onClick={() => setToCancel(order)}
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                eyebrow="Operations"
                title="Orders"
                description="Track online and counter orders and move them through the kitchen."
                actions={
                    <Button variant="outline" icon={RefreshCw} loading={refreshing} onClick={reload}>
                        Refresh
                    </Button>
                }
            />

            <Tabs items={TAB_ITEMS} value={status} onChange={changeTab} className="mb-4" />

            <Card padding="none" className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                    <Input
                        icon={Search}
                        type="search"
                        aria-label="Search orders"
                        placeholder="Search this page by order, customer or phone"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full sm:max-w-sm"
                    />
                    {pagination && (
                        <p className="text-sm text-muted">
                            {pagination.totalRecords} order{pagination.totalRecords === 1 ? "" : "s"}
                        </p>
                    )}
                </div>

                {error ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : (
                    <DataTable
                        columns={columns}
                        rows={visibleRows}
                        loading={loading}
                        empty={{
                            icon: ShoppingBag,
                            title: search ? "No matching orders" : "No orders here yet",
                            description: search
                                ? "Search only covers the orders on this page."
                                : status === "all"
                                  ? "New orders will appear here as soon as they are placed."
                                  : `There are no ${status.toLowerCase()} orders right now.`,
                        }}
                    />
                )}
            </Card>

            {!error && pagination && (
                <Pagination
                    className="mt-6"
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                />
            )}

            <OrderDetailsModal
                order={selectedOrder}
                onClose={() => setSelectedId(null)}
                onStatusChange={handleStatusChange}
                onCancel={setToCancel}
                canUpdate={canUpdate}
                canCancel={canCancel}
                updating={busyId === selectedId}
            />

            <ConfirmDialog
                open={!!toCancel}
                onClose={() => setToCancel(null)}
                onConfirm={handleCancel}
                loading={!!toCancel && busyId === toCancel._id}
                title="Cancel this order?"
                message={
                    toCancel
                        ? `Order ${formatOrderId(toCancel._id)} for ${getCustomerName(toCancel)} will be cancelled and its items returned to stock. This cannot be undone.`
                        : ""
                }
                confirmText="Cancel order"
            />
        </div>
    );
};

export default OrdersPage;
