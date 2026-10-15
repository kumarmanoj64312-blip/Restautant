import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Banknote, CreditCard, ImageOff, ShieldCheck, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { getCart } from "../../api/cartApi";
import { getErrorMessage } from "../../api/client";
import { createOrder } from "../../api/orderApi";
import {
    Alert,
    Button,
    Card,
    CardHeader,
    EmptyState,
    ErrorState,
    Input,
    PageHeader,
    Skeleton,
    Textarea,
} from "../../components/ui";
import { formatCurrency } from "../../utils/format";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "./CartContext";
import { extractCart, getCartItems, getUnitPrice, summarizeCart } from "./cartUtils";
import OrderSummary from "./OrderSummary";
import useSettings from "../../hooks/useSettings";
import { payOrderOnline } from "./razorpay";
import { getPaymentConfig } from "../../api/paymentApi";
import StaffNotice from "./StaffNotice";

const PAYMENT_OPTIONS = [
    {
        value: "Cash on Delivery",
        title: "Cash on delivery",
        description: "Pay with cash or UPI when your order arrives.",
        icon: Banknote,
    },
    {
        value: "Online Payment",
        title: "Pay online",
        description: "Cards, UPI, net banking and wallets via Razorpay.",
        icon: CreditCard,
    },
];

const PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;

// Mirrors Backend validation/orderValidation.js -> validatePlaceOrder
const validate = (form) => {
    const errors = {};

    if (!form.name.trim()) errors.name = "Name is required.";

    if (!form.phone.trim()) errors.phone = "Phone number is required.";
    else if (!PHONE_REGEX.test(form.phone.trim())) errors.phone = "Enter a valid 10-digit mobile number starting with 6-9.";

    if (!form.address.trim()) errors.address = "Address is required.";
    if (!form.city.trim()) errors.city = "City is required.";

    if (!form.pincode.trim()) errors.pincode = "Pincode is required.";
    else if (!PINCODE_REGEX.test(form.pincode.trim())) errors.pincode = "Pincode must be 6 digits.";

    if (form.notes.length > 1000) errors.notes = "Notes can be at most 1000 characters.";

    return errors;
};

const buildInitialForm = (user) => {
    const phone = String(user?.phone || "").replace(/\D/g, "").slice(-10);

    return {
        name: user?.name || "",
        phone: PHONE_REGEX.test(phone) ? phone : "",
        address: user?.address || "",
        city: "",
        state: "",
        pincode: "",
        notes: "",
        paymentMethod: "Cash on Delivery",
    };
};

