import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, CheckCircle2, Clock, Gift, ListChecks, Plus, Search, Stethoscope, Umbrella, XCircle } from "lucide-react";
import { approveLeave, cancelLeave, getLeaveBalance, getLeaves, rejectLeave } from "../../../api/leaveApi";
import { getErrorMessage, unwrapList, unwrapPagination } from "../../../api/client";
import { Avatar, Button, Card, ConfirmDialog, DataTable, ErrorState, PageHeader, Pagination, Skeleton, StatusBadge } from "../../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../../utils/constants";
import useRequest from "../../../hooks/useRequest";
import { MONTH_OPTIONS, YEAR_OPTIONS, formatDateRange, toDateKey } from "../hrUtils";
import ApplyLeaveModal from "./ApplyLeaveModal";
import HolidaysTab from "./HolidaysTab";

const PAGE_SIZE = 10;

const TYPE_STYLE = {
    casual: { icon: Umbrella, tone: "bg-sky-50 text-sky-700" },
    permission: { icon: Clock, tone: "bg-amber-50 text-amber-700" },
    sick: { icon: Stethoscope, tone: "bg-violet-50 text-violet-700" },
};

const TYPE_LABEL = { casual: "Casual Leave", sick: "Sick Leave", permission: "Permission" };

const selectClass =
    "h-10 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

const fetchBalance = async () => (await getLeaveBalance())?.data;

