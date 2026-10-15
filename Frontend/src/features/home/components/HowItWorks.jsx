import { ChefHat, Leaf, ShoppingBag, Truck } from "lucide-react";
import SectionHeading from "./SectionHeading";

const STEPS = [
    {
        icon: ShoppingBag,
        title: "Pick your dishes",
        text: "Browse the menu and add what you love to your cart.",
    },
    {
        icon: ChefHat,
        title: "We cook it fresh",
        text: "Your order goes straight to our kitchen and is cooked to order.",
    },
    {
        icon: Truck,
        title: "Enjoy it hot",
        text: "Pick it up, dine in, or have it delivered to your door.",
    },
    {
        icon: Leaf,
        title: "Honest ingredients",
        text: "Seasonal produce, house-ground spices and no shortcuts.",
    },
];

const HowItWorks = () => (
    <section className="section" aria-labelledby="how-heading">
        <div className="container-page">
            <SectionHeading
                id="how-heading"
                eyebrow="Why guests love us"
                title="Good food, without the wait"
                align="center"
            />

            <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {STEPS.map(({ icon: Icon, title, text }, index) => (
                    <li key={title} className="relative rounded-2xl border border-line bg-surface p-6 shadow-card">
                        <span className="absolute right-5 top-5 font-display text-4xl font-semibold text-cream" aria-hidden="true">
                            {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                            <Icon size={22} aria-hidden="true" />
                        </span>
                        <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
                    </li>
                ))}
            </ol>
        </div>
    </section>
);

export default HowItWorks;
