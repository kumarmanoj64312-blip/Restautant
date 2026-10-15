import { useState } from "react";
import { KeyRound, LogOut, ReceiptText, ShoppingBag, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge, Button, Card, PageHeader } from "../../components/ui";
import { capitalize, formatDate } from "../../utils/format";
import { useAuth } from "../auth/AuthContext";
import ChangePasswordForm from "./ChangePasswordForm";
import ProfileForm from "./ProfileForm";

const SECTIONS = [
    { value: "profile", label: "Personal details", icon: UserRound },
    { value: "security", label: "Password & security", icon: KeyRound },
];

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user, isCustomer, logout } = useAuth();
    const [section, setSection] = useState("profile");

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    return (
        <div className="container-page py-8 sm:py-12">
            <PageHeader eyebrow="Account" title="My profile" description="Manage your details and keep your account secure." />

            <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
                <aside className="space-y-4 lg:sticky lg:top-24">
                    <Card className="text-center">
                        <div className="flex justify-center">
                            <Avatar src={user?.avatar?.url} name={user?.name} size={88} className="ring-4 ring-brand-soft" />
                        </div>
                        <h2 className="mt-3 truncate font-display text-lg font-semibold text-ink">{user?.name}</h2>
                        <p className="truncate text-sm text-muted">{user?.email}</p>
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                            <Badge tone="brand">{capitalize(user?.role || "customer")}</Badge>
                        </div>
                        {user?.createdAt && (
                            <p className="mt-3 text-xs text-muted">Member since {formatDate(user.createdAt)}</p>
                        )}
                    </Card>

                    <Card padding="sm">
                        <nav aria-label="Profile sections" className="flex gap-1 overflow-x-auto lg:flex-col">
                            {SECTIONS.map((item) => {
                                const Icon = item.icon;
                                const active = section === item.value;

                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setSection(item.value)}
                                        aria-current={active ? "page" : undefined}
                                        className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                                            active ? "bg-brand-soft text-brand-dark" : "text-ink hover:bg-cream"
                                        }`}
                                    >
                                        <Icon size={18} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="mt-2 hidden border-t border-line pt-2 lg:block">
                            {isCustomer && (
                                <>
                                    <Button to="/orders" variant="ghost" icon={ReceiptText} fullWidth className="justify-start">
                                        My orders
                                    </Button>
                                    <Button to="/cart" variant="ghost" icon={ShoppingBag} fullWidth className="justify-start">
                                        My cart
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="ghost"
                                icon={LogOut}
                                fullWidth
                                onClick={handleLogout}
                                className="justify-start text-danger hover:bg-red-50"
                            >
                                Log out
                            </Button>
                        </div>
                    </Card>
                </aside>

                <div className="min-w-0">
                    {section === "profile" ? <ProfileForm /> : <ChangePasswordForm />}

                    <div className="mt-6 flex flex-wrap gap-2 lg:hidden">
                        {isCustomer && (
                            <Button to="/orders" variant="outline" icon={ReceiptText}>
                                My orders
                            </Button>
                        )}
                        <Button variant="danger-outline" icon={LogOut} onClick={handleLogout}>
                            Log out
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
