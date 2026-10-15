import { useState } from "react";
import { Outlet } from "react-router-dom";
import Logo from "../components/brand/Logo";
import { SITE } from "../config/site";
import AuthScene from "./auth/AuthScene";

const MAX_TILT = 10; // degrees

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Login / register: one full-screen background (no split), with the form
 * card and the 3D food scene floating side by side. The pointer anywhere on
 * the screen tilts the scene.
 */
const AuthLayout = () => {
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMove = (event) => {
        if (prefersReducedMotion()) return;

        const x = event.clientX / window.innerWidth - 0.5; // -0.5 … 0.5
        const y = event.clientY / window.innerHeight - 0.5;
        setTilt({ x: x * MAX_TILT * 2, y: -y * MAX_TILT * 2 });
    };

    return (
        <div
            onPointerMove={handleMove}
            onPointerLeave={() => setTilt({ x: 0, y: 0 })}
            className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_70%_30%,#7c2d12_0%,#231c17_50%,#120d0a_100%)]"
        >
            {/* Soft glows across the whole screen */}
            <div className="pointer-events-none absolute -left-32 top-1/3 h-120 w-120 rounded-full bg-brand/25 blur-[140px]" />
            <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-amber-400/15 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 rounded-full bg-orange-600/20 blur-[120px]" />

            <header className="container-page relative py-6">
                <Logo tone="light" />
            </header>

            <main className="container-page relative grid flex-1 items-center gap-12 py-8 lg:grid-cols-2">
                {/* Form card */}
                <div className="mx-auto w-full max-w-md animate-fade-up overflow-hidden rounded-4xl bg-surface shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
                    <div className="h-1.5 bg-linear-to-r from-brand via-amber-400 to-brand" />
                    <div className="p-6 sm:p-9">
                        <Outlet />
                    </div>
                </div>

                {/* 3D scene (desktop) */}
                <div className="hidden justify-center lg:flex">
                    <AuthScene tilt={tilt} />
                </div>
            </main>

            <footer className="container-page relative py-6 text-center text-xs text-white/50 lg:text-left">
                © {new Date().getFullYear()} {SITE.name}
            </footer>
        </div>
    );
};

export default AuthLayout;
