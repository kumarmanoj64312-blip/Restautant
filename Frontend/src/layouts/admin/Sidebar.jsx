import { NavLink } from "react-router-dom";
import { ExternalLink, X } from "lucide-react";
import Logo from "../../components/brand/Logo";
import { useAuth } from "../../features/auth/AuthContext";
import { ROLE_LABELS } from "../../utils/constants";
import { getVisibleNav } from "./adminNav";

const Sidebar = ({ open, onClose }) => {
    const auth = useAuth();
    const groups = getVisibleNav(auth);

    return (
        <>
            {/* Mobile backdrop */}
            {open && <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={onClose} />}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-surface transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-line px-5">
                    <Logo to="/admin" />
                    <button type="button" onClick={onClose} aria-label="Close menu" className="rounded-lg p-1.5 text-muted hover:bg-cream lg:hidden">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin">
                    {auth.permissionsLoading ? (
                        <div className="space-y-2 px-1">
                            {[...Array(6)].map((_, index) => (
                                <div key={index} className="h-9 animate-pulse rounded-xl bg-cream" />
                            ))}
                        </div>
                    ) : (
                        groups.map((group) => (
                            <div key={group.title}>
                                <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-muted/80">{group.title}</p>
                                <div className="space-y-0.5">
                                    {group.items.map(({ label, to, icon: Icon, adminOnly }) => (
                                        <NavLink
                                            key={to}
                                            to={to}
                                            onClick={onClose}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                                                    isActive ? "bg-brand-soft text-brand-dark" : "text-ink/75 hover:bg-cream hover:text-ink"
                                                }`
                                            }
                                        >
                                            <Icon size={18} />
                                            <span className="flex-1">{label}</span>
                                            {adminOnly && (
                                                <span className="rounded-md bg-cream px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                                                    Admin
                                                </span>
                                            )}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </nav>

                <div className="border-t border-line p-3">
                    <p className="mb-1 px-3 text-xs text-muted">
                        Signed in as <span className="font-semibold text-ink">{ROLE_LABELS[auth.role] || auth.role}</span>
                    </p>
                    <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/75 hover:bg-cream hover:text-ink"
                    >
                        <ExternalLink size={18} />
                        View website
                    </a>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
