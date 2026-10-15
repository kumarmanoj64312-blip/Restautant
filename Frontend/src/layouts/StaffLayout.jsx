import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarDays, ChefHat, LayoutDashboard, LogOut, Monitor } from "lucide-react";
import Logo from "../components/brand/Logo";
import { Avatar } from "../components/ui";
import { useAuth } from "../features/auth/AuthContext";
import { PERMISSIONS, ROLE_LABELS, ROLES } from "../utils/constants";

// Full-width shell for POS and kitchen screens
const StaffLayout = () => {
    const { user, logout, can } = useAuth();
    const navigate = useNavigate();
    const role = user?.role;

    // Only show switches this user is allowed to open
    const links = [
        can(PERMISSIONS.POS_ACCESS) && { label: "POS", to: "/pos", icon: Monitor },
        can(PERMISSIONS.KITCHEN_READ) && { label: "Kitchen", to: "/kitchen", icon: ChefHat },
        [ROLES.ADMIN, ROLES.MANAGER].includes(role) && { label: "Admin", to: "/admin", icon: LayoutDashboard },
        role === ROLES.KITCHEN && { label: "Attendance & Leave", to: "/admin/attendance", icon: CalendarDays },
    ].filter(Boolean);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="flex min-h-screen flex-col bg-canvas">
            <header className="sticky top-0 z-30 border-b border-line bg-surface">
                <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
                    <div className="flex items-center gap-6">
                        <Logo to={links[0]?.to || "/"} compact />

                        {links.length > 1 && (
                            <nav className="flex gap-1 rounded-xl bg-canvas p-1" aria-label="Staff">
                                {links.map(({ label, to, icon: Icon }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                                                isActive ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink"
                                            }`
                                        }
                                    >
                                        <Icon size={16} />
                                        <span className="hidden sm:inline">{label}</span>
                                    </NavLink>
                                ))}
                            </nav>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold leading-tight">{user?.name}</p>
                            <p className="text-xs text-muted">{ROLE_LABELS[role] || role}</p>
                        </div>
                        <Avatar name={user?.name} src={user?.avatar?.url} size={36} />
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-danger"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Log out</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 flex-col">
                <Outlet />
            </main>
        </div>
    );
};

export default StaffLayout;
