import { Link } from "react-router-dom";
import {
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    ChefHat,
    Clock,
    CreditCard,
    IndianRupee,
    LayoutGrid,
    MonitorSmartphone,
    ShoppingBag,
    Tags,
    Users,
    UtensilsCrossed,
} from "lucide-react";

import { getDashboardStats, getRecentOrders } from "../../../api/dashboardApi";
import { getAllOrders } from "../../../api/orderApi";
import { getPaymentStatistics } from "../../../api/paymentApi";
import { getUsers } from "../../../api/authApi";
import { unwrapList, unwrapPagination } from "../../../api/client";
import {
    Button,
    Card,
    CardHeader,
    DataTable,
    ErrorState,
    PageHeader,
    Skeleton,
    StatCard,
    StatusBadge,
} from "../../../components/ui";
import { ORDER_STATUSES, ROLES } from "../../../utils/constants";
import { formatCurrency, formatDateTime, formatOrderId } from "../../../utils/format";
import useRequest from "../../../hooks/useRequest";
import { getCustomerName, getOrderTypeLabel } from "../orders/orderUtils";

// Bar colour per order status
const STATUS_BAR = {
    Pending: "bg-amber-400",
    Confirmed: "bg-sky-400",
    Preparing: "bg-orange-400",
    Ready: "bg-emerald-400",
    "Out for Delivery": "bg-sky-600",
    Delivered: "bg-green-600",
    Cancelled: "bg-red-400",
};

const QUICK_LINKS = [
    { to: "/admin/orders", label: "Orders", description: "Manage incoming orders", icon: ShoppingBag },
    { to: "/admin/menu", label: "Menu", description: "Dishes, prices and stock", icon: UtensilsCrossed },
    { to: "/pos", label: "POS", description: "Take counter orders", icon: MonitorSmartphone },
    { to: "/kitchen", label: "Kitchen", description: "Live kitchen display", icon: ChefHat },
];

// Optional requests should never break the whole dashboard
const optional = (promise) => promise.catch(() => null);

const loadDashboard = async () => {
    const [statsRes, recentRes, paymentRes, usersRes, ...statusRes] = await Promise.all([
        getDashboardStats(),
        optional(getRecentOrders()),
        optional(getPaymentStatistics()),
        optional(getUsers()),
        ...ORDER_STATUSES.map((status) => optional(getAllOrders({ orderStatus: status, limit: 1 }))),
    ]);

    // /dashboard/stats counts users with an undefined role, so count customers here when possible
    const users = usersRes ? unwrapList(usersRes) : null;

    return {
        stats: statsRes?.data ?? {},
        recentOrders: recentRes ? unwrapList(recentRes) : [],
        paymentStats: paymentRes?.data ?? null,
        customers: users ? users.filter((user) => user.role === ROLES.CUSTOMER).length : null,
        statusCounts: statusRes.every(Boolean)
            ? ORDER_STATUSES.map((status, index) => ({
                  status,
                  count: unwrapPagination(statusRes[index]).totalRecords,
              }))
            : null,
    };
};

