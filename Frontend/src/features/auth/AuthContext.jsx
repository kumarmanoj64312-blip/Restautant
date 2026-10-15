import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { logoutUser } from "../../api/authApi";
import { getMyPermissions } from "../../api/roleApi";
import { ROLES } from "../../utils/constants";

const AuthContext = createContext(undefined);

// Restore the session saved by login()
const readStoredUser = () => {
    try {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        return token && storedUser ? JSON.parse(storedUser) : null;
    } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return null;
    }
};

// Admins can do everything and customers have no staff permissions,
// so only managers and kitchen staff need their permissions fetched.
const needsPermissionFetch = (user) =>
    !!user && user.role !== ROLES.ADMIN && user.role !== ROLES.CUSTOMER;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(readStoredUser);

    // Permissions belong to one user; a mismatch means they are still loading
    const [permissionState, setPermissionState] = useState({ userId: null, list: [] });
    const [permissionVersion, setPermissionVersion] = useState(0);

    const userId = user?._id;
    const userRole = user?.role;

    useEffect(() => {
        if (!needsPermissionFetch({ role: userRole }) || !userId) return undefined;

        let active = true;

        getMyPermissions()
            .then((response) => {
                if (active) {
                    setPermissionState({ userId, list: response?.data?.permissions || [] });
                }
            })
            .catch(() => {
                if (active) setPermissionState({ userId, list: [] });
            });

        return () => {
            active = false;
        };
    }, [userId, userRole, permissionVersion]);

    const login = useCallback((userData, token) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        // Tell the server, but never block the UI on it
        if (localStorage.getItem("token")) {
            logoutUser().catch(() => {});
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    }, []);

    // Merge fresh profile data (e.g. after editing the profile)
    const updateUser = useCallback((updates) => {
        setUser((prev) => {
            const next = { ...prev, ...updates };
            localStorage.setItem("user", JSON.stringify(next));
            return next;
        });
    }, []);

    // Re-read permissions (e.g. after an admin edits the manager role)
    const refreshPermissions = useCallback(() => setPermissionVersion((version) => version + 1), []);

    const value = useMemo(() => {
        const isAdmin = userRole === ROLES.ADMIN;
        const permissionsLoading = needsPermissionFetch(user) && permissionState.userId !== userId;
        const permissions = permissionState.userId === userId ? permissionState.list : [];

        return {
            user,
            // Kept for guards that show a loader; the session is restored synchronously
            loading: false,
            isAuthenticated: !!user,
            role: userRole,
            isAdmin,
            isCustomer: userRole === ROLES.CUSTOMER,
            isStaff: !!user && userRole !== ROLES.CUSTOMER,
            permissions,
            permissionsLoading,
            // can("menu.create") or can([...]) for "any of" — the backend enforces the same rules
            can: (permission) => isAdmin || [].concat(permission).some((key) => permissions.includes(key)),
            login,
            logout,
            updateUser,
            refreshPermissions,
        };
    }, [user, userId, userRole, permissionState, login, logout, updateUser, refreshPermissions]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
};
