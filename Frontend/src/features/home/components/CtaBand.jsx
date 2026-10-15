import { ArrowRight, Phone } from "lucide-react";
import { Button } from "../../../components/ui";
import { SITE } from "../../../config/site";

const CtaBand = () => (
    <section className="container-page pb-16 sm:pb-24">
        <div className="relative isolate overflow-hidden rounded-3xl bg-brand px-6 py-12 text-white shadow-lift sm:px-12 sm:py-16">
            <div className="absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full bg-white/10" aria-hidden="true" />
            <div className="absolute -bottom-24 right-24 -z-10 h-56 w-56 rounded-full bg-brand-dark/40" aria-hidden="true" />

            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                    <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                        Hungry already? Your table&apos;s waiting.
                    </h2>
                    <p className="mt-3 text-white/85">
                        Order online in a few taps, or call us to reserve a table for tonight.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button to="/menu" size="lg" variant="secondary" iconRight={ArrowRight}>
                        Order online
                    </Button>
                    <a
                        href={`tel:${SITE.phone.replace(/\s+/g, "")}`}
                        className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 font-semibold text-white transition hover:bg-white/20"
                    >
                        <Phone size={18} aria-hidden="true" />
                        {SITE.phone}
                    </a>
                </div>
            </div>
        </div>
    </section>
);

export default CtaBand;
