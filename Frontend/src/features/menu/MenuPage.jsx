import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SearchX, X } from "lucide-react";
import { getMenus } from "../../api/menuApi";
import { getActiveCategories } from "../../api/categoryApi";
import { getErrorMessage, unwrapList } from "../../api/client";
import { Button, EmptyState, ErrorState, Input, Pagination, Skeleton, Tabs } from "../../components/ui";
import MenuCard, { MenuCardSkeleton } from "./components/MenuCard";
import { getCategoryId, sortCategories } from "./menuUtils";

const PER_PAGE = 12;

const MenuPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryParam = searchParams.get("category") || "all";

    const [menus, setMenus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [menuResponse, categoryResponse] = await Promise.all([
                getMenus(),
                // The menu still works if categories fail
                getActiveCategories().catch(() => null),
            ]);

            setMenus(unwrapList(menuResponse));
            setCategories(sortCategories(unwrapList(categoryResponse)));
        } catch (err) {
            setError(getErrorMessage(err, "We couldn't load the menu right now."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // ?category= accepts a category id or slug
    const activeCategoryId = useMemo(() => {
        if (categoryParam === "all") return "all";

        const match = categories.find((item) => item._id === categoryParam || item.slug === categoryParam);
        return match?._id || categoryParam;
    }, [categories, categoryParam]);

    const counts = useMemo(() => {
        const map = {};
        menus.forEach((menu) => {
            const id = getCategoryId(menu);
            if (id) map[id] = (map[id] || 0) + 1;
        });
        return map;
    }, [menus]);

    const tabs = useMemo(
        () => [
            { value: "all", label: "All dishes", count: menus.length },
            ...categories
                .filter((category) => counts[category._id] || category._id === activeCategoryId)
                .map((category) => ({
                    value: category._id,
                    label: category.name,
                    count: counts[category._id] || 0,
                })),
        ],
        [categories, counts, menus.length, activeCategoryId]
    );

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        return menus
            .filter((menu) => activeCategoryId === "all" || getCategoryId(menu) === activeCategoryId)
            .filter(
                (menu) =>
                    !term ||
                    menu.name?.toLowerCase().includes(term) ||
                    menu.description?.toLowerCase().includes(term) ||
                    menu.category?.name?.toLowerCase().includes(term)
            )
            // Orderable dishes first
            .sort((a, b) => Number(b.isAvailable !== false) - Number(a.isAvailable !== false));
    }, [menus, activeCategoryId, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    const selectCategory = (value) => {
        setPage(1);
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                if (value === "all") next.delete("category");
                else next.set("category", value);
                return next;
            },
            { replace: true }
        );
    };

    const changePage = (next) => {
        setPage(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const resetFilters = () => {
        setSearch("");
        selectCategory("all");
    };

    const activeCategoryName = categories.find((item) => item._id === activeCategoryId)?.name;

    return (
        <>
            <section className="border-b border-line bg-cream/60">
                <div className="container-page py-12 sm:py-16">
                    <p className="eyebrow">Our menu</p>
                    <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">
                        Made fresh, every order
                    </h1>
                    <p className="mt-3 max-w-xl text-muted">
                        Browse our kitchen&apos;s full line-up, from slow-cooked curries to wood-fired pizzas and
                        desserts. Add your favourites to the cart in a tap.
                    </p>

                    <div className="relative mt-8 max-w-xl">
                        <Input
                            type="text"
                            enterKeyHint="search"
                            icon={Search}
                            aria-label="Search dishes"
                            placeholder="Search dishes, e.g. biryani"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            className="[&_input]:h-12 [&_input]:pr-10 [&_input]:shadow-card"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted transition hover:bg-cream hover:text-ink"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <section className="container-page py-8 sm:py-10">
                {loading ? (
                    <>
                        <div className="mb-8 flex gap-2 overflow-hidden" aria-hidden="true">
                            {Array.from({ length: 6 }, (_, index) => (
                                <Skeleton key={index} className="h-9 w-24 shrink-0 rounded-full" />
                            ))}
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status">
                            <span className="sr-only">Loading menu…</span>
                            {Array.from({ length: 8 }, (_, index) => (
                                <MenuCardSkeleton key={index} />
                            ))}
                        </div>
                    </>
                ) : error ? (
                    <ErrorState title="Menu unavailable" message={error} onRetry={load} />
                ) : menus.length === 0 ? (
                    <EmptyState
                        title="The menu is being prepared"
                        description="Our chefs haven't added any dishes yet. Please check back soon."
                    />
                ) : (
                    <>
                        <nav aria-label="Menu categories" className="mb-6">
                            <Tabs items={tabs} value={activeCategoryId} onChange={selectCategory} />
                        </nav>

                        <p className="mb-5 text-sm text-muted" aria-live="polite">
                            Showing <span className="font-semibold text-ink">{filtered.length}</span>{" "}
                            {filtered.length === 1 ? "dish" : "dishes"}
                            {activeCategoryName && (
                                <>
                                    {" "}in <span className="font-semibold text-ink">{activeCategoryName}</span>
                                </>
                            )}
                            {search.trim() && (
                                <>
                                    {" "}for &ldquo;<span className="font-semibold text-ink">{search.trim()}</span>&rdquo;
                                </>
                            )}
                        </p>

                        {visible.length === 0 ? (
                            <EmptyState
                                icon={SearchX}
                                title="No dishes match"
                                description="Try a different search or browse all categories."
                                action={
                                    <Button variant="outline" onClick={resetFilters}>
                                        Show all dishes
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {visible.map((menu) => (
                                    <MenuCard key={menu._id} menu={menu} />
                                ))}
                            </div>
                        )}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={changePage}
                            className="mt-10"
                        />
                    </>
                )}
            </section>
        </>
    );
};

export default MenuPage;
