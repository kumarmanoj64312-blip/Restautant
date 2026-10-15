import { useMemo, useState } from "react";
import { ChefHat, Lock, Pencil, RefreshCw, Search, ShieldCheck, Trash2, Unlock, UserCog, UserPlus, Users } from "lucide-react";
import toast from "react-hot-toast";

import { deleteStaff, getStaff, updateStaff } from "../../../api/staffApi";
import { getErrorMessage, unwrapList } from "../../../api/client";
import {
    Avatar,
    Badge,
    Button,
    Card,
    ConfirmDialog,
    DataTable,
    ErrorState,
    Input,
    PageHeader,
    StatCard,
    StatusBadge,
    Tabs,
} from "../../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { ROLE_LABELS, ROLE_TONE, ROLES } from "../../../utils/constants";
import { formatDateTime } from "../../../utils/format";
import useRequest from "../../../hooks/useRequest";
import AddStaffModal from "./AddStaffModal";
import EditStaffModal from "./EditStaffModal";
import { matchesStaffSearch } from "./staffUtils";

const fetchStaff = async () => unwrapList(await getStaff());

const StaffPage = () => {
    const { user: currentUser } = useAuth();
    const currentId = currentUser?._id;

    const [tab, setTab] = useState("all");
    const [search, setSearch] = useState("");
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState(null);
    const [toBlock, setToBlock] = useState(null);
    const [toDelete, setToDelete] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const { data, loading, refreshing, error, reload, setData } = useRequest(fetchStaff);
    const staff = useMemo(() => data ?? [], [data]);

    const counts = useMemo(() => {
        const byRole = (role) => staff.filter((member) => member.role === role).length;
        return { all: staff.length, admin: byRole(ROLES.ADMIN), manager: byRole(ROLES.MANAGER), kitchen: byRole(ROLES.KITCHEN) };
    }, [staff]);

    const visible = useMemo(
        () => staff.filter((member) => (tab === "all" || member.role === tab) && matchesStaffSearch(member, search)),
        [staff, tab, search]
    );

    // Put a saved member back in the list (or drop them if they're no longer staff)
    const applySaved = (saved) => {
        if (!saved?._id) {
            reload();
            return;
        }

        setData((prev) => {
            const list = prev || [];
            const exists = list.some((member) => member._id === saved._id);

            if (saved.role === ROLES.CUSTOMER) return list.filter((member) => member._id !== saved._id);
            if (exists) return list.map((member) => (member._id === saved._id ? saved : member));
            return [saved, ...list];
        });
    };

    const handleToggleBlock = async (member) => {
        setBusyId(member._id);

        try {
            const response = await updateStaff(member._id, { isBlocked: !member.isBlocked });
            applySaved(response?.data);
            toast.success(member.isBlocked ? `${member.name} can log in again.` : `${member.name} is blocked.`);
            setToBlock(null);
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not update the staff member."));
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async () => {
        if (!toDelete) return;
        setBusyId(toDelete._id);

        try {
            await deleteStaff(toDelete._id);
            setData((prev) => (prev || []).filter((member) => member._id !== toDelete._id));
            toast.success(`${toDelete.name} was removed.`);
            setToDelete(null);
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not remove the staff member."));
        } finally {
            setBusyId(null);
        }
    };

    const columns = [
        {
            key: "member",
            header: "Staff member",
            render: (member) => (
                <div className="flex items-center gap-3">
                    <Avatar src={member.avatar?.url} name={member.name} size={38} />
                    <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate font-semibold text-ink">
                            {member.name}
                            {member._id === currentId && <Badge tone="brand">You</Badge>}
                        </p>
                        <p className="truncate text-xs text-muted">{member.email}</p>
                    </div>
                </div>
            ),
        },
        { key: "phone", header: "Phone", className: "whitespace-nowrap", render: (member) => member.phone || "—" },
        {
            key: "role",
            header: "Role",
            render: (member) => <Badge tone={ROLE_TONE[member.role]}>{ROLE_LABELS[member.role] || member.role}</Badge>,
        },
        {
            key: "status",
            header: "Status",
            render: (member) => <StatusBadge status={member.isBlocked ? "Blocked" : "Active"} />,
        },
        {
            key: "lastLogin",
            header: "Last login",
            className: "whitespace-nowrap text-muted",
            render: (member) => (member.lastLogin ? formatDateTime(member.lastLogin) : "Never"),
        },
        {
            key: "actions",
            header: "",
            align: "right",
            render: (member) => {
                const isSelf = member._id === currentId;

                return (
                    <div className="flex justify-end gap-1">
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            icon={Pencil}
                            aria-label={`Edit ${member.name}`}
                            title="Edit"
                            disabled={busyId === member._id}
                            onClick={() => setEditing(member)}
                        />
                        {!isSelf && (
                            <>
                                <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    icon={member.isBlocked ? Unlock : Lock}
                                    aria-label={member.isBlocked ? `Unblock ${member.name}` : `Block ${member.name}`}
                                    title={member.isBlocked ? "Unblock" : "Block"}
                                    loading={busyId === member._id && !toBlock && !toDelete}
                                    disabled={busyId === member._id}
                                    onClick={() => (member.isBlocked ? handleToggleBlock(member) : setToBlock(member))}
                                />
                                <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    icon={Trash2}
                                    className="text-danger hover:bg-red-50"
                                    aria-label={`Remove ${member.name}`}
                                    title="Remove"
                                    disabled={busyId === member._id}
                                    onClick={() => setToDelete(member)}
                                />
                            </>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div>
            <PageHeader
                eyebrow="People"
                title="Staff"
                description="Restaurant team accounts and the role each person has."
                actions={
                    <>
                        <Button variant="outline" icon={RefreshCw} loading={refreshing} onClick={reload}>
                            Refresh
                        </Button>
                        <Button icon={UserPlus} onClick={() => setAdding(true)}>
                            Add staff
                        </Button>
                    </>
                }
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total staff" value={loading ? "—" : counts.all} icon={Users} />
                <StatCard label="Admins" value={loading ? "—" : counts.admin} icon={ShieldCheck} tone="danger" />
                <StatCard label="Managers" value={loading ? "—" : counts.manager} icon={UserCog} tone="info" />
                <StatCard label="Kitchen staff" value={loading ? "—" : counts.kitchen} icon={ChefHat} tone="warning" />
            </div>

            <Tabs
                className="mb-4"
                value={tab}
                onChange={setTab}
                items={[
                    { value: "all", label: "All", count: counts.all },
                    { value: ROLES.ADMIN, label: "Admins", count: counts.admin },
                    { value: ROLES.MANAGER, label: "Managers", count: counts.manager },
                    { value: ROLES.KITCHEN, label: "Kitchen", count: counts.kitchen },
                ]}
            />

            <Card padding="none" className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
                    <Input
                        icon={Search}
                        type="search"
                        aria-label="Search staff"
                        placeholder="Search by name, email or phone"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full sm:max-w-sm"
                    />
                    <Button to="/admin/roles" variant="ghost" size="sm" icon={ShieldCheck}>
                        What can each role do?
                    </Button>
                </div>

                {error ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : (
                    <DataTable
                        columns={columns}
                        rows={visible}
                        loading={loading}
                        empty={{
                            icon: UserCog,
                            title: search ? "No matching staff" : "No staff in this group",
                            description: search ? "Try a different name or email." : "Use \"Add staff\" to add a team member.",
                        }}
                    />
                )}
            </Card>

            {adding && (
                <AddStaffModal
                    onClose={() => setAdding(false)}
                    onAdded={(saved) => {
                        applySaved(saved);
                        setAdding(false);
                    }}
                />
            )}

            {editing && (
                <EditStaffModal
                    member={editing}
                    isSelf={editing._id === currentId}
                    onClose={() => setEditing(null)}
                    onSaved={(saved) => {
                        applySaved(saved);
                        setEditing(null);
                    }}
                />
            )}

            <ConfirmDialog
                open={!!toBlock}
                onClose={() => setToBlock(null)}
                onConfirm={() => handleToggleBlock(toBlock)}
                loading={!!toBlock && busyId === toBlock._id}
                title="Block this staff member?"
                confirmText="Block"
                message={toBlock ? `${toBlock.name} won't be able to log in until you unblock them.` : ""}
            />

            <ConfirmDialog
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={handleDelete}
                loading={!!toDelete && busyId === toDelete._id}
                title="Remove this staff member?"
                confirmText="Delete account"
                message={
                    toDelete
                        ? `${toDelete.name}'s account will be permanently deleted. To keep the account but remove staff access, edit them and set the role to Customer instead.`
                        : ""
                }
            />
        </div>
    );
};

export default StaffPage;
