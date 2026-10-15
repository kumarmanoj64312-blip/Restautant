import { ArrowRight, HeartHandshake, Leaf, Sparkles } from "lucide-react";
import { Button } from "../../components/ui";
import { SITE } from "../../config/site";

const STATS = [
    { value: "10+", label: "Years of cooking" },
    { value: "50+", label: "Dishes on the menu" },
    { value: "15K+", label: "Happy guests" },
    { value: "4.8", label: "Average rating" },
];

const VALUES = [
    {
        icon: Leaf,
        title: "Fresh, every day",
        text: "We buy produce daily and grind our own spices, so every dish tastes the way it should.",
    },
    {
        icon: Sparkles,
        title: "Cooked to order",
        text: "Nothing sits under a heat lamp. Your food is cooked when you order it, not before.",
    },
    {
        icon: HeartHandshake,
        title: "Made for sharing",
        text: "Generous plates and a warm room, built for families, friends and long conversations.",
    },
];

const AboutPage = () => (
    <>
        <section className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
            <div className="animate-fade-up">
                <p className="eyebrow">Our story</p>
                <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                    A neighbourhood kitchen with a big heart
                </h1>
                <p className="mt-6 leading-relaxed text-muted">
                    At {SITE.name}, we believe every meal should be worth remembering. Our chefs cook with fresh
                    ingredients, time-honoured recipes and a genuine love for good food.
                </p>
                <p className="mt-4 leading-relaxed text-muted">
                    From smoky biryanis and rich curries to wood-fired pizzas, burgers and desserts, we serve food
                    that brings families and friends together, whether you dine with us or order in.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Button to="/menu" size="lg" iconRight={ArrowRight}>
                        Explore the menu
                    </Button>
                    <Button to="/contact" size="lg" variant="outline">
                        Get in touch
                    </Button>
                </div>
            </div>

            <div className="relative">
                <img
                    src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1000&q=80"
                    alt="Warmly lit dining room of the restaurant"
                    className="aspect-4/5 w-full rounded-4xl object-cover shadow-lift sm:aspect-4/3 lg:aspect-4/5"
                />
                <div className="absolute -bottom-6 left-4 rounded-2xl bg-brand px-6 py-4 text-white shadow-lift sm:-left-6">
                    <p className="font-display text-3xl font-semibold">10+</p>
                    <p className="text-sm text-white/85">years of good food</p>
                </div>
            </div>
        </section>

        <section className="border-y border-line bg-surface">
            <dl className="container-page grid grid-cols-2 gap-6 py-10 sm:py-12 lg:grid-cols-4">
                {STATS.map((stat) => (
                    <div key={stat.label} className="flex flex-col text-center">
                        <dt className="order-2 text-sm text-muted">{stat.label}</dt>
                        <dd className="font-display text-4xl font-semibold text-brand">{stat.value}</dd>
                    </div>
                ))}
            </dl>
        </section>

        <section className="section">
            <div className="container-page">
                <div className="mx-auto mb-10 max-w-2xl text-center">
                    <p className="eyebrow">What we stand for</p>
                    <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
                        Simple promises, kept every day
                    </h2>
                </div>
                <ul className="grid gap-5 md:grid-cols-3">
                    {VALUES.map(({ icon: Icon, title, text }) => (
                        <li key={title} className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                                <Icon size={22} aria-hidden="true" />
                            </span>
                            <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>

        <section className="container-page pb-16 sm:pb-24">
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    {
                        src: "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=700&q=80",
                        alt: "Chicken biryani served in a bowl",
                    },
                    {
                        src: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=700&q=80",
                        alt: "Wood-fired pizza fresh from the oven",
                    },
                    {
                        src: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=80",
                        alt: "Slice of chocolate layer cake",
                    },
                ].map((image) => (
                    <img
                        key={image.src}
                        src={image.src}
                        alt={image.alt}
                        loading="lazy"
                        className="aspect-4/3 w-full rounded-2xl object-cover shadow-card"
                    />
                ))}
            </div>
        </section>
    </>
);

export default AboutPage;
