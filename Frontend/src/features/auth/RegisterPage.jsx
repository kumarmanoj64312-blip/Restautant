import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock, Mail, Phone, User, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { registerUser } from "../../api/authApi";
import { getErrorMessage } from "../../api/client";
import { Alert, Button, Input } from "../../components/ui";
import { getRoleHomePath } from "../../utils/format";
import { useAuth } from "./AuthContext";
import PasswordInput from "./PasswordInput";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Same rule the order API applies to delivery phone numbers
const PHONE_REGEX = /^[6-9]\d{9}$/;

const INITIAL_FORM = {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
};

// Rules mirror Backend validation/authValidation.js + authService.register
const validate = (form) => {
    const errors = {};
    const name = form.name.trim();

    if (!name) errors.name = "Name is required.";
    else if (name.length < 3) errors.name = "Name must be at least 3 characters.";

    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(form.email.trim())) errors.email = "Enter a valid email address.";

    if (!form.phone.trim()) errors.phone = "Phone number is required.";
    else if (!PHONE_REGEX.test(form.phone.trim())) errors.phone = "Enter a valid 10-digit mobile number.";

    if (!form.password) errors.password = "Password is required.";
    else if (form.password.length < 6) errors.password = "Password must be at least 6 characters.";

    if (!form.confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match.";

    return errors;
};

const RegisterPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name } = event.target;
        let { value } = event.target;

        if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);

        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setServerError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (loading) return;

        const nextErrors = validate(form);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setLoading(true);
        setServerError("");

        try {
            const response = await registerUser({
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim(),
                password: form.password,
            });
            const { user, token } = response?.data || {};

            // Backend returns a token on register; fall back to the login page if it ever stops doing so
            if (!user || !token) {
                toast.success("Account created. Please sign in.");
                navigate("/login", { replace: true, state: location.state });
                return;
            }

            login(user, token);
            toast.success(`Welcome, ${user.name?.split(" ")[0] || "friend"}! Your account is ready.`);

            const from = location.state?.from?.pathname;
            navigate(from && from !== "/register" ? from : getRoleHomePath(user.role), { replace: true });
        } catch (error) {
            setServerError(getErrorMessage(error, "Registration failed. Please try again."));
            setLoading(false);
        }
    };

    return (
        <div>
            <p className="eyebrow mb-2">Join us</p>
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Create your account</h1>
            <p className="mt-2 text-sm text-muted">
                Sign up in under a minute to order online and track your food.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
                <Alert>{serverError}</Alert>

                <Input
                    label="Full name"
                    name="name"
                    autoComplete="name"
                    placeholder="Your name"
                    icon={User}
                    value={form.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                />

                <div className="grid gap-4 sm:grid-cols-2">
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

                    <Input
                        label="Mobile number"
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="98765 43210"
                        icon={Phone}
                        value={form.phone}
                        onChange={handleChange}
                        error={errors.phone}
                        required
                    />
                </div>

                <PasswordInput
                    label="Password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    icon={Lock}
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                />

                <PasswordInput
                    label="Confirm password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    icon={Lock}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    required
                />

                <Button type="submit" size="lg" fullWidth loading={loading} icon={UserPlus} className="mt-2">
                    {loading ? "Creating account..." : "Create account"}
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
                Already have an account?{" "}
                <Link to="/login" state={location.state} className="font-semibold text-brand hover:text-brand-dark">
                    Sign in
                </Link>
            </p>
        </div>
    );
};

export default RegisterPage;
