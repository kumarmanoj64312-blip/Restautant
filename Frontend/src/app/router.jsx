import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import StaffLayout from "../layouts/StaffLayout";
import { AdminHome, GuestRoute, PermissionRoute, ProtectedRoute, RoleRoute } from "./guards";
import { PageLoader } from "../components/ui";
import { PAGE_ACCESS, PERMISSIONS, ROLES } from "../utils/constants";

// ---------- Public ----------
const HomePage = lazy(() => import("../features/home/HomePage"));
const MenuPage = lazy(() => import("../features/menu/MenuPage"));
const MenuDetailsPage = lazy(() => import("../features/menu/MenuDetailsPage"));
const AboutPage = lazy(() => import("../features/site/AboutPage"));
const ContactPage = lazy(() => import("../features/site/ContactPage"));
const NotFoundPage = lazy(() => import("../features/site/NotFoundPage"));

// ---------- Auth ----------
const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const RegisterPage = lazy(() => import("../features/auth/RegisterPage"));

// ---------- Customer ----------
const CartPage = lazy(() => import("../features/cart/CartPage"));
const CheckoutPage = lazy(() => import("../features/cart/CheckoutPage"));
const MyOrdersPage = lazy(() => import("../features/orders/MyOrdersPage"));
const ProfilePage = lazy(() => import("../features/profile/ProfilePage"));

// ---------- Admin ----------
const DashboardPage = lazy(() => import("../features/admin/dashboard/DashboardPage"));
const OrdersPage = lazy(() => import("../features/admin/orders/OrdersPage"));
const PaymentsPage = lazy(() => import("../features/admin/payments/PaymentsPage"));
const MenuListPage = lazy(() => import("../features/admin/menu/MenuListPage"));
const MenuFormPage = lazy(() => import("../features/admin/menu/MenuFormPage"));
const CategoryListPage = lazy(() => import("../features/admin/categories/CategoryListPage"));
const CategoryFormPage = lazy(() => import("../features/admin/categories/CategoryFormPage"));
const HeroPage = lazy(() => import("../features/admin/hero/HeroPage"));
const CustomersPage = lazy(() => import("../features/admin/customers/CustomersPage"));
const StaffPage = lazy(() => import("../features/admin/staff/StaffPage"));
const RolesPage = lazy(() => import("../features/admin/roles/RolesPage"));
const RolePermissionsPage = lazy(() => import("../features/admin/roles/RolePermissionsPage"));
const AttendancePage = lazy(() => import("../features/hr/attendance/AttendancePage"));
const AttendanceReportPage = lazy(() => import("../features/hr/attendance/AttendanceReportPage"));
const LeavePage = lazy(() => import("../features/hr/leave/LeavePage"));
const SettingsPage = lazy(() => import("../features/admin/settings/SettingsPage"));

// ---------- Staff ----------
const PosPage = lazy(() => import("../features/pos/PosPage"));
const KitchenPage = lazy(() => import("../features/kitchen/KitchenPage"));

const AppRouter = () => (
    <Suspense fallback={<PageLoader fullScreen />}>
        <Routes>
            {/* Public website */}
            <Route element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="menu/:id" element={<MenuDetailsPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />

                {/* Logged-in customer */}
                <Route element={<ProtectedRoute />}>
                    <Route path="cart" element={<CartPage />} />
                    <Route path="checkout" element={<CheckoutPage />} />
                    <Route path="orders" element={<MyOrdersPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Login / register */}
            <Route element={<GuestRoute />}>
                <Route element={<AuthLayout />}>
                    <Route path="login" element={<LoginPage />} />
                    <Route path="register" element={<RegisterPage />} />
                </Route>
            </Route>

            {/* Staff panel. Each page also checks a permission; kitchen staff only see HR pages. */}
            <Route path="admin" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.KITCHEN]} />}>
                <Route element={<AdminLayout />}>
                    <Route index element={<AdminHome />} />

                    <Route element={<PermissionRoute permission={PERMISSIONS.DASHBOARD_READ} />}>
                        <Route path="dashboard" element={<DashboardPage />} />
                    </Route>
                    <Route element={<PermissionRoute permission={PERMISSIONS.ORDERS_READ} />}>
                        <Route path="orders" element={<OrdersPage />} />
                    </Route>
                    <Route element={<PermissionRoute permission={PERMISSIONS.PAYMENTS_READ} />}>
                        <Route path="payments" element={<PaymentsPage />} />
                    </Route>
                    <Route element={<PermissionRoute permission={PAGE_ACCESS.menu} />}>
                        <Route path="menu" element={<MenuListPage />} />
                    </Route>
                    <Route element={<PermissionRoute permission={PERMISSIONS.MENU_CREATE} />}>
                        <Route path="menu/new" element={<MenuFormPage />} />
                    </Route>
                    <Route element={<PermissionRoute permission={PERMISSIONS.MENU_UPDATE} />}>
                        <Route path="menu/:id/edit" element={<MenuFormPage />} />
                    </Route>
                    <Route element={<PermissionRoute permission={PAGE_ACCESS.categories} />}>
                        <Route path="categories" element={<CategoryListPage />} />
                    </Route>
                    <Route element={<PermissionRoute permission={PERMISSIONS.CATEGORIES_CREATE} />}>
                        <Route path="categories/new" element={<CategoryFormPage />} />
                    </Route>
                    <Route element={<PermissionRoute permission={PERMISSIONS.CATEGORIES_UPDATE} />}>
                        <Route path="categories/:id/edit" element={<CategoryFormPage />} />
                    </Route>
                    <Route element={<PermissionRoute permission={PAGE_ACCESS.banners} />}>
                        <Route path="hero" element={<HeroPage />} />
                    </Route>
                    <Route element={<PermissionRoute permission={PAGE_ACCESS.settings} />}>
                        <Route path="settings" element={<SettingsPage />} />
                    </Route>

                    {/* HR: every staff member */}
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="leave" element={<LeavePage />} />
                    <Route element={<PermissionRoute permission={PERMISSIONS.ATTENDANCE_READ} />}>
                        <Route path="attendance-report" element={<AttendanceReportPage />} />
                    </Route>

                    {/* Admin only, never grantable to managers */}
                    <Route element={<PermissionRoute adminOnly />}>
                        <Route path="customers" element={<CustomersPage />} />
                        <Route path="staff" element={<StaffPage />} />
                        <Route path="roles" element={<RolesPage />} />
                        <Route path="roles/:role" element={<RolePermissionsPage />} />
                    </Route>

                    <Route path="users" element={<Navigate to="/admin/customers" replace />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Route>
            </Route>

            {/* POS & kitchen */}
            <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.KITCHEN]} />}>
                <Route element={<StaffLayout />}>
                    <Route element={<PermissionRoute permission={PERMISSIONS.POS_ACCESS} />}>
                        <Route path="pos" element={<PosPage />} />
                    </Route>
                    <Route element={<PermissionRoute permission={PERMISSIONS.KITCHEN_READ} />}>
                        <Route path="kitchen" element={<KitchenPage />} />
                    </Route>
                </Route>
            </Route>
        </Routes>
    </Suspense>
);

export default AppRouter;