const StatusBreakdown = ({ counts }) => {
    const total = counts.reduce((sum, item) => sum + item.count, 0);
    const max = Math.max(1, ...counts.map((item) => item.count));

    return (
        <Card>
            <CardHeader title="Orders by status" description={`${total} orders in total`} />
            <ul className="space-y-3">
                {counts.map(({ status, count }) => (
                    <li key={status}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-medium text-ink">{status}</span>
                            <span className="font-semibold text-muted">{count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-cream">
                            <div
                                className={`h-full rounded-full ${STATUS_BAR[status] || "bg-brand"}`}
                                style={{ width: `${(count / max) * 100}%` }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </Card>
    );
};

const DashboardSkeleton = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className="h-28" />
            ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 lg:col-span-2" />
            <Skeleton className="h-80" />
        </div>
    </div>
);

const DashboardPage = () => {
    const { data, loading, error, reload } = useRequest(loadDashboard);

    const header = (
        <PageHeader
            eyebrow="Restaurant overview"
            title="Dashboard"
            description="A quick look at today's service, sales and orders."
            actions={
                <Button to="/admin/orders" icon={ShoppingBag}>
                    View orders
                </Button>
            }
        />
    );

    if (loading) {
        return (
            <div>
                {header}
                <DashboardSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div>
                {header}
                <Card>
                    <ErrorState message={error} onRetry={reload} />
                </Card>
            </div>
        );
    }

    const { stats, recentOrders, paymentStats, customers, statusCounts } = data;

    const recentColumns = [
        {
            key: "id",
            header: "Order",
            render: (order) => <span className="font-semibold">{formatOrderId(order._id)}</span>,
        },
        { key: "customer", header: "Customer", render: (order) => getCustomerName(order) },
        { key: "type", header: "Type", className: "whitespace-nowrap", render: (order) => getOrderTypeLabel(order) },
        {
            key: "total",
            header: "Total",
            align: "right",
            render: (order) => <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>,
        },
        { key: "status", header: "Status", render: (order) => <StatusBadge status={order.orderStatus} /> },
        {
            key: "date",
            header: "Placed",
            className: "whitespace-nowrap text-muted",
            render: (order) => formatDateTime(order.createdAt),
        },
    ];

    return (
        <div className="space-y-6">
            {header}

            {/* Key numbers */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Revenue" value={formatCurrency(stats.totalRevenue)} icon={IndianRupee} hint="From paid orders" tone="success" />
                <StatCard label="Today's orders" value={stats.todayOrders ?? 0} icon={CalendarClock} hint="Since midnight" />
                <StatCard label="Pending orders" value={stats.pendingOrders ?? 0} icon={Clock} hint="Waiting for confirmation" tone="warning" />
                <StatCard label="Delivered orders" value={stats.completedOrders ?? 0} icon={CheckCircle2} hint={`${stats.totalOrders ?? 0} orders overall`} tone="info" />
                <StatCard label="Customers" value={customers ?? stats.totalUsers ?? 0} icon={Users} hint="Registered accounts" />
                <StatCard label="Menu items" value={stats.totalMenus ?? 0} icon={UtensilsCrossed} hint="Dishes on the menu" />
                <StatCard label="Categories" value={stats.totalCategory ?? 0} icon={Tags} hint="Menu sections" />
                {paymentStats ? (
                    <StatCard
                        label="Payments collected"
                        value={formatCurrency(paymentStats.totalRevenue)}
                        icon={CreditCard}
                        hint={`${paymentStats.successfulPayments} successful · ${paymentStats.pendingPayments} pending`}
                        tone="success"
                    />
                ) : (
                    <StatCard label="Total orders" value={stats.totalOrders ?? 0} icon={LayoutGrid} hint="All time" />
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent orders */}
                <Card padding="none" className={`overflow-hidden ${statusCounts ? "lg:col-span-2" : "lg:col-span-3"}`}>
                    <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
                        <div>
                            <h2 className="text-base font-bold text-ink">Recent orders</h2>
                            <p className="text-sm text-muted">The latest five orders</p>
                        </div>
                        <Button to="/admin/orders" variant="ghost" size="sm" iconRight={ArrowRight}>
                            All orders
                        </Button>
                    </div>
                    <div className="mt-4">
                        <DataTable
                            columns={recentColumns}
                            rows={recentOrders}
                            empty={{ icon: ShoppingBag, title: "No orders yet", description: "Orders will show up here once customers start ordering." }}
                        />
                    </div>
                </Card>

                {statusCounts && <StatusBreakdown counts={statusCounts} />}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {QUICK_LINKS.map(({ to, label, description, icon: Icon }) => (
                    <Link
                        key={to}
                        to={to}
                        className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lift"
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                            <Icon size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-ink">{label}</span>
                            <span className="block truncate text-xs text-muted">{description}</span>
                        </span>
                        <ArrowRight size={18} className="text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" />
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default DashboardPage;
