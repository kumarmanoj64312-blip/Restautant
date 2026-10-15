import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, FolderOpen, ImageOff, Layers, Pencil, Plus, Search, Trash2, XCircle } from "lucide-react";

import { deleteCategory, getCategories, toggleCategoryStatus } from "../../../api/categoryApi";
import { getMenus } from "../../../api/menuApi";
import { getErrorMessage, unwrapList } from "../../../api/client";
import {
    Badge,
    Button,
    Card,
    ConfirmDialog,
    DataTable,
    ErrorState,
    Input,
    PageHeader,
    StatCard,
    Switch,
    Tabs,
} from "../../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../../utils/constants";

const CategoryListPage = () => {
    const { can } = useAuth();
    const canCreate = can(PERMISSIONS.CATEGORIES_CREATE);
    const canUpdate = can(PERMISSIONS.CATEGORIES_UPDATE);
    const canDelete = can(PERMISSIONS.CATEGORIES_DELETE);

    const [categories, setCategories] = useState([]);
    // categoryId -> number of menu items using it (null if menus failed to load)
    const [menuCounts, setMenuCounts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");

    const [busyIds, setBusyIds] = useState({});
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [categoryRes, menuRes] = await Promise.all([
                getCategories({ limit: 100, sort: "sortOrder", order: "asc" }),
                getMenus().catch(() => null),
            ]);

            setCategories(unwrapList(categoryRes));

            if (menuRes) {
                const counts = {};
                unwrapList(menuRes).forEach((menu) => {
                    const key = menu.category?._id || menu.category;
                    if (key) counts[key] = (counts[key] || 0) + 1;
                });
                setMenuCounts(counts);
            } else {
                setMenuCounts(null);
            }

            setError("");
        } catch (err) {
            setError(getErrorMessage(err, "Could not load categories."));
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
            total: categories.length,
            active: categories.filter((category) => category.isActive).length,
            inactive: categories.filter((category) => !category.isActive).length,
        }),
        [categories]
    );

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        return categories.filter((category) => {
            if (status === "active" && !category.isActive) return false;
            if (status === "inactive" && category.isActive) return false;
            if (!term) return true;

            return [category.name, category.description, category.slug]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term));
        });
    }, [categories, search, status]);

    const handleToggle = async (category) => {
        setBusyIds((current) => ({ ...current, [category._id]: true }));
        try {
            const res = await toggleCategoryStatus(category._id);
            const updated = res?.data;

            setCategories((list) =>
                list.map((item) =>
                    item._id === category._id
                        ? updated?._id
                            ? updated
                            : { ...item, isActive: !item.isActive }
                        : item
                )
            );
            toast.success(res?.message || "Category status updated.");
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not update status."));
        } finally {
            setBusyIds((current) => ({ ...current, [category._id]: false }));
        }
    };

    const handleDelete = async () => {
        if (!toDelete) return;

        setDeleting(true);
        try {
            await deleteCategory(toDelete._id);
            setCategories((list) => list.filter((item) => item._id !== toDelete._id));
            toast.success(`${toDelete.name} deleted.`);
            setToDelete(null);
        } catch (err) {
            // Backend refusals (e.g. category in use) come back as a message
            toast.error(getErrorMessage(err, "Could not delete the category."));
        } finally {
            setDeleting(false);
        }
    };

    const usedBy = toDelete && menuCounts ? menuCounts[toDelete._id] || 0 : 0;

    const columns = [
        {
            key: "name",
            header: "Category",
            render: (category) => (
                <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream text-muted">
                        {category.image?.url ? (
                            <img src={category.image.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                            <ImageOff size={18} />
                        )}
                    </span>
                    <div className="min-w-0">
                        <p className="font-semibold text-ink">{category.name}</p>
                        <p className="text-xs text-muted">/{category.slug}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "description",
            header: "Description",
            className: "max-w-xs",
            render: (category) => (
                <p className="line-clamp-2 text-sm text-muted">{category.description || "—"}</p>
            ),
        },
        {
            key: "items",
            header: "Items",
            align: "center",
            render: (category) =>
                menuCounts ? <Badge tone="neutral">{menuCounts[category._id] || 0}</Badge> : <span className="text-muted">—</span>,
        },
        {
            key: "sortOrder",
            header: "Order",
            align: "center",
            render: (category) => <span className="font-semibold">{category.sortOrder ?? 0}</span>,
        },
        {
            key: "status",
            header: "Status",
            render: (category) => (
                <Switch
                    checked={!!category.isActive}
                    disabled={!!busyIds[category._id] || !canUpdate}
                    onChange={() => handleToggle(category)}
                    label={category.isActive ? "Active" : "Inactive"}
                />
            ),
        },
        {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (category) => (
                <div className="flex justify-end gap-1.5">
                    {canUpdate && (
                        <Link
                            to={`/admin/categories/${category._id}/edit`}
                            aria-label={`Edit ${category.name}`}
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
                            aria-label={`Delete ${category.name}`}
                            onClick={() => setToDelete(category)}
                        />
                    )}
                </div>
            ),
        },
    ];

    const hasFilters = search || status !== "all";

    return (
        <div>
            <PageHeader
                eyebrow="Catalogue"
                title="Categories"
                description="Group dishes into sections and choose the order customers see them in."
                actions={
                    canCreate && (
                        <Button to="/admin/categories/new" icon={Plus}>
                            Add category
                        </Button>
                    )
                }
            />

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Total categories" value={loading ? "…" : counts.total} icon={Layers} />
                <StatCard label="Active" value={loading ? "…" : counts.active} icon={CheckCircle2} tone="success" />
                <StatCard label="Inactive" value={loading ? "…" : counts.inactive} icon={XCircle} tone="danger" />
            </div>

            <Card padding="none">
                <div className="flex flex-col gap-4 border-b border-line p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
                    <Input
                        icon={Search}
                        placeholder="Search categories"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Search categories"
                        className="md:w-80"
                    />
                    <Tabs
                        value={status}
                        onChange={setStatus}
                        items={[
                            { value: "all", label: "All", count: counts.total },
                            { value: "active", label: "Active", count: counts.active },
                            { value: "inactive", label: "Inactive", count: counts.inactive },
                        ]}
                    />
                </div>

                {error && !loading ? (
                    <ErrorState message={error} onRetry={retry} />
                ) : (
                    <DataTable
                        columns={columns}
                        rows={filtered}
                        loading={loading}
                        empty={{
                            icon: FolderOpen,
                            title: hasFilters ? "No categories match your filters" : "No categories yet",
                            description: hasFilters
                                ? "Try a different search or status."
                                : "Create a category to start organising your menu.",
                            action: hasFilters || !canCreate ? undefined : (
                                <Button to="/admin/categories/new" icon={Plus}>
                                    Add category
                                </Button>
                            ),
                        }}
                    />
                )}
            </Card>

            <ConfirmDialog
                open={!!toDelete}
                title="Delete category?"
                message={
                    toDelete
                        ? usedBy > 0
                            ? `"${toDelete.name}" is used by ${usedBy} menu item${usedBy === 1 ? "" : "s"}. Those items will be left without a category. Consider deactivating it instead. This cannot be undone.`
                            : `"${toDelete.name}" will be removed permanently. This cannot be undone.`
                        : ""
                }
                loading={deleting}
                onClose={() => setToDelete(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default CategoryListPage;
