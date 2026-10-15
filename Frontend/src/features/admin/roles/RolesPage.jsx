import { Link } from "react-router-dom";
import { ArrowRight, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge, Button, ErrorState, PageHeader, PageLoader } from "../../../components/ui";
import { ROLE_TONE } from "../../../utils/constants";
import useRequest from "../../../hooks/useRequest";
import { fetchRoles } from "./roleModules";

// Number of permissions a role could hold vs. has
const countFor = (role, modules) => {
    const available = role.role === "admin" ? modules : modules.filter((module) => role.modules.includes(module.key));
    const total = available.reduce((sum, module) => sum + module.actions.length, 0);
    const granted = available.reduce(
        (sum, module) => sum + module.actions.filter((action) => role.permissions.includes(`${module.key}.${action.key}`)).length,
        0
    );
    return { granted, total };
};

const RolesPage = () => {
    const { data, loading, refreshing, error, reload } = useRequest(fetchRoles);

    if (loading) return <PageLoader />;
    if (error) return <ErrorState message={error} onRetry={reload} />;

    const modules = data?.modules ?? [];

    return (
        <div>
            <PageHeader
                eyebrow="People"
                title="Roles & Permissions"
                description="Choose a role to see or change what it can do."
                actions={
                    <Button variant="outline" icon={RefreshCw} loading={refreshing} onClick={reload}>
                        Refresh
                    </Button>
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {(data?.roles ?? []).map((role) => {
                    const { granted, total } = countFor(role, modules);

                    return (
                        <Link
                            key={role.role}
                            to={`/admin/roles/${role.role}`}
                            className="group flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lift"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <Badge tone={ROLE_TONE[role.role]}>{role.label}</Badge>
                                <span className="text-xs font-semibold text-muted">
                                    {role.userCount} {role.userCount === 1 ? "account" : "accounts"}
                                </span>
                            </div>

                            <p className="mt-3 flex-1 text-sm text-muted">{role.description}</p>

                            {total > 0 && (
                                <div className="mt-4">
                                    <div className="mb-1 flex justify-between text-xs font-semibold text-muted">
                                        <span>Permissions</span>
                                        <span>
                                            {granted} of {total}
                                        </span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-cream">
                                        <div className="h-full rounded-full bg-brand" style={{ width: `${(granted / total) * 100}%` }} />
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs font-semibold">
                                <span className="flex items-center gap-1.5 text-muted">
                                    {role.editable ? (
                                        <>
                                            <ShieldCheck size={14} className="text-brand" /> Customisable
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={14} /> Fixed
                                        </>
                                    )}
                                </span>
                                <span className="flex items-center gap-1 text-brand">
                                    {role.editable ? "Manage" : "View"}
                                    <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default RolesPage;
