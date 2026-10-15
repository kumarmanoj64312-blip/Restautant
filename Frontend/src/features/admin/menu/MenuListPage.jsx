import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, ImageOff, Pencil, Plus, Search, Star, Trash2, UtensilsCrossed, XCircle } from "lucide-react";

import { deleteMenu, getMenus, setMenuAvailability, togglePopular } from "../../../api/menuApi";
import { getCategories } from "../../../api/categoryApi";
import { getErrorMessage, unwrapList } from "../../../api/client";
import { formatCurrency } from "../../../utils/format";
import {
    Badge,
    Button,
    Card,
    ConfirmDialog,
    EmptyState,
    ErrorState,
    Input,
    PageHeader,
    Pagination,
    Select,
    Skeleton,
    StatCard,
    Switch,
    Tabs,
} from "../../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../../utils/constants";

const PAGE_SIZE = 12;

// Price cell: discounted price with the original struck through
const PriceTag = ({ menu }) => {
    const price = Number(menu.price) || 0;
    const discount = Number(menu.discountPrice) || 0;

    if (discount > 0 && discount < price) {
        return (
            <div className="flex items-baseline gap-2">
                <span className="font-bold text-ink">{formatCurrency(discount)}</span>
                <span className="text-xs text-muted line-through">{formatCurrency(price)}</span>
            </div>
        );
    }

    return <span className="font-bold text-ink">{formatCurrency(price)}</span>;
};

