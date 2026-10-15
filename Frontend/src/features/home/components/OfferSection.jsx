import { useEffect, useState } from "react";
import { Check, Copy, TicketPercent } from "lucide-react";
import toast from "react-hot-toast";
import { getOffers } from "../../../api/offerApi";
import { unwrapList } from "../../../api/client";
import { Button, Skeleton } from "../../../components/ui";
import SectionHeading from "./SectionHeading";

const MAX_SHOWN = 3;

const CouponCode = ({ code }) => {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            toast.success(`Code ${code} copied`);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy. Please note the code manually.");
        }
    };

    return (
        <button
            type="button"
            onClick={copy}
            aria-label={`Copy coupon code ${code}`}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/60 bg-white/10 px-3 py-2 font-mono text-sm font-bold tracking-wider text-white backdrop-blur transition hover:bg-white/20"
        >
            {code}
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        </button>
    );
};

const OfferCard = ({ offer, featured }) => {
    const link = offer.buttonLink || "/menu";
    const internal = link.startsWith("/");

    return (
        <article
            className={`relative isolate flex min-h-[280px] flex-col justify-end overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-card sm:p-8 ${
                featured ? "lg:row-span-2 lg:min-h-[440px]" : ""
            }`}
        >
            {offer.image && (
                <img
                    src={offer.image}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 -z-20 h-full w-full object-cover"
                />
            )}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/95 via-ink/60 to-ink/10" aria-hidden="true" />

            {Number(offer.discount) > 0 && (
                <span className="absolute right-5 top-5 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-brand text-center leading-none shadow-lift">
                    <span className="text-xl font-extrabold">{offer.discount}%</span>
                    <span className="text-[10px] font-bold uppercase">off</span>
                </span>
            )}

            <h3 className={`font-display font-semibold leading-tight ${featured ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
                {offer.title}
            </h3>
            {offer.description && (
                <p className="mt-2 line-clamp-3 max-w-md text-sm leading-relaxed text-white/80">{offer.description}</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
                {offer.couponCode && <CouponCode code={offer.couponCode} />}
                <Button
                    size="sm"
                    {...(internal ? { to: link } : { href: link, target: "_blank", rel: "noreferrer" })}
                >
                    {offer.buttonText || "Order now"}
                </Button>
            </div>
        </article>
    );
};

// Promotional, so the section hides itself when there's nothing to show or the request fails
const OfferSection = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            try {
                const response = await getOffers();
                const active = unwrapList(response).filter((offer) => offer?.isActive !== false && offer?.title);
                if (!ignore) setOffers(active.slice(0, MAX_SHOWN));
            } catch {
                if (!ignore) setOffers([]);
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        load();
        return () => {
            ignore = true;
        };
    }, []);

    if (!loading && offers.length === 0) return null;

    return (
        <section className="section bg-cream/60" aria-labelledby="offers-heading">
            <div className="container-page">
                <SectionHeading
                    id="offers-heading"
                    eyebrow="Offers"
                    title="Deals worth sharing"
                    description="Use these codes at checkout and treat yourself to a little extra."
                />

                {loading ? (
                    <div className="grid gap-5 lg:grid-cols-2" aria-hidden="true">
                        <Skeleton className="h-[280px] rounded-3xl lg:h-[440px]" />
                        <div className="grid gap-5">
                            <Skeleton className="h-[210px] rounded-3xl" />
                            <Skeleton className="h-[210px] rounded-3xl" />
                        </div>
                    </div>
                ) : (
                    <div className={`grid gap-5 ${offers.length > 1 ? "lg:grid-cols-2" : ""}`}>
                        {offers.map((offer, index) => (
                            <OfferCard key={offer._id} offer={offer} featured={index === 0 && offers.length > 2} />
                        ))}
                    </div>
                )}

                <p className="mt-6 flex items-center gap-2 text-xs text-muted">
                    <TicketPercent size={15} aria-hidden="true" /> Offers are subject to availability and may change.
                </p>
            </div>
        </section>
    );
};

export default OfferSection;
