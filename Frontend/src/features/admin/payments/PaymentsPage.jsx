import { useCallback, useMemo, useState } from "react";
import {
    Ban,
    Banknote,
    CheckCircle2,
    Clock,
    CreditCard,
    IndianRupee,
    RefreshCw,
    RotateCcw,
    Search,
    Trash2,
    Undo2,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    deletePayment,
    getAllPayments,
    getPaymentStatistics,
    refundPayment,
    updatePaymentStatus,
    verifyCashOnDelivery,
} from "../../../api/paymentApi";
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
    Skeleton,
    StatCard,
    StatusBadge,
    Tabs,
} from "../../../components/ui";
import { formatCurrency, formatDateTime, formatOrderId } from "../../../utils/format";
import useRequest from "../../../hooks/useRequest";
import RefundModal from "./RefundModal";
import {
    PAYMENT_FILTERS,
    canDeletePayment,
    canRefund,
    canVerifyCod,
    getManualStatus,
    matchesPaymentSearch,
} from "./paymentUtils";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../../utils/constants";

const PAGE_SIZE = 20;

const fetchStats = async () => (await getPaymentStatistics())?.data ?? null;

// Confirm dialog copy for each simple action
const ACTIONS = {
    cod: {
        title: "Mark cash as received?",
        confirmText: "Mark received",
        tone: "primary",
        message: (p) => `Confirm that ${formatCurrency(p.amount)} in cash was collected for order ${formatOrderId(p.order?._id || p.order)}. The order will be marked as paid.`,
    },
    Failed: {
        title: "Mark payment as failed?",
        confirmText: "Mark failed",
        tone: "danger",
        message: (p) => `Payment ${formatOrderId(p._id)} and its order will be marked as failed.`,
    },
    Pending: {
        title: "Reopen this payment?",
        confirmText: "Set to pending",
        tone: "primary",
        message: (p) => `Payment ${formatOrderId(p._id)} will be set back to pending.`,
    },
    delete: {
        title: "Delete payment record?",
        confirmText: "Delete",
        tone: "danger",
        message: (p) => `Payment ${formatOrderId(p._id)} (${formatCurrency(p.amount)}) will be permanently removed. The order itself is not affected.`,
    },
};