const LeavePage = () => {
    const { user, isAdmin, can } = useAuth();
    const canViewAll = can(PERMISSIONS.LEAVE_READ);
    const canApprove = can(PERMISSIONS.LEAVE_APPROVE);

    const [tab, setTab] = useState("requests");
    const [applying, setApplying] = useState(false);

    // Request filters
    const [search, setSearch] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [action, setAction] = useState(null); // { type: "approve"|"reject"|"cancel", leave }
    const [busy, setBusy] = useState(false);

    const balanceRequest = useRequest(fetchBalance);

    const fetchLeaves = useCallback(async () => {
        const response = await getLeaves({
            page,
            limit: PAGE_SIZE,
            search: search.trim() || undefined,
            month: month || undefined,
            year: year || (month ? String(new Date().getFullYear()) : undefined),
            status: status || undefined,
        });
        return { rows: unwrapList(response), pagination: unwrapPagination(response) };
    }, [page, search, month, year, status]);

    const { data, loading, error, reload } = useRequest(fetchLeaves);
    const rows = data?.rows ?? [];
    const pagination = data?.pagination;

    const setFilter = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    const clearFilters = () => {
        setSearch("");
        setMonth("");
        setYear("");
        setStatus("");
        setPage(1);
    };

    const handleAction = async () => {
        const { type, leave } = action;

        try {
            setBusy(true);
            if (type === "approve") await approveLeave(leave._id);
            if (type === "reject") await rejectLeave(leave._id);
            if (type === "cancel") await cancelLeave(leave._id);

            toast.success({ approve: "Leave approved.", reject: "Leave rejected.", cancel: "Leave cancelled." }[type]);
            setAction(null);
            reload();
            balanceRequest.reload();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't update the request."));
        } finally {
            setBusy(false);
        }
    };

    const isOwn = (leave) => leave.user?._id === user?._id;
    const today = toDateKey();

    const columns = [
        { key: "index", header: "S.No", className: "text-muted", render: (_, index) => (page - 1) * PAGE_SIZE + index + 1 },
        ...(canViewAll
            ? [
                  {
                      key: "user",
                      header: "User",
                      render: (leave) => (
                          <div className="flex items-center gap-2.5">
                              <Avatar name={leave.user?.name} src={leave.user?.avatar?.url} size={32} />
                              <span className="font-semibold text-ink">{leave.user?.name || "Deleted user"}</span>
                          </div>
                      ),
                  },
              ]
            : []),
        { key: "type", header: "Type", className: "whitespace-nowrap text-muted", render: (leave) => TYPE_LABEL[leave.type] || leave.type },
        {
            key: "dates",
            header: "Dates",
            className: "whitespace-nowrap",
            render: (leave) => (
                <div>
                    <p className="font-semibold text-success">{formatDateRange(leave.startDate, leave.endDate)}</p>
                    <p className="text-xs text-muted">
                        {leave.amount} {leave.type === "permission" ? "hr" : "day"}
                        {leave.amount === 1 ? "" : "s"}
                    </p>
                </div>
            ),
        },
        {
            key: "reason",
            header: "Reason",
            render: (leave) => (
                <div className="max-w-xs">
                    <p className="line-clamp-2 text-sm text-muted">{leave.reason}</p>
                    {leave.reviewedBy && (
                        <p className="mt-0.5 text-xs text-muted/80">
                            {leave.status} by {leave.reviewedBy.name}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: "status",
            header: "Status / Actions",
            render: (leave) => {
                const reviewable = canApprove && leave.status === "Pending" && (!isOwn(leave) || isAdmin);
                const cancellable = isOwn(leave) && (leave.status === "Pending" || (leave.status === "Approved" && leave.startDate > today));

                return (
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={leave.status} />
                        {reviewable && (
                            <>
                                <Button size="sm" variant="outline" icon={CheckCircle2} className="!border-green-200 !text-success hover:!bg-green-50" onClick={() => setAction({ type: "approve", leave })}>
                                    Approve
                                </Button>
                                <Button size="sm" variant="danger-outline" icon={XCircle} onClick={() => setAction({ type: "reject", leave })}>
                                    Reject
                                </Button>
                            </>
                        )}
                        {cancellable && !reviewable && (
                            <Button size="sm" variant="ghost" onClick={() => setAction({ type: "cancel", leave })}>
                                Cancel
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    const balances = balanceRequest.data?.balances ?? [];
    const filtered = search || month || year || status;

    return (
        <div>
            <PageHeader
                eyebrow="HR"
                title="Leave Management"
                description="Apply for leave and manage requests and holidays."
                actions={
                    <Button icon={Plus} onClick={() => setApplying(true)} disabled={!balances.length}>
                        Apply Leave
                    </Button>
                }
            />

            {/* Tabs */}
            <div className="mb-6 flex gap-6 border-b border-line">
                {[
                    { value: "requests", label: "Leave Requests", icon: ListChecks },
                    { value: "holidays", label: "Holidays", icon: Gift },
                ].map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setTab(value)}
                        className={`-mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition ${
                            tab === value ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
                        }`}
                    >
                        <Icon size={16} />
                        {label}
                    </button>
                ))}
            </div>

            {tab === "holidays" ? (
                <HolidaysTab canManage={can(PERMISSIONS.HOLIDAYS_MANAGE)} />
            ) : (
                <>
                    {/* Balance */}
                    <Card className="mb-6">
                        <div className="mb-4 flex items-center gap-2">
                            <CalendarDays size={18} className="text-brand" />
                            <div>
                                <h2 className="font-bold text-ink">My Leave Balance</h2>
                                <p className="text-xs text-muted">1 Jan – 31 Dec {balanceRequest.data?.year ?? new Date().getFullYear()}</p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            {balanceRequest.loading
                                ? [...Array(3)].map((_, index) => <Skeleton key={index} className="h-36" />)
                                : balances.map((balance) => {
                                      const style = TYPE_STYLE[balance.key] || TYPE_STYLE.casual;
                                      const Icon = style.icon;

                                      return (
                                          <div key={balance.key} className="rounded-2xl border border-line bg-canvas/50 p-4">
                                              <div className="flex items-start justify-between">
                                                  <p className="font-semibold text-ink">{balance.label}</p>
                                                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.tone}`}>
                                                      <Icon size={19} />
                                                  </span>
                                              </div>
                                              <dl className="mt-3 space-y-1.5 text-sm">
                                                  <div className="flex justify-between">
                                                      <dt className="text-muted">Available</dt>
                                                      <dd className="font-bold text-ink">{balance.available}</dd>
                                                  </div>
                                                  <div className="flex justify-between">
                                                      <dt className="text-muted">Booked</dt>
                                                      <dd className="font-semibold text-ink">{balance.used}</dd>
                                                  </div>
                                                  <div className="flex justify-between">
                                                      <dt className="text-muted">Pending</dt>
                                                      <dd className="font-semibold text-ink">{balance.pending}</dd>
                                                  </div>
                                              </dl>
                                              <p className="mt-3 text-xs text-muted">
                                                  {balance.allowance} {balance.unit} a year · Unit: {balance.unit}
                                              </p>
                                          </div>
                                      );
                                  })}
                        </div>
                    </Card>

                    {/* Requests */}
                    <Card padding="none" className="overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                            <h2 className="font-bold text-ink">{canViewAll ? "Leave Requests" : "My Leave Requests"}</h2>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                    <input
                                        type="search"
                                        aria-label="Search leave requests"
                                        placeholder={canViewAll ? "Search employee or reason" : "Search reason"}
                                        value={search}
                                        onChange={(event) => setFilter(setSearch)(event.target.value)}
                                        className={`${selectClass} w-56 pl-9`}
                                    />
                                </div>
                                <select aria-label="Month" value={month} onChange={(event) => setFilter(setMonth)(event.target.value)} className={selectClass}>
                                    <option value="">All months</option>
                                    {MONTH_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <select aria-label="Year" value={year} onChange={(event) => setFilter(setYear)(event.target.value)} className={selectClass}>
                                    <option value="">All years</option>
                                    {YEAR_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <select aria-label="Status" value={status} onChange={(event) => setFilter(setStatus)(event.target.value)} className={selectClass}>
                                    <option value="">All statuses</option>
                                    {["Pending", "Approved", "Rejected", "Cancelled"].map((value) => (
                                        <option key={value} value={value}>
                                            {value}
                                        </option>
                                    ))}
                                </select>
                                {filtered && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        {error ? (
                            <ErrorState message={error} onRetry={reload} />
                        ) : (
                            <DataTable
                                columns={columns}
                                rows={rows}
                                loading={loading}
                                empty={{
                                    icon: CalendarDays,
                                    title: filtered ? "No requests match these filters" : "No leave requests yet",
                                    action: filtered ? undefined : (
                                        <Button icon={Plus} onClick={() => setApplying(true)}>
                                            Apply Leave
                                        </Button>
                                    ),
                                }}
                            />
                        )}
                    </Card>

                    {pagination && (
                        <Pagination className="mt-6" currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={setPage} />
                    )}
                </>
            )}

            {applying && (
                <ApplyLeaveModal
                    balances={balances}
                    onClose={() => setApplying(false)}
                    onApplied={() => {
                        setApplying(false);
                        reload();
                        balanceRequest.reload();
                    }}
                />
            )}

            <ConfirmDialog
                open={!!action}
                onClose={() => setAction(null)}
                onConfirm={handleAction}
                loading={busy}
                tone={action?.type === "approve" ? "primary" : "danger"}
                title={{ approve: "Approve this leave?", reject: "Reject this leave?", cancel: "Cancel your leave request?" }[action?.type] || ""}
                confirmText={{ approve: "Approve", reject: "Reject", cancel: "Cancel request" }[action?.type]}
                message={
                    action
                        ? `${action.type === "cancel" ? "Your" : `${action.leave.user?.name}'s`} ${TYPE_LABEL[action.leave.type]} for ${formatDateRange(
                              action.leave.startDate,
                              action.leave.endDate
                          )}.`
                        : ""
                }
            />
        </div>
    );
};

export default LeavePage;
