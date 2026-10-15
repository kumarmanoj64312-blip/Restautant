import { Link } from "react-router-dom";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import Logo from "../../components/brand/Logo";
import { SITE } from "../../config/site";

const EXPLORE = [
    { label: "Menu", to: "/menu" },
    { label: "About us", to: "/about" },
    { label: "Contact", to: "/contact" },
    { label: "My orders", to: "/orders" },
];

const SOCIAL = [
    { icon: FaFacebookF, href: SITE.social.facebook, label: "Facebook" },
    { icon: FaInstagram, href: SITE.social.instagram, label: "Instagram" },
    { icon: FaYoutube, href: SITE.social.youtube, label: "YouTube" },
];

const Footer = () => (
    <footer className="bg-ink text-white/70">
        <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1fr]">
            <div>
                <Logo tone="light" />
                <p className="mt-4 max-w-xs text-sm leading-6">{SITE.description}</p>
                <div className="mt-5 flex gap-2">
                    {SOCIAL.map(({ icon: Icon, href, label }) => (
                        <a
                            key={label}
                            href={href}
                            aria-label={label}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white transition hover:border-brand hover:bg-brand"
                        >
                            <Icon size={14} />
                        </a>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Explore</h3>
                <ul className="space-y-2.5 text-sm">
                    {EXPLORE.map((link) => (
                        <li key={link.to}>
                            <Link to={link.to} className="transition hover:text-white">
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Visit us</h3>
                <ul className="space-y-3 text-sm">
                    <li className="flex gap-3">
                        <MapPin size={17} className="mt-0.5 shrink-0 text-orange-300" />
                        {SITE.address}
                    </li>
                    <li>
                        <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="flex gap-3 transition hover:text-white">
                            <Phone size={17} className="mt-0.5 shrink-0 text-orange-300" />
                            {SITE.phone}
                        </a>
                    </li>
                    <li>
                        <a href={`mailto:${SITE.email}`} className="flex gap-3 transition hover:text-white">
                            <Mail size={17} className="mt-0.5 shrink-0 text-orange-300" />
                            {SITE.email}
                        </a>
                    </li>
                </ul>
            </div>

            <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Opening hours</h3>
                <p className="flex gap-3 text-sm">
                    <Clock size={17} className="mt-0.5 shrink-0 text-orange-300" />
                    {SITE.hours}
                </p>
            </div>
        </div>

        <div className="border-t border-white/10">
            <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs sm:flex-row">
                <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
                <p>Made with care in {SITE.address.split(",")[0]}</p>
            </div>
        </div>
    </footer>
);

export default Footer;
