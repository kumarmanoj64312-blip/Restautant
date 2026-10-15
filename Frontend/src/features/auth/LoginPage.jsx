import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock, LogIn, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { loginUser } from "../../api/authApi";
import { getErrorMessage } from "../../api/client";
import { Alert, Button, Input } from "../../components/ui";
import { ROLES } from "../../utils/constants";
import { getRoleHomePath } from "../../utils/format";
import { useAuth } from "./AuthContext";
import PasswordInput from "./PasswordInput";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [form, setForm] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setServerError("");
    };

    const validate = () => {
        const next = {};

        if (!form.email.trim()) next.email = "Email is required.";
        else if (!EMAIL_REGEX.test(form.email.trim())) next.email = "Enter a valid email address.";

        if (!form.password) next.password = "Password is required.";

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (loading || !validate()) return;

        setLoading(true);
        setServerError("");

        try {
            const response = await loginUser({
                email: form.email.trim().toLowerCase(),
                password: form.password,
            });
            const { user, token } = response?.data || {};

            if (!user || !token) {
                throw new Error("Unexpected response from the server. Please try again.");
            }

            login(user, token);
            toast.success(`Welcome back, ${user.name?.split(" ")[0] || "friend"}!`);

            // Customers go back to where they were heading; staff go to their workspace
            const from = location.state?.from?.pathname;
            const destination =
                user.role === ROLES.CUSTOMER && from && from !== "/login"
                    ? from
                    : getRoleHomePath(user.role);

            navigate(destination, { replace: true });
        } catch (error) {
            setServerError(getErrorMessage(error, "Login failed. Please try again."));
            setLoading(false);
        }
    };

    return (
        <div>
            <p className="eyebrow mb-2">Welcome back</p>
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Sign in to your account</h1>
            <p className="mt-2 text-sm text-muted">
                Order your favourites, track deliveries and manage your profile.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                <Alert>{serverError}</Alert>

                <Input
                    label="Email address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    icon={Mail}
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                />

                <PasswordInput
                    label="Password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Your password"
                    icon={Lock}
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                />

                <Button type="submit" size="lg" fullWidth loading={loading} icon={LogIn}>
                    {loading ? "Signing in..." : "Sign in"}
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
                New here?{" "}
                <Link
                    to="/register"
                    state={location.state}
                    className="font-semibold text-brand hover:text-brand-dark"
                >
                    Create an account
                </Link>
            </p>
        </div>
    );
};

export default LoginPage;