const CheckoutSkeleton = () => (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-[520px] rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
    </div>
);

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { user, isStaff } = useAuth();
    const { refreshCart } = useCart();

    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(!isStaff);
    const [loadError, setLoadError] = useState("");
    const [form, setForm] = useState(() => buildInitialForm(user));
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [placing, setPlacing] = useState(false);

    const loadCart = useCallback(async () => {
        try {
            const response = await getCart();
            setCart(extractCart(response));
            setLoadError("");
        } catch (err) {
            setLoadError(getErrorMessage(err, "We couldn't load your cart."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isStaff) loadCart();
    }, [isStaff, loadCart]);

    // Online payment (UPI, cards) is offered only when the server has Razorpay set up
    const [onlineAvailable, setOnlineAvailable] = useState(false);

    useEffect(() => {
        let active = true;

        getPaymentConfig()
            .then((response) => {
                if (active) setOnlineAvailable(!!response?.data?.onlinePayment);
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, []);

    const paymentMethod = onlineAvailable ? form.paymentMethod : "Cash on Delivery";

    const items = getCartItems(cart);
    const settings = useSettings();
    const summary = summarizeCart(items, settings);

    const handleChange = (event) => {
        const { name } = event.target;
        let { value } = event.target;

        if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);
        if (name === "pincode") value = value.replace(/\D/g, "").slice(0, 6);

        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setSubmitError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (placing) return;

        const nextErrors = validate(form);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            setSubmitError("Please fix the highlighted fields.");
            return;
        }

        if (summary.hasUnavailable || summary.orderable.length === 0) {
            setSubmitError("Some items in your cart can't be ordered. Please review your cart.");
            return;
        }

        setPlacing(true);
        setSubmitError("");

        let order;

        try {
            const response = await createOrder({
                items: summary.orderable.map((item) => ({ menu: item.menu._id, quantity: item.quantity })),
                shippingAddress: {
                    name: form.name.trim(),
                    phone: form.phone.trim(),
                    address: form.address.trim(),
                    city: form.city.trim(),
                    state: form.state.trim(),
                    pincode: form.pincode.trim(),
                },
                paymentMethod,
                // The server recalculates the real total; this only has to be > 0
                totalAmount: summary.total,
                notes: form.notes.trim(),
            });
            order = response?.data;
        } catch (err) {
            setSubmitError(getErrorMessage(err, "We couldn't place your order. Please try again."));
            setPlacing(false);
            return;
        }

        // The backend empties the cart once the order exists
        refreshCart();

        if (paymentMethod === "Online Payment" && order?._id) {
            try {
                await payOrderOnline(order, {
                    name: form.name.trim(),
                    email: user?.email,
                    contact: form.phone.trim(),
                });
                toast.success("Payment received. Your order is on its way to the kitchen!");
            } catch (err) {
                toast.error(
                    `Your order was placed, but payment wasn't completed (${getErrorMessage(err, "payment failed")}). You can pay on delivery.`,
                    { duration: 7000 }
                );
            }
        } else {
            toast.success("Order placed! We'll start preparing it shortly.");
        }

        navigate("/orders", { replace: true });
    };

    const renderBody = () => {
        if (isStaff) return <StaffNotice role={user?.role} />;
        if (loading) return <CheckoutSkeleton />;

        if (loadError) {
            return (
                <Card padding="none">
                    <ErrorState
                        message={loadError}
                        onRetry={() => {
                            setLoading(true);
                            loadCart();
                        }}
                    />
                </Card>
            );
        }

        if (items.length === 0) {
            return (
                <Card padding="none">
                    <EmptyState
                        icon={ShoppingBag}
                        title="Nothing to check out"
                        description="Your cart is empty. Add a few dishes from the menu first."
                        action={<Button to="/menu">Browse the menu</Button>}
                    />
                </Card>
            );
        }

        return (
            <form onSubmit={handleSubmit} noValidate className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader title="Delivery details" description="Where should we bring your food?" />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Full name"
                                name="name"
                                autoComplete="name"
                                value={form.name}
                                onChange={handleChange}
                                error={errors.name}
                                required
                            />
                            <Input
                                label="Mobile number"
                                name="phone"
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel-national"
                                placeholder="10-digit number"
                                value={form.phone}
                                onChange={handleChange}
                                error={errors.phone}
                                required
                            />
                            <Textarea
                                label="Address"
                                name="address"
                                rows={3}
                                autoComplete="street-address"
                                placeholder="House / flat no., street, landmark"
                                value={form.address}
                                onChange={handleChange}
                                error={errors.address}
                                required
                                className="sm:col-span-2"
                            />
                            <Input
                                label="City"
                                name="city"
                                autoComplete="address-level2"
                                value={form.city}
                                onChange={handleChange}
                                error={errors.city}
                                required
                            />
                            <Input
                                label="State"
                                name="state"
                                autoComplete="address-level1"
                                value={form.state}
                                onChange={handleChange}
                                error={errors.state}
                            />
                            <Input
                                label="Pincode"
                                name="pincode"
                                inputMode="numeric"
                                autoComplete="postal-code"
                                placeholder="6 digits"
                                value={form.pincode}
                                onChange={handleChange}
                                error={errors.pincode}
                                required
                            />
                            <Textarea
                                label="Delivery notes"
                                name="notes"
                                rows={2}
                                placeholder="Less spicy, ring the bell, etc. (optional)"
                                value={form.notes}
                                onChange={handleChange}
                                error={errors.notes}
                                className="sm:col-span-2"
                            />
                        </div>
                    </Card>

                    <Card>
                        <CardHeader title="Payment method" />
                        <fieldset className="grid gap-3 sm:grid-cols-2">
                            <legend className="sr-only">Payment method</legend>
                            {PAYMENT_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const checked = paymentMethod === option.value;
                                const unavailable = option.value === "Online Payment" && !onlineAvailable;

                                return (
                                    <label
                                        key={option.value}
                                        className={`flex gap-3 rounded-xl border p-4 transition ${
                                            unavailable
                                                ? "cursor-not-allowed border-line bg-canvas opacity-60"
                                                : checked
                                                  ? "cursor-pointer border-brand bg-brand-soft ring-2 ring-brand/20"
                                                  : "cursor-pointer border-line bg-surface hover:border-brand/50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={option.value}
                                            checked={checked}
                                            disabled={unavailable}
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                        <span
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                checked ? "bg-brand text-white" : "bg-cream text-ink"
                                            }`}
                                        >
                                            <Icon size={19} />
                                        </span>
                                        <span>
                                            <span className="block text-sm font-semibold text-ink">{option.title}</span>
                                            <span className="block text-xs text-muted">
                                                {unavailable ? "Not available right now. Please pay on delivery." : option.description}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                        </fieldset>
                    </Card>
                </div>

                <Card className="lg:sticky lg:top-24">
                    <h2 className="mb-4 font-display text-xl font-semibold text-ink">Your order</h2>

                    <ul className="mb-5 max-h-72 space-y-3 overflow-y-auto pr-1">
                        {summary.orderable.map((item) => (
                            <li key={item.menu._id} className="flex items-center gap-3">
                                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                                    {item.menu.image?.url ? (
                                        <img src={item.menu.image.url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center text-muted">
                                            <ImageOff size={16} />
                                        </span>
                                    )}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold text-ink">{item.menu.name}</span>
                                    <span className="block text-xs text-muted">
                                        {item.quantity} × {formatCurrency(getUnitPrice(item))}
                                    </span>
                                </span>
                                <span className="text-sm font-semibold text-ink">
                                    {formatCurrency(getUnitPrice(item) * item.quantity)}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="border-t border-line pt-4">
                        <OrderSummary {...summary} />
                    </div>

                    {summary.hasUnavailable && (
                        <Alert tone="warning" className="mt-5">
                            Some items in your cart are unavailable. <Link to="/cart" className="font-semibold underline">Review cart</Link>
                        </Alert>
                    )}

                    <Alert className="mt-5">{submitError}</Alert>

                    <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        loading={placing}
                        disabled={summary.hasUnavailable}
                        className="mt-5"
                    >
                        {placing
                            ? "Placing order..."
                            : paymentMethod === "Online Payment"
                              ? `Pay ${formatCurrency(summary.total)}`
                              : `Place order · ${formatCurrency(summary.total)}`}
                    </Button>

                    <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
                        <ShieldCheck size={14} /> Prices are confirmed by the restaurant when you order.
                    </p>
                </Card>
            </form>
        );
    };

    return (
        <div className="container-page py-8 sm:py-12">
            <PageHeader
                eyebrow="Almost there"
                title="Checkout"
                description="Confirm your delivery details and payment."
                actions={
                    !isStaff && (
                        <Button to="/cart" variant="ghost" icon={ArrowLeft}>
                            Back to cart
                        </Button>
                    )
                }
            />
            {renderBody()}
        </div>
    );
};

export default CheckoutPage;
