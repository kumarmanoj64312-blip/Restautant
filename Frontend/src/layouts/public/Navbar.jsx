import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogOut, Menu, Package, ShoppingBag, User, X } from "lucide-react";
import Logo from "../../components/brand/Logo";
import { Avatar, Button } from "../../components/ui";
import { useAuth } from "../../features/auth/AuthContext";
import { useCart } from "../../features/cart/CartContext";
import { getRoleHomePath } from "../../utils/format";

const NAV_LINKS = [
    { label: "Home", to: "/" },
    { label: "Menu", to: "/menu" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
];

const linkClass = ({ isActive }) =>
    `relative py-2 text-sm font-semibold transition ${
        isActive ? "text-brand" : "text-ink/75 hover:text-ink"
    }`;

const Navbar = () => {
    const { user, isAuthenticated, isStaff, logout } = useAuth();
    const { count } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const accountRef = useRef(null);

    // Close menus when the route changes
    const [lastPath, setLastPath] = useState(location.pathname);
    if (lastPath !== location.pathname) {
        setLastPath(location.pathname);
        setMobileOpen(false);
        setAccountOpen(false);
    }

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (!accountOpen) return undefined;

        const onClick = (event) => {
            if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
        };

        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [accountOpen]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const accountLinks = isStaff
        ? [{ label: "Staff dashboard", to: getRoleHomePath(user?.role), icon: LayoutDashboard }]
        : [
              { label: "My profile", to: "/profile", icon: User },
              { label: "My orders", to: "/orders", icon: Package },
          ];

    return (
        <header
            className={`sticky top-0 z-50 border-b transition ${
                scrolled ? "border-line bg-surface/95 shadow-sm backdrop-blur" : "border-transparent bg-canvas"
            }`}
        >
            <div className="container-page flex h-[72px] items-center justify-between gap-4">
                <Logo />

                <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
                    {NAV_LINKS.map((link) => (
                        <NavLink key={link.to} to={link.to} end={link.to === "/"} className={linkClass}>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    {!isStaff && (
                        <Link
                            to="/cart"
                            aria-label={`Cart, ${count} items`}
                            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:border-brand hover:text-brand"
                        >
                            <ShoppingBag size={19} />
                            {count > 0 && (
                                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                                    {count > 99 ? "99+" : count}
                                </span>
                            )}
                        </Link>
                    )}

                    {isAuthenticated ? (
                        <div ref={accountRef} className="relative hidden lg:block">
                            <button
                                type="button"
                                onClick={() => setAccountOpen((open) => !open)}
                                aria-expanded={accountOpen}
                                className="flex items-center gap-2 rounded-xl border border-line bg-surface py-1 pl-1 pr-2.5 transition hover:border-brand"
                            >
                                <Avatar name={user?.name} src={user?.avatar?.url} size={32} />
                                <span className="max-w-28 truncate text-sm font-semibold">{user?.name?.split(" ")[0]}</span>
                                <ChevronDown size={16} className={`text-muted transition ${accountOpen ? "rotate-180" : ""}`} />
                            </button>

                            {accountOpen && (
                                <div className="absolute right-0 mt-2 w-56 animate-fade-in overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-lift">
                                    <div className="border-b border-line px-3 py-2.5">
                                        <p className="truncate text-sm font-bold">{user?.name}</p>
                                        <p className="truncate text-xs text-muted">{user?.email}</p>
                                    </div>
                                    {accountLinks.map(({ label, to, icon: Icon }) => (
                                        <Link
                                            key={to}
                                            to={to}
                                            className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink hover:bg-cream"
                                        >
                                            <Icon size={16} className="text-muted" />
                                            {label}
                                        </Link>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-danger hover:bg-red-50"
                                    >
                                        <LogOut size={16} />
                                        Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Button to="/login" variant="ghost" className="hidden lg:inline-flex">
                            Log in
                        </Button>
                    )}

                    <Button to="/menu" className="hidden sm:inline-flex">
                        Order now
                    </Button>

                    <button
                        type="button"
                        onClick={() => setMobileOpen((open) => !open)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileOpen}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface lg:hidden"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="animate-fade-in border-t border-line bg-surface lg:hidden">
                    <nav className="container-page flex flex-col py-3" aria-label="Mobile">
                        {NAV_LINKS.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.to === "/"}
                                className={({ isActive }) =>
                                    `rounded-xl px-3 py-3 text-base font-semibold ${isActive ? "bg-brand-soft text-brand-dark" : "text-ink"}`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}

                        <div className="my-2 h-px bg-line" />

                        {isAuthenticated ? (
                            <>
                                {accountLinks.map(({ label, to, icon: Icon }) => (
                                    <Link key={to} to={to} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-ink">
                                        <Icon size={18} className="text-muted" />
                                        {label}
                                    </Link>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-danger"
                                >
                                    <LogOut size={18} />
                                    Log out
                                </button>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <Button to="/login" variant="outline">
                                    Log in
                                </Button>
                                <Button to="/register">Sign up</Button>
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Navbar;
