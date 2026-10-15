import { useEffect, useState } from "react";
import { ArrowRight, Clock, Star, UtensilsCrossed } from "lucide-react";
import { getActiveHeroes } from "../../../api/heroApi";
import { unwrapList } from "../../../api/client";
import { Button, Skeleton } from "../../../components/ui";
import { SITE } from "../../../config/site";

const ROTATE_MS = 6000;

// Shown when the admin hasn't published any active banners
const FALLBACK_SLIDES = [
    {
        _id: "fallback-1",
        badge: "Fresh from our kitchen",
        title: "Food worth gathering around",
        description:
            "Slow-cooked curries, fragrant biryanis and wood-fired pizzas, made to order with honest ingredients.",
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "A spread of freshly cooked dishes on a wooden table",
    },
    {
        _id: "fallback-2",
        badge: "Made fresh, served warm",
        title: "Every plate cooked when you order",
        description: "From our kitchen to your table in minutes. Order online for pickup or delivery.",
        image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Colourful bowl of fresh salad and grilled vegetables",
    },
];

const toSlide = (hero) => ({
    _id: hero._id,
    badge: hero.badge || hero.offerText || "",
    title: hero.title || SITE.tagline,
    subtitle: hero.subtitle || "",
    description: hero.description || "",
    image: hero.image?.url,
    imageAlt: hero.title || "Featured dish",
    buttonText: hero.buttonText || "Order now",
    buttonLink: hero.buttonLink || "/menu",
});

const CtaButton = ({ link = "/menu", children }) => {
    const internal = link.startsWith("/");

    return (
        <Button
            size="lg"
            iconRight={ArrowRight}
            {...(internal ? { to: link } : { href: link, target: "_blank", rel: "noreferrer" })}
        >
            {children}
        </Button>
    );
};

const HeroSection = () => {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState(0);

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            try {
                const response = await getActiveHeroes();
                const heroes = unwrapList(response)
                    .filter((hero) => hero?.image?.url && hero.isActive !== false)
                    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                    .map(toSlide);

                if (!ignore) setSlides(heroes.length ? heroes : FALLBACK_SLIDES);
            } catch {
                if (!ignore) setSlides(FALLBACK_SLIDES);
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        load();
        return () => {
            ignore = true;
        };
    }, []);

    // Auto-advance; restarts whenever the user picks a slide
    useEffect(() => {
        if (slides.length < 2) return undefined;

        const timer = setInterval(() => setActive((current) => (current + 1) % slides.length), ROTATE_MS);
        return () => clearInterval(timer);
    }, [slides.length, active]);

    if (loading) {
        return (
            <section className="container-page grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20" aria-busy="true">
                <div className="space-y-5">
                    <Skeleton className="h-6 w-40 rounded-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-3/4" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-12 w-48" />
                </div>
                <Skeleton className="aspect-4/3 rounded-4xl" />
            </section>
        );
    }

    const slide = slides[active] || slides[0];

    return (
        <section className="relative overflow-hidden" aria-roledescription="carousel" aria-label="Featured">
            {/* Soft warm glow behind the hero */}
            <div
                className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-brand-soft blur-3xl"
                aria-hidden="true"
            />

            <div className="container-page relative grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
                <div key={slide._id} className="animate-fade-up">
                    {slide.badge && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-dark shadow-card">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                            {slide.badge}
                        </span>
                    )}

                    <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                        {slide.title}
                    </h1>

                    {slide.subtitle && <p className="mt-3 text-lg font-semibold text-brand-dark">{slide.subtitle}</p>}

                    {slide.description && (
                        <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
                            {slide.description}
                        </p>
                    )}

                    <div className="mt-8 flex flex-wrap gap-3">
                        <CtaButton link={slide.buttonLink}>{slide.buttonText || "Order now"}</CtaButton>
                        <Button to="/menu" variant="outline" size="lg">
                            Explore menu
                        </Button>
                    </div>

                    <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Star size={18} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                            <dt className="sr-only">Rating</dt>
                            <dd className="font-semibold text-ink">
                                4.8 <span className="font-normal text-muted">guest rating</span>
                            </dd>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-brand" aria-hidden="true" />
                            <dt className="sr-only">Hours</dt>
                            <dd className="text-muted">{SITE.hours}</dd>
                        </div>
                    </dl>
                </div>

                <div className="relative">
                    <div className="relative aspect-4/3 overflow-hidden rounded-4xl bg-cream shadow-lift">
                        {slide.image ? (
                            <img
                                key={slide._id}
                                src={slide.image}
                                alt={slide.imageAlt}
                                fetchPriority="high"
                                className="h-full w-full animate-fade-in object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted/50">
                                <UtensilsCrossed size={64} aria-hidden="true" />
                            </div>
                        )}
                    </div>

                    <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-lift sm:-left-6">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                            <UtensilsCrossed size={20} aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-sm font-bold text-ink">Cooked to order</p>
                            <p className="text-xs text-muted">Ready in ~30 min</p>
                        </div>
                    </div>

                    {slides.length > 1 && (
                        <div className="absolute bottom-4 right-4 flex gap-1.5 rounded-full bg-ink/40 px-2.5 py-2 backdrop-blur">
                            {slides.map((item, index) => (
                                <button
                                    key={item._id}
                                    type="button"
                                    onClick={() => setActive(index)}
                                    aria-label={`Show slide ${index + 1} of ${slides.length}`}
                                    aria-current={index === active ? "true" : undefined}
                                    className={`h-2 rounded-full transition-all ${
                                        index === active ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
