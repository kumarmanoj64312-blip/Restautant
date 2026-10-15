import { useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import toast from "react-hot-toast";
import { sendContactMessage } from "../../api/contactApi";
import { getErrorMessage } from "../../api/client";
import { Alert, Button, Card, Input, Textarea } from "../../components/ui";
import { SITE } from "../../config/site";

const EMPTY_FORM = { name: "", email: "", phone: "", subject: "", message: "" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = (form) => {
    const errors = {};

    if (!form.name.trim()) errors.name = "Please tell us your name.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Please enter a valid email.";
    if (form.phone && !/^[+\d\s()-]{7,20}$/.test(form.phone.trim())) errors.phone = "Please enter a valid phone number.";
    if (!form.subject.trim()) errors.subject = "Please add a subject.";
    if (form.message.trim().length < 10) errors.message = "Your message should be at least 10 characters.";

    return errors;
};

const CONTACT_ITEMS = [
    { icon: MapPin, label: "Visit us", value: SITE.address },
    { icon: Phone, label: "Call us", value: SITE.phone, href: `tel:${SITE.phone.replace(/\s+/g, "")}` },
    { icon: Mail, label: "Email us", value: SITE.email, href: `mailto:${SITE.email}` },
    { icon: Clock, label: "Opening hours", value: SITE.hours },
];

const ContactPage = () => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState(null);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setStatus(null);

        const nextErrors = validate(form);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);

        try {
            const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
            const response = await sendContactMessage(payload);
            const message = response?.message || "Thanks! We'll get back to you shortly.";

            toast.success("Message sent");
            setStatus({ tone: "success", message });
            setForm(EMPTY_FORM);
        } catch (error) {
            setStatus({ tone: "danger", message: getErrorMessage(error, "We couldn't send your message. Please try again.") });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <section className="border-b border-line bg-cream/60">
                <div className="container-page py-12 sm:py-16">
                    <p className="eyebrow">Contact</p>
                    <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">
                        Come hungry. Leave happy.
                    </h1>
                    <p className="mt-3 max-w-xl text-muted">
                        Have a question, planning a celebration, or looking for a table? We&apos;d love to hear from
                        you.
                    </p>
                </div>
            </section>

            <section className="container-page grid gap-6 py-10 sm:py-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
                <div className="space-y-6">
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        {CONTACT_ITEMS.map(({ icon: Icon, label, value, href }) => (
                            <li key={label} className="flex gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                    <Icon size={20} aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
                                    {href ? (
                                        <a href={href} className="mt-1 block break-words font-semibold text-ink hover:text-brand">
                                            {value}
                                        </a>
                                    ) : (
                                        <p className="mt-1 font-semibold text-ink">{value}</p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="overflow-hidden rounded-2xl border border-line shadow-card">
                        <iframe
                            title={`Map showing ${SITE.name}, ${SITE.address}`}
                            src={`https://www.google.com/maps?q=${encodeURIComponent(`${SITE.name} ${SITE.address}`)}&output=embed`}
                            className="block h-64 w-full"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                </div>

                <Card padding="lg" className="h-fit">
                    <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Send us a message</h2>
                    <p className="mt-1 text-sm text-muted">We usually reply within one business day.</p>

                    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Input
                                label="Your name"
                                name="name"
                                autoComplete="name"
                                placeholder="Enter a Name"
                                value={form.name}
                                onChange={handleChange}
                                error={errors.name}
                                required
                            />
                            <Input
                                label="Email address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                error={errors.email}
                                required
                            />
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Input
                                label="Phone"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                placeholder="Optional"
                                value={form.phone}
                                onChange={handleChange}
                                error={errors.phone}
                            />
                            <Input
                                label="Subject"
                                name="subject"
                                placeholder="How can we help?"
                                value={form.subject}
                                onChange={handleChange}
                                error={errors.subject}
                                required
                            />
                        </div>
                        <Textarea
                            label="Message"
                            name="message"
                            rows={5}
                            placeholder="Tell us a little more…"
                            value={form.message}
                            onChange={handleChange}
                            error={errors.message}
                            required
                        />

                        {status && <Alert tone={status.tone}>{status.message}</Alert>}

                        <Button type="submit" size="lg" icon={Send} loading={submitting} className="w-full sm:w-auto">
                            {submitting ? "Sending…" : "Send message"}
                        </Button>
                    </form>
                </Card>
            </section>
        </>
    );
};

export default ContactPage;
