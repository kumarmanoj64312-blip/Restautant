import { Clock, Star } from "lucide-react";

const img = (id, width) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

const MAIN_IMAGE = img("photo-1504674900247-0877df9cc836", 900);

// Round dishes floating around the photo's edges, each in its own corner
const DISHES = [
    { src: img("photo-1565299624946-b28f40a0ae38", 300), alt: "Pizza", position: "-left-14 -top-10", size: "h-32 w-32", depth: 70, delay: "0s" },
    { src: img("photo-1546069901-ba9599a7e63c", 300), alt: "Salad bowl", position: "-right-16 top-[38%]", size: "h-36 w-36", depth: 90, delay: "1.2s" },
    { src: img("photo-1568901346375-23c9450c58cd", 300), alt: "Burger", position: "-bottom-12 -right-4", size: "h-28 w-28", depth: 60, delay: "2.1s" },
];

// Outer element sets depth (translateZ); inner element floats, so the two transforms don't clash
const Layer = ({ position, depth, delay, children }) => (
    <div className={`absolute ${position}`} style={{ transform: `translateZ(${depth}px)` }}>
        <div className="animate-float" style={{ animationDelay: delay }}>
            {children}
        </div>
    </div>
);

/**
 * 3D food scene for the login / register screen. `tilt` ({ x, y } in degrees)
 * comes from the layout, which tracks the pointer across the whole screen.
 */
const AuthScene = ({ tilt }) => (
    <div className="flex flex-col items-center gap-16">
        <div className="relative perspective-[1400px]">
            <div
                className="relative h-100 w-82.5 transition-transform duration-300 ease-out transform-3d xl:h-115 xl:w-95"
                style={{ transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}
            >
                {/* Glow far behind the photo */}
                <div className="absolute inset-8 rounded-4xl bg-brand/50 blur-3xl transform-[translateZ(-80px)]" />

                {/* Main photo */}
                <div className="absolute inset-0 overflow-hidden rounded-4xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/15">
                    <img src={MAIN_IMAGE} alt="Grilled dish with fresh salad" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-linear-to-tr from-black/30 via-transparent to-white/10" />
                </div>

                {DISHES.map((dish) => (
                    <Layer key={dish.alt} position={dish.position} depth={dish.depth} delay={dish.delay}>
                        <img
                            src={dish.src}
                            alt={dish.alt}
                            className={`${dish.size} rounded-full object-cover shadow-[0_25px_45px_-12px_rgba(0,0,0,0.75)] ring-4 ring-white`}
                        />
                    </Layer>
                ))}

                {/* Rating (top right) */}
                <Layer position="-right-10 -top-6" depth={110} delay="0.6s">
                    <div className="rounded-2xl bg-white px-4 py-3 shadow-2xl">
                        <div className="flex gap-0.5 text-amber-400">
                            {[...Array(5)].map((_, index) => (
                                <Star key={index} size={13} fill="currentColor" />
                            ))}
                        </div>
                        <p className="mt-1 text-sm font-bold text-ink">4.8 guest rating</p>
                    </div>
                </Layer>

                {/* Cooked to order (bottom left) */}
                <Layer position="-left-16 bottom-12" depth={100} delay="1.6s">
                    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-2xl">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                            <Clock size={18} />
                        </span>
                        <span>
                            <span className="block whitespace-nowrap text-sm font-bold text-ink">Cooked to order</span>
                            <span className="block text-xs text-muted">Ready in ~30 min</span>
                        </span>
                    </div>
                </Layer>
            </div>
        </div>

        {/* Quote, below the scene so nothing covers it */}
        <figure className="max-w-md text-center text-white">
            <div className="mb-3 flex justify-center gap-1 text-amber-300">
                {[...Array(5)].map((_, index) => (
                    <Star key={index} size={16} fill="currentColor" />
                ))}
            </div>
            <blockquote className="font-display text-2xl leading-snug">
                “The butter chicken here is the best in town. It arrives hot, every time.”
            </blockquote>
            <figcaption className="mt-3 text-sm text-white/70">Regular guest since 2023</figcaption>
        </figure>
    </div>
);

export default AuthScene;
