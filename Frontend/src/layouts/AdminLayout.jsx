import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import Sidebar from "./admin/Sidebar";
import { Avatar } from "../components/ui";
import { useAuth } from "../features/auth/AuthContext";
import { ROLE_LABELS } from "../utils/constants";

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="flex min-h-screen bg-canvas">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                        className="rounded-xl border border-line p-2 lg:hidden"
                    >
                        <Menu size={20} />
                    </button>

                    <p className="hidden text-sm text-muted sm:block">
                        Welcome back, <span className="font-semibold text-ink">{user?.name?.split(" ")[0]}</span>
                    </p>

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold leading-tight">{user?.name}</p>
                            <p className="text-xs text-muted">{ROLE_LABELS[user?.role] || user?.role}</p>
                        </div>
                        <Avatar name={user?.name} src={user?.avatar?.url} size={36} />
                        <button
                            type="button"
                            onClick={handleLogout}
                            aria-label="Log out"
                            title="Log out"
                            className="rounded-xl border border-line p-2 text-muted transition hover:border-red-200 hover:bg-red-50 hover:text-danger"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="w-full animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
