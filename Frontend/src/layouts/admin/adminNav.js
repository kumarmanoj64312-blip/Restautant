import {
    BarChart3,
    CalendarDays,
    ChefHat,
    Clock,
    CreditCard,
    Image,
    LayoutDashboard,
    Monitor,
    Receipt,
    Settings,
    ShieldCheck,
    Tags,
    UserCog,
    Users,
    UtensilsCrossed,
} from "lucide-react";
import { PAGE_ACCESS, PERMISSIONS } from "../../utils/constants";

/**
 * Admin sidebar. Each item needs a `permission` (one key, or a list meaning
 * "any of"; managers can be granted it), `adminOnly: true` (never available
 * to managers) or `allStaff: true` (every staff member, incl. kitchen).
 * The backend enforces the same rules on every API route.
 */
const ADMIN_NAV = [
    {
        title: "Overview",
        items: [{ label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_READ }],
    },
    {
        title: "Sales",
        items: [
            { label: "Orders", to: "/admin/orders", icon: Receipt, permission: PERMISSIONS.ORDERS_READ },
            { label: "Payments", to: "/admin/payments", icon: CreditCard, permission: PERMISSIONS.PAYMENTS_READ },
        ],
    },
    {
        title: "Catalogue",
        items: [
            { label: "Menu items", to: "/admin/menu", icon: UtensilsCrossed, permission: PAGE_ACCESS.menu },
            { label: "Categories", to: "/admin/categories", icon: Tags, permission: PAGE_ACCESS.categories },
            { label: "Hero banners", to: "/admin/hero", icon: Image, permission: PAGE_ACCESS.banners },
        ],
    },
    {
        title: "People",
        items: [
            { label: "Customers", to: "/admin/customers", icon: Users, adminOnly: true },
            { label: "Staff", to: "/admin/staff", icon: UserCog, adminOnly: true },
            { label: "Roles & Permissions", to: "/admin/roles", icon: ShieldCheck, adminOnly: true },
        ],
    },
    {
        title: "HR",
        items: [
            { label: "Attendance", to: "/admin/attendance", icon: Clock, allStaff: true },
            { label: "Attendance Report", to: "/admin/attendance-report", icon: BarChart3, permission: PERMISSIONS.ATTENDANCE_READ },
            { label: "Leave", to: "/admin/leave", icon: CalendarDays, allStaff: true },
        ],
    },
    {
        title: "Configuration",
        items: [{ label: "Settings", to: "/admin/settings", icon: Settings, permission: PAGE_ACCESS.settings }],
    },
    {
        title: "Operations",
        items: [
            { label: "POS", to: "/pos", icon: Monitor, permission: PERMISSIONS.POS_ACCESS },
            { label: "Kitchen", to: "/kitchen", icon: ChefHat, permission: PERMISSIONS.KITCHEN_READ },
        ],
    },
];

const canSeeNavItem = (item, { isAdmin, isStaff, can }) => {
    if (item.allStaff) return isStaff;
    if (item.adminOnly) return isAdmin;
    return can(item.permission);
};

// Sidebar groups with only the items this user may open (empty groups removed)
export const getVisibleNav = (auth) =>
    ADMIN_NAV.map((group) => ({
        ...group,
        items: group.items.filter((item) => canSeeNavItem(item, auth)),
    })).filter((group) => group.items.length > 0);

// First page this user may open (used for /admin and after login)
export const getFirstAllowedPath = (auth) => getVisibleNav(auth)[0]?.items[0]?.to || null;
