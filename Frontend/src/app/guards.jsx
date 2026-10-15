import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { Button, EmptyState, PageLoader } from "../components/ui";
import { getFirstAllowedPath } from "../layouts/admin/adminNav";
import { getRoleHomePath } from "../utils/format";

// Any logged-in user. Remembers where they were going.
export const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
};

// Login/register: logged-in users are sent to their home page
export const GuestRoute = () => {
    const { isAuthenticated, user } = useAuth();

    if (isAuthenticated) {
        return <Navigate to={getRoleHomePath(user?.role)} replace />;
    }

    return <Outlet />;
};

// <Route element={<RoleRoute allowedRoles={["admin", "manager"]} />}>
export const RoleRoute = ({ allowedRoles = [] }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!allowedRoles.includes(user?.role)) {
        return <Navigate to={getRoleHomePath(user?.role)} replace />;
    }

    return <Outlet />;
};

const AccessDenied = () => (
    <EmptyState
        icon={ShieldX}
        title="You don't have access to this page"
        description="Ask an administrator if you need it."
        action={<Button to="/admin" variant="outline">Go to my dashboard</Button>}
    />
);

/**
 * Page-level check inside an already role-guarded area.
 * <Route element={<PermissionRoute permission={PERMISSIONS.ORDERS_READ} />}>
 * <Route element={<PermissionRoute permission={[...]} />}>   // any of
 * <Route element={<PermissionRoute adminOnly />}>
 */
export const PermissionRoute = ({ permission, adminOnly = false }) => {
    const { isAdmin, can, permissionsLoading } = useAuth();

    if (permissionsLoading) return <PageLoader />;

    const allowed = adminOnly ? isAdmin : can(permission);

    return allowed ? <Outlet /> : <AccessDenied />;
};

// /admin: open the first page this user is allowed to see
export const AdminHome = () => {
    const auth = useAuth();

    if (auth.permissionsLoading) return <PageLoader />;

    const path = getFirstAllowedPath(auth);

    return path ? <Navigate to={path} replace /> : <AccessDenied />;
};
