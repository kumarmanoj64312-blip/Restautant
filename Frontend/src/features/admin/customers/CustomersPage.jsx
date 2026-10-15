import { useMemo, useState } from "react";
import { Lock, RefreshCw, Search, Trash2, Unlock, UserCog, Users } from "lucide-react";
import toast from "react-hot-toast";

import { deleteUser, getUsers, toggleBlockUser } from "../../../api/authApi";
import { getErrorMessage, unwrapList } from "../../../api/client";
import {
    Alert,
    Avatar,
    Button,
    Card,
    ConfirmDialog,
    DataTable,
    ErrorState,
    Input,
    PageHeader,
    StatusBadge,
    Tabs,
} from "../../../components/ui";
import { ROLES } from "../../../utils/constants";
import { formatDate, formatDateTime } from "../../../utils/format";
import useRequest from "../../../hooks/useRequest";

// Staff accounts are managed on the Staff page
const fetchCustomers = async () => unwrapList(await getUsers()).filter((user) => user.role === ROLES.CUSTOMER);

const matchesSearch = (user, term) => {
    const query = term.trim().toLowerCase();
    if (!query) return true;
    return [user.name, user.email, user.phone].filter(Boolean).some((value) => value.toLowerCase().includes(query));
};

const CustomersPage = () => {
    const [tab, setTab] = useState("all");
    const [search, setSearch] = useState("");
    const [toBlock, setToBlock] = useState(null);
    const [toDelete, setToDelete] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const { data, loading, refreshing, error, reload, setData } = useRequest(fetchCustomers);
    const users = useMemo(() => data ?? [], [data]);

    const counts = useMemo(() => {
        const blocked = users.filter((user) => user.isBlocked).length;
        return { all: users.length, active: users.length - blocked, blocked };
    }, [users]);

    const visibleUsers = useMemo(
        () =>
            users.filter((user) => {
                if (tab === "active" && user.isBlocked) return false;
                if (tab === "blocked" && !user.isBlocked) return false;
                return matchesSearch(user, search);
            }),
        [users, tab, search]
    );

    const patchUser = (id, updates) =>
        setData((prev) => (prev || []).map((user) => (user._id === id ? { ...user, ...updates } : user)));

    const handleToggleBlock = async (user) => {
        setBusyId(user._id);

        try {
            const res = await toggleBlockUser(user._id);
            const isBlocked = res?.data?.isBlocked ?? !user.isBlocked;
            patchUser(user._id, { isBlocked });
            toast.success(res?.message || (isBlocked ? "User blocked." : "User unblocked."));
            setToBlock(null);
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not update the user."));
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async () => {
        if (!toDelete) return;
        setBusyId(toDelete._id);

        try {
            await deleteUser(toDelete._id);
            setData((prev) => (prev || []).filter((user) => user._id !== toDelete._id));
            toast.success(`${toDelete.name} was deleted.`);
            setToDelete(null);
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not delete the user."));
        } finally {
            setBusyId(null);
        }
    };

    const columns = [
        {
            key: "user",
            header: "Customer",
            render: (user) => (
                <div className="flex items-center gap-3">
                    <Avatar src={user.avatar?.url} name={user.name} size={38} />
                    <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate font-semibold text-ink">
                            {user.name}
                        </p>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                </div>
            ),
        },
        { key: "phone", header: "Phone", className: "whitespace-nowrap", render: (user) => user.phone || "—" },
        {
            key: "status",
            header: "Status",
            render: (user) => <StatusBadge status={user.isBlocked ? "Blocked" : "Active"} />,
        },
        {
            key: "joined",
            header: "Joined",
            className: "whitespace-nowrap text-muted",
            render: (user) => formatDate(user.createdAt),
        },
        {
            key: "lastLogin",
            header: "Last login",
            className: "whitespace-nowrap text-muted",
            render: (user) => (user.lastLogin ? formatDateTime(user.lastLogin) : "Never"),
        },
        {
            key: "actions",
            header: "",
            align: "right",
            render: (user) => (
                    <div className="flex justify-end gap-1">
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            icon={user.isBlocked ? Unlock : Lock}
                            aria-label={user.isBlocked ? "Unblock user" : "Block user"}
                            title={user.isBlocked ? "Unblock user" : "Block user"}
                            loading={busyId === user._id && !toBlock && !toDelete}
                            disabled={busyId === user._id}
                            onClick={() => (user.isBlocked ? handleToggleBlock(user) : setToBlock(user))}
                        />
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            icon={Trash2}
                            className="text-danger hover:bg-red-50"
                            aria-label="Delete user"
                            title="Delete user"
                            disabled={busyId === user._id}
                            onClick={() => setToDelete(user)}
                        />
                    </div>
                ),
        },
    ];

    return (
        <div>
            <PageHeader
                eyebrow="People"
                title="Customers"
                description="Website customer accounts. Block or remove them here."
                actions={
                    <Button variant="outline" icon={RefreshCw} loading={refreshing} onClick={reload}>
                        Refresh
                    </Button>
                }
            />

            <Alert tone="info" className="mb-5 flex items-start gap-3">
                <UserCog size={18} className="mt-0.5 shrink-0" />
                <span>
                    To give a customer a staff role, go to <strong>Staff → Add staff → Existing account</strong>.
                </span>
            </Alert>

            <Tabs
                className="mb-4"
                value={tab}
                onChange={setTab}
                items={[
                    { value: "all", label: "All", count: counts.all },
                    { value: "active", label: "Active", count: counts.active },
                    { value: "blocked", label: "Blocked", count: counts.blocked },
                ]}
            />

            <Card padding="none" className="overflow-hidden">
                <div className="border-b border-line p-4">
                    <Input
                        icon={Search}
                        type="search"
                        aria-label="Search customers"
                        placeholder="Search by name, email or phone"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full sm:max-w-sm"
                    />
                </div>

                {error ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : (
                    <DataTable
                        columns={columns}
                        rows={visibleUsers}
                        loading={loading}
                        empty={{
                            icon: Users,
                            title: search ? "No matching customers" : "No customers here yet",
                            description: search ? "Try a different name or email." : undefined,
                        }}
                    />
                )}
            </Card>

            <ConfirmDialog
                open={!!toBlock}
                onClose={() => setToBlock(null)}
                onConfirm={() => handleToggleBlock(toBlock)}
                loading={!!toBlock && busyId === toBlock._id}
                title="Block this user?"
                confirmText="Block"
                message={toBlock ? `${toBlock.name} will be signed out and won't be able to log in until unblocked.` : ""}
            />

            <ConfirmDialog
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={handleDelete}
                loading={!!toDelete && busyId === toDelete._id}
                title="Delete this user?"
                message={toDelete ? `${toDelete.name} (${toDelete.email}) will be permanently deleted. This cannot be undone.` : ""}
            />
        </div>
    );
};

export default CustomersPage;