const PaymentsPage = () => {
    // Deleting payment records is admin only (backend enforces this too)
    const { isAdmin, can } = useAuth();
    const canUpdate = can(PERMISSIONS.PAYMENTS_UPDATE);
    const canRefundPayments = can(PERMISSIONS.PAYMENTS_REFUND);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [pending, setPending] = useState(null); // { type, payment }
    const [refundTarget, setRefundTarget] = useState(null);
    const [busy, setBusy] = useState(false);

    const fetchPayments = useCallback(async () => {
        const res = await getAllPayments({
            page,
            limit: PAGE_SIZE,
            sort: "createdAt",
            order: "desc",
            ...(filter !== "all" && { paymentStatus: filter }),
        });
        return { rows: unwrapList(res), pagination: unwrapPagination(res) };
    }, [page, filter]);

    const { data, loading, refreshing, error, reload } = useRequest(fetchPayments);
    const statsRequest = useRequest(fetchStats);
    const stats = statsRequest.data;

    const rows = useMemo(() => data?.rows ?? [], [data]);
    const pagination = data?.pagination;

    // Status is filtered on the server; search narrows the loaded page
    const visibleRows = useMemo(
        () => rows.filter((payment) => matchesPaymentSearch(payment, search)),
        [rows, search]
    );

    const tabItems = useMemo(
        () => [
            { value: "all", label: "All" },
            ...PAYMENT_FILTERS.map((status) => ({ value: status, label: status })),
        ],
        []
    );

    const changeFilter = (value) => {
        setFilter(value);
        setPage(1);
    };

    const refreshAll = () => {
        reload();
        statsRequest.reload();
    };

    const runAction = async () => {
        if (!pending) return;
        const { type, payment } = pending;
        setBusy(true);

        try {
            let res;
            if (type === "cod") res = await verifyCashOnDelivery(payment._id);
            else if (type === "delete") res = await deletePayment(payment._id);
            else res = await updatePaymentStatus(payment._id, type);

            toast.success(res?.message || "Payment updated.");
            setPending(null);
            refreshAll();
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not update the payment."));
        } finally {
            setBusy(false);
        }
    };

    const handleRefund = async (payment, amount, reason) => {
        setBusy(true);

        try {
            const res = await refundPayment(payment._id, amount, reason);
            toast.success(res?.message || "Refund processed.");
            setRefundTarget(null);
            refreshAll();
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not process the refund."));
        } finally {
            setBusy(false);
        }
    };

    const columns = [
        {
            key: "id",
            header: "Payment",
            render: (payment) => (
                <div>
                    <p className="font-semibold text-ink">{formatOrderId(payment._id)}</p>
                    {payment.razorpayPaymentId && <p className="text-xs text-muted">{payment.razorpayPaymentId}</p>}
                </div>
            ),
        },
        {
            key: "order",
            header: "Order",
            render: (payment) =>
                payment.order ? (
                    <div>
                        <p className="font-medium text-ink">{formatOrderId(payment.order._id || payment.order)}</p>
                        {payment.order.orderStatus && <p className="text-xs text-muted">{payment.order.orderStatus}</p>}
                    </div>
                ) : (
                    <span className="text-muted">Deleted order</span>
                ),
        },
        {
            key: "customer",
            header: "Customer",
            render: (payment) => (
                <div className="max-w-48">
                    <p className="truncate font-medium text-ink">{payment.user?.name || "Unknown"}</p>
                    {payment.user?.email && <p className="truncate text-xs text-muted">{payment.user.email}</p>}
                </div>
            ),
        },
        { key: "method", header: "Method", className: "whitespace-nowrap", render: (payment) => payment.paymentMethod },
        {
            key: "amount",
            header: "Amount",
            align: "right",
            className: "whitespace-nowrap",
            render: (payment) => (
                <div>
                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    {Number(payment.refundAmount) > 0 && (
                        <p className="text-xs text-danger">−{formatCurrency(payment.refundAmount)} refunded</p>
                    )}
                </div>
            ),
        },
        {
            key: "status",
            header: "Status",
            render: (payment) => (
                <div className="space-y-1">
                    <StatusBadge status={payment.paymentStatus} />
                    {payment.refundReason && (
                        <p className="max-w-40 truncate text-xs text-muted" title={payment.refundReason}>
                            {payment.refundReason}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: "date",
            header: "Date",
            className: "whitespace-nowrap text-muted",
            render: (payment) => formatDateTime(payment.refundedAt || payment.paidAt || payment.createdAt),
        },
        {
            key: "actions",
            header: "",
            align: "right",
            render: (payment) => {
                const manualStatus = canUpdate ? getManualStatus(payment) : null;

                return (
                    <div className="flex justify-end gap-1">
                        {canUpdate && canVerifyCod(payment) && (
                            <Button size="sm" variant="soft" icon={Banknote} onClick={() => setPending({ type: "cod", payment })}>
                                Received
                            </Button>
                        )}
                        {canRefundPayments && canRefund(payment) && (
                            <Button size="sm" variant="outline" icon={RotateCcw} onClick={() => setRefundTarget(payment)}>
                                Refund
                            </Button>
                        )}
                        {manualStatus && (
                            <Button
                                size="icon-sm"
                                variant="ghost"
                                icon={manualStatus === "Failed" ? Ban : Undo2}
                                aria-label={manualStatus === "Failed" ? "Mark as failed" : "Set back to pending"}
                                title={manualStatus === "Failed" ? "Mark as failed" : "Set back to pending"}
                                onClick={() => setPending({ type: manualStatus, payment })}
                            />
                        )}
                        {isAdmin && canDeletePayment(payment) && (
                            <Button
                                size="icon-sm"
                                variant="ghost"
                                icon={Trash2}
                                className="text-danger hover:bg-red-50"
                                aria-label="Delete payment"
                                title="Delete payment"
                                onClick={() => setPending({ type: "delete", payment })}
                            />
                        )}
                    </div>
                );
            },
        },
    ];

    const action = pending ? ACTIONS[pending.type] : null;

    return (
        <div>
            <PageHeader
                eyebrow="Finance"
                title="Payments"
                description="Online and cash-on-delivery payments. Counter (POS) sales are recorded on the order itself."
                actions={
                    <Button variant="outline" icon={RefreshCw} loading={refreshing} onClick={refreshAll}>
                        Refresh
                    </Button>
                }
            />

            {/* Summary */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statsRequest.loading ? (
                    Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28" />)
                ) : stats ? (
                    <>
                        <StatCard label="Collected" value={formatCurrency(stats.totalRevenue)} icon={IndianRupee} hint="Successful payments" tone="success" />
                        <StatCard label="Successful" value={stats.successfulPayments} icon={CheckCircle2} hint={`of ${stats.totalPayments} payments`} tone="info" />
                        <StatCard label="Pending" value={stats.pendingPayments} icon={Clock} hint="Awaiting confirmation" tone="warning" />
                        <StatCard label="Refunded" value={stats.refundedPayments} icon={RotateCcw} hint="Returned to customers" tone="danger" />
                    </>
                ) : null}
            </div>

            <Tabs items={tabItems} value={filter} onChange={changeFilter} className="mb-4" />

            <Card padding="none" className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                    <Input
                        icon={Search}
                        type="search"
                        aria-label="Search payments"
                        placeholder="Search by payment, order or customer"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full sm:max-w-sm"
                    />
                    {pagination && (
                        <p className="text-sm text-muted">
                            {pagination.totalRecords} payment{pagination.totalRecords === 1 ? "" : "s"} · search applies to this page
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
                            icon: CreditCard,
                            title: rows.length ? "No matching payments" : "No payments yet",
                            description: rows.length
                                ? "Try another status or search term."
                                : "Payments appear when customers check out online or with cash on delivery.",
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

            <ConfirmDialog
                open={!!pending}
                onClose={() => setPending(null)}
                onConfirm={runAction}
                loading={busy}
                title={action?.title}
                message={pending ? action.message(pending.payment) : ""}
                confirmText={action?.confirmText}
                tone={action?.tone}
            />

            {refundTarget && (
                <RefundModal
                    key={refundTarget._id}
                    payment={refundTarget}
                    loading={busy}
                    onClose={() => setRefundTarget(null)}
                    onSubmit={handleRefund}
                />
            )}
        </div>
    );
};

export default PaymentsPage;