const MenuListPage = () => {
    const { can } = useAuth();
    const canCreate = can(PERMISSIONS.MENU_CREATE);
    const canUpdate = can(PERMISSIONS.MENU_UPDATE);
    const canDelete = can(PERMISSIONS.MENU_DELETE);

    const [menus, setMenus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [availability, setAvailability] = useState("all");
    const [page, setPage] = useState(1);

    // Ids with a toggle request in flight
    const [busyIds, setBusyIds] = useState({});
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [menuRes, categoryRes] = await Promise.all([
                getMenus(),
                getCategories({ limit: 100, sort: "sortOrder", order: "asc" }).catch(() => null),
            ]);

            setMenus(unwrapList(menuRes));
            setCategories(unwrapList(categoryRes));
            setError("");
        } catch (err) {
            setError(getErrorMessage(err, "Could not load menu items."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const retry = () => {
        setLoading(true);
        setError("");
        fetchData();
    };

    const counts = useMemo(
        () => ({
            total: menus.length,
            available: menus.filter((menu) => menu.isAvailable).length,
            unavailable: menus.filter((menu) => !menu.isAvailable).length,
            popular: menus.filter((menu) => menu.isPopular).length,
        }),
        [menus]
    );

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        return menus.filter((menu) => {
            if (availability === "available" && !menu.isAvailable) return false;
            if (availability === "unavailable" && menu.isAvailable) return false;
            if (availability === "popular" && !menu.isPopular) return false;

            const categoryId = menu.category?._id || menu.category;
            if (categoryFilter && categoryId !== categoryFilter) return false;

            if (!term) return true;

            return [menu.name, menu.description, menu.category?.name]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term));
        });
    }, [menus, search, categoryFilter, availability]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Replace one menu in the list with the server's copy
    const replaceMenu = (id, updated, fallback) =>
        setMenus((list) =>
            list.map((menu) => (menu._id === id ? (updated?._id ? updated : { ...menu, ...fallback }) : menu))
        );

    const setBusy = (id, value) => setBusyIds((current) => ({ ...current, [id]: value }));

    const handleAvailability = async (menu, next) => {
        setBusy(menu._id, true);
        try {
            const res = await setMenuAvailability(menu._id, next);
            replaceMenu(menu._id, res?.data, { isAvailable: next });
            toast.success(next ? `${menu.name} is now available.` : `${menu.name} marked unavailable.`);
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not update availability."));
        } finally {
            setBusy(menu._id, false);
        }
    };

    const handlePopular = async (menu) => {
        setBusy(menu._id, true);
        try {
            const res = await togglePopular(menu._id);
            replaceMenu(menu._id, res?.data, { isPopular: !menu.isPopular });
            toast.success(res?.message || "Popular status updated.");
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not update popular status."));
        } finally {
            setBusy(menu._id, false);
        }
    };

    const handleDelete = async () => {
        if (!toDelete) return;

        setDeleting(true);
        try {
            await deleteMenu(toDelete._id);
            setMenus((list) => list.filter((menu) => menu._id !== toDelete._id));
            toast.success(`${toDelete.name} deleted.`);
            setToDelete(null);
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not delete the item."));
        } finally {
            setDeleting(false);
        }
    };

    const resetPage = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    const hasFilters = search || categoryFilter || availability !== "all";

    return (
        <div>
            <PageHeader
                eyebrow="Catalogue"
                title="Menu items"
                description="Add dishes, update prices and control what customers can order."
                actions={
                    canCreate && (
                        <Button to="/admin/menu/new" icon={Plus}>
                            Add item
                        </Button>
                    )
                }
            />

            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total items" value={loading ? "…" : counts.total} icon={UtensilsCrossed} />
                <StatCard label="Available" value={loading ? "…" : counts.available} icon={CheckCircle2} tone="success" />
                <StatCard label="Unavailable" value={loading ? "…" : counts.unavailable} icon={XCircle} tone="danger" />
                <StatCard label="Popular" value={loading ? "…" : counts.popular} icon={Star} tone="warning" />
            </div>

            <Card padding="none">
                {/* Filters */}
                <div className="space-y-4 border-b border-line p-4 sm:p-5">
                    <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
                        <Input
                            icon={Search}
                            placeholder="Search by name, description or category"
                            value={search}
                            onChange={(event) => resetPage(setSearch)(event.target.value)}
                            aria-label="Search menu items"
                        />
                        <Select
                            value={categoryFilter}
                            onChange={(event) => resetPage(setCategoryFilter)(event.target.value)}
                            placeholder="All categories"
                            options={categories.map((category) => ({ value: category._id, label: category.name }))}
                            aria-label="Filter by category"
                        />
                    </div>
                    <Tabs
                        value={availability}
                        onChange={resetPage(setAvailability)}
                        items={[
                            { value: "all", label: "All", count: counts.total },
                            { value: "available", label: "Available", count: counts.available },
                            { value: "unavailable", label: "Unavailable", count: counts.unavailable },
                            { value: "popular", label: "Popular", count: counts.popular },
                        ]}
                    />
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                    {loading ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Skeleton key={index} className="h-72" />
                            ))}
                        </div>
                    ) : error ? (
                        <ErrorState message={error} onRetry={retry} />
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            icon={UtensilsCrossed}
                            title={hasFilters ? "No items match your filters" : "No menu items yet"}
                            description={
                                hasFilters
                                    ? "Try a different search or clear the filters."
                                    : "Create your first dish to start taking orders."
                            }
                            action={
                                hasFilters ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearch("");
                                            setCategoryFilter("");
                                            setAvailability("all");
                                            setPage(1);
                                        }}
                                    >
                                        Clear filters
                                    </Button>
                                ) : (
                                    canCreate && (
                                        <Button to="/admin/menu/new" icon={Plus}>
                                            Add item
                                        </Button>
                                    )
                                )
                            }
                        />
                    ) : (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {visible.map((menu) => {
                                    const busy = !!busyIds[menu._id];

                                    return (
                                        <article
                                            key={menu._id}
                                            className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:shadow-card"
                                        >
                                            <div className="relative aspect-[16/10] bg-cream">
                                                {menu.image?.url ? (
                                                    <img
                                                        src={menu.image.url}
                                                        alt={menu.name}
                                                        loading="lazy"
                                                        className={`h-full w-full object-cover ${menu.isAvailable ? "" : "grayscale"}`}
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-muted">
                                                        <ImageOff size={28} />
                                                    </div>
                                                )}

                                                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                                                    {!menu.isAvailable && <Badge tone="danger">Unavailable</Badge>}
                                                    {menu.isPopular && (
                                                        <Badge tone="brand">
                                                            <Star size={11} className="fill-current" /> Popular
                                                        </Badge>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handlePopular(menu)}
                                                    disabled={busy || !canUpdate}
                                                    aria-label={menu.isPopular ? "Remove from popular" : "Mark as popular"}
                                                    title={menu.isPopular ? "Remove from popular" : "Mark as popular"}
                                                    className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow transition disabled:opacity-50 ${
                                                        menu.isPopular ? "text-brand" : "text-muted hover:text-brand"
                                                    }`}
                                                >
                                                    <Star size={17} className={menu.isPopular ? "fill-current" : ""} />
                                                </button>
                                            </div>

                                            <div className="flex flex-1 flex-col gap-3 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                                            {menu.category?.name || "Uncategorised"}
                                                        </p>
                                                        <h3 className="truncate font-display text-lg font-semibold text-ink">
                                                            {menu.name}
                                                        </h3>
                                                    </div>
                                                    <PriceTag menu={menu} />
                                                </div>

                                                {menu.description && (
                                                    <p className="line-clamp-2 text-sm text-muted">{menu.description}</p>
                                                )}

                                                <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
                                                    <Switch
                                                        checked={!!menu.isAvailable}
                                                        disabled={busy || !canUpdate}
                                                        onChange={(next) => handleAvailability(menu, next)}
                                                        label={menu.isAvailable ? "Available" : "Unavailable"}
                                                    />
                                                    <div className="flex gap-1.5">
                                                        {canUpdate && (
                                                            <Link
                                                                to={`/admin/menu/${menu._id}/edit`}
                                                                aria-label={`Edit ${menu.name}`}
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink transition hover:border-brand hover:text-brand"
                                                            >
                                                                <Pencil size={15} />
                                                            </Link>
                                                        )}
                                                        {canDelete && (
                                                            <Button
                                                                variant="danger-outline"
                                                                size="icon-sm"
                                                                icon={Trash2}
                                                                aria-label={`Delete ${menu.name}`}
                                                                onClick={() => setToDelete(menu)}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm text-muted">
                                    Showing {visible.length} of {filtered.length} item{filtered.length === 1 ? "" : "s"}
                                </p>
                                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
                            </div>
                        </>
                    )}
                </div>
            </Card>

            <ConfirmDialog
                open={!!toDelete}
                title="Delete menu item?"
                message={
                    toDelete
                        ? `"${toDelete.name}" and its image will be removed permanently. This cannot be undone.`
                        : ""
                }
                loading={deleting}
                onClose={() => setToDelete(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default MenuListPage;
