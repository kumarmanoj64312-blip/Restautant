import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Lock, ShieldCheck, Users } from "lucide-react";
import { updateRolePermissions } from "../../../api/roleApi";
import { getErrorMessage } from "../../../api/client";
import { Alert, Badge, Button, Card, EmptyState, ErrorState, PageLoader, Switch } from "../../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { ROLE_TONE } from "../../../utils/constants";
import useRequest from "../../../hooks/useRequest";
import { MODULE_ICONS, fetchRoles, permissionKey } from "./roleModules";

// One module card: icon, title, "Select All", then a switch per action
const ModuleCard = ({ module, granted, editable, onChange }) => {
    const Icon = MODULE_ICONS[module.key] || ShieldCheck;
    const keys = module.actions.map((action) => permissionKey(module, action));
    const allOn = keys.every((key) => granted.includes(key));
    const anyOn = keys.some((key) => granted.includes(key));

    const setAll = (on) => onChange(on ? [...new Set([...granted, ...keys])] : granted.filter((key) => !keys.includes(key)));
    const setOne = (key, on) => onChange(on ? [...granted, key] : granted.filter((item) => item !== key));

    return (
        <div className={`rounded-2xl border bg-surface p-5 transition ${anyOn ? "border-brand/60 shadow-card" : "border-line"}`}>
            <div className="flex items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${anyOn ? "bg-brand-soft text-brand" : "bg-cream text-muted"}`}>
                    <Icon size={18} />
                </span>
                <div className="min-w-0">
                    <h3 className="font-semibold text-ink">{module.label}</h3>
                    <p className="text-xs text-muted">{module.description}</p>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-b border-line pb-3">
                <span className="text-sm font-semibold text-ink">Select All</span>
                <Switch checked={allOn} onChange={setAll} disabled={!editable} />
            </div>

            <ul className="mt-3 space-y-2.5">
                {module.actions.map((action) => {
                    const key = permissionKey(module, action);

                    return (
                        <li key={key} className="flex items-center justify-between gap-3">
                            <span className="text-sm text-ink">{action.label}</span>
                            <Switch checked={granted.includes(key)} onChange={(on) => setOne(key, on)} disabled={!editable} />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

const RolePermissionsPage = () => {
    const { role: roleKey } = useParams();
    const navigate = useNavigate();
    const { refreshPermissions } = useAuth();
    const { data, loading, error, reload, setData } = useRequest(fetchRoles);

    const [draft, setDraft] = useState(null); // permissions[] while editing
    const [saving, setSaving] = useState(false);

    const role = data?.roles?.find((item) => item.role === roleKey);
    const isAdminRole = roleKey === "admin";

    // Admin sees every module (all on); editable roles see the modules they can hold
    const modules = useMemo(() => {
        const all = data?.modules ?? [];
        if (!role) return [];
        return isAdminRole ? all : all.filter((module) => role.modules.includes(module.key));
    }, [data, role, isAdminRole]);

    if (loading) return <PageLoader />;
    if (error) return <ErrorState message={error} onRetry={reload} />;
    if (!role) {
        return (
            <EmptyState
                title="Role not found"
                action={
                    <Button to="/admin/roles" variant="outline">
                        Back to roles
                    </Button>
                }
            />
        );
    }

    const granted = draft ?? role.permissions;
    const dirty = draft !== null && [...draft].sort().join() !== [...role.permissions].sort().join();

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await updateRolePermissions(role.role, granted);
            const saved = response?.data?.permissions ?? granted;

            setData((prev) => ({
                ...prev,
                roles: prev.roles.map((item) => (item.role === role.role ? { ...item, permissions: saved } : item)),
            }));
            setDraft(null);
            refreshPermissions();
            toast.success(`${role.label} permissions saved. Staff get them on their next page load.`);
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not save permissions."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="pb-8">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/roles")}
                        aria-label="Back to roles"
                        className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:border-brand hover:text-brand"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{role.label} Permissions</h1>
                            <Badge tone={ROLE_TONE[role.role]}>
                                <Users size={12} /> {role.userCount} {role.userCount === 1 ? "account" : "accounts"}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted">Configure module level access</p>
                    </div>
                </div>

                {role.editable && (
                    <div className="flex gap-2">
                        {dirty && (
                            <Button variant="outline" onClick={() => setDraft(null)} disabled={saving}>
                                Discard
                            </Button>
                        )}
                        <Button onClick={handleSave} loading={saving} disabled={!dirty}>
                            Save Permissions
                        </Button>
                    </div>
                )}
            </div>

            {isAdminRole && (
                <Alert tone="info" className="mb-5">
                    Admins always have every permission, including Staff and Roles & Permissions. This can't be changed.
                </Alert>
            )}
            {role.role === "kitchen" && (
                <Alert tone="info" className="mb-5">
                    Kitchen staff can only be given kitchen permissions.
                </Alert>
            )}

            {role.role === "customer" ? (
                <Card>
                    <EmptyState
                        icon={Lock}
                        title="Customers have no staff permissions"
                        description="They can order on the website and manage their own profile and orders. This role is fixed."
                    />
                </Card>
            ) : (
                <Card padding="none">
                    <div className="border-b border-line px-5 py-4 sm:px-6">
                        <h2 className="font-bold text-ink">Module Permissions</h2>
                    </div>

                    <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
                        {modules.map((module) => (
                            <ModuleCard
                                key={module.key}
                                module={module}
                                granted={isAdminRole ? modules.flatMap((item) => item.actions.map((action) => permissionKey(item, action))) : granted}
                                editable={role.editable && !saving}
                                onChange={setDraft}
                            />
                        ))}

                        {/* Never grantable: always admin only */}
                        <div className="rounded-2xl border border-dashed border-line bg-canvas/60 p-5">
                            <div className="flex items-start gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream text-muted">
                                    <Lock size={18} />
                                </span>
                                <div>
                                    <h3 className="font-semibold text-ink">Admin only</h3>
                                    <p className="text-xs text-muted">Can't be given to other roles</p>
                                </div>
                            </div>
                            <ul className="mt-4 space-y-2.5 border-t border-line pt-3">
                                {(data?.adminOnly ?? []).map((item) => (
                                    <li key={item.key} className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-ink">{item.label}</span>
                                        <Switch checked={isAdminRole} disabled onChange={() => {}} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default RolePermissionsPage;
