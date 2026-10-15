import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, CalendarRange, GalleryHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { changeHeroDisplayOrder, deleteHero, getHeroes, toggleHeroStatus } from "../../../api/heroApi";
import { getErrorMessage, unwrapList } from "../../../api/client";
import { formatDate } from "../../../utils/format";
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, PageHeader, Skeleton, Switch } from "../../../components/ui";
import HeroFormModal from "./HeroFormModal";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../../utils/constants";

// Banners are active unless explicitly switched off
const isHeroActive = (hero) => hero.isActive !== false;

// Sort by displayOrder, then oldest first
const sortHeroes = (list) =>
    [...list].sort(
        (a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0) || new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    );

const HeroPage = () => {
    const { can } = useAuth();
    const canCreate = can(PERMISSIONS.BANNERS_CREATE);
    const canUpdate = can(PERMISSIONS.BANNERS_UPDATE);
    const canDelete = can(PERMISSIONS.BANNERS_DELETE);

    const [heroes, setHeroes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal state: `editing` is null for a new banner; `formKey` remounts the form
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formKey, setFormKey] = useState(0);

    const [busyIds, setBusyIds] = useState({});
    const [reordering, setReordering] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchHeroes = useCallback(async () => {
        try {
            const res = await getHeroes();
            setHeroes(unwrapList(res));
            setError("");
        } catch (err) {
            setError(getErrorMessage(err, "Could not load hero banners."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHeroes();
    }, [fetchHeroes]);

    const retry = () => {
        setLoading(true);
        setError("");
        fetchHeroes();
    };

    const sorted = useMemo(() => sortHeroes(heroes), [heroes]);
    const activeCount = heroes.filter(isHeroActive).length;
    const nextOrder = heroes.reduce((max, hero) => Math.max(max, Number(hero.displayOrder) || 0), 0) + 1;

    const openForm = (hero = null) => {
        setEditing(hero);
        setFormKey((key) => key + 1);
        setFormOpen(true);
    };

    const handleSaved = (saved) => {
        setFormOpen(false);

        if (saved?._id) {
            setHeroes((list) =>
                list.some((hero) => hero._id === saved._id)
                    ? list.map((hero) => (hero._id === saved._id ? saved : hero))
                    : [...list, saved],
            );
        } else {
            fetchHeroes();
        }
    };

    const handleToggle = async (hero) => {
        setBusyIds((current) => ({ ...current, [hero._id]: true }));
        try {
            const res = await toggleHeroStatus(hero._id);
            const updated = res?.data;
            setHeroes((list) =>
                list.map((item) => (item._id === hero._id ? (updated?._id ? updated : { ...item, isActive: !isHeroActive(item) }) : item)),
            );
            toast.success(res?.message || "Banner status updated.");
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not update the banner."));
        } finally {
            setBusyIds((current) => ({ ...current, [hero._id]: false }));
        }
    };

    // Move a banner up/down, then renumber every banner 1..n and save the changed ones
    const handleMove = async (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= sorted.length) return;

        const reordered = [...sorted];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

        const changes = reordered
            .map((hero, position) => ({ hero, order: position + 1 }))
            .filter(({ hero, order }) => Number(hero.displayOrder) !== order);

        const previous = heroes;
        const orderById = Object.fromEntries(changes.map(({ hero, order }) => [hero._id, order]));
        setHeroes((list) => list.map((hero) => (orderById[hero._id] ? { ...hero, displayOrder: orderById[hero._id] } : hero)));

        setReordering(true);
        try {
            await Promise.all(changes.map(({ hero, order }) => changeHeroDisplayOrder(hero._id, order)));
            toast.success("Banner order updated.");
        } catch (err) {
            setHeroes(previous);
            toast.error(getErrorMessage(err, "Could not change the order."));
            fetchHeroes();
        } finally {
            setReordering(false);
        }
    };

    const handleDelete = async () => {
        if (!toDelete) return;

        setDeleting(true);
        try {
            await deleteHero(toDelete._id);
            setHeroes((list) => list.filter((hero) => hero._id !== toDelete._id));
            toast.success("Banner deleted.");
            setToDelete(null);
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not delete the banner."));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <PageHeader
                eyebrow="Storefront"
                title="Hero banners"
                description={
                    loading
                        ? "Manage the slides at the top of the home page."
                        : `${heroes.length} banner${heroes.length === 1 ? "" : "s"}, ${activeCount} active. Lower order shows first.`
                }
                actions={
                    canCreate && (
                        <Button icon={Plus} onClick={() => openForm(null)}>
                            Add banner
                        </Button>
                    )
                }
            />

            {loading ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-80" />
                    ))}
                </div>
            ) : error ? (
                <Card>
                    <ErrorState message={error} onRetry={retry} />
                </Card>
            ) : sorted.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={GalleryHorizontal}
                        title="No banners yet"
                        description="Add a banner to greet customers on the home page."
                        action={
                            canCreate && (
                                <Button icon={Plus} onClick={() => openForm(null)}>
                                    Add banner
                                </Button>
                            )
                        }
                    />
                </Card>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {sorted.map((hero, index) => {
                        const active = isHeroActive(hero);
                        const busy = !!busyIds[hero._id];

                        return (
                            <article
                                key={hero._id}
                                className={`flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card ${
                                    active ? "" : "opacity-80"
                                }`}
                            >
                                <div className="relative aspect-video bg-cream">
                                    {hero.image?.url && (
                                        <img
                                            src={hero.image.url}
                                            alt={hero.title || "Hero banner"}
                                            loading="lazy"
                                            className={`h-full w-full object-cover ${active ? "" : "grayscale"}`}
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />

                                    <div className="absolute left-3 top-3 flex gap-1.5">
                                        <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-bold text-ink">
                                            #{index + 1}
                                        </span>
                                        <Badge tone={active ? "success" : "neutral"} dot>
                                            {active ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>

                                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                                        {hero.badge && (
                                            <span className="mb-1 inline-block rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                                                {hero.badge}
                                            </span>
                                        )}
                                        <h3 className="line-clamp-1 font-display text-lg font-semibold">
                                            {hero.title || "Untitled banner"}
                                        </h3>
                                        {hero.subtitle && <p className="line-clamp-1 text-sm text-white/85">{hero.subtitle}</p>}
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col gap-3 p-4">
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                                        {hero.buttonText && (
                                            <span>
                                                Button: <strong className="text-ink">{hero.buttonText}</strong>
                                                {hero.buttonLink && <> → {hero.buttonLink}</>}
                                            </span>
                                        )}
                                        {hero.offerText && <span>Offer: {hero.offerText}</span>}
                                        {(hero.startDate || hero.endDate) && (
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarRange size={13} />
                                                {formatDate(hero.startDate) || "Now"} – {formatDate(hero.endDate) || "No end"}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
                                        <Switch
                                            checked={active}
                                            disabled={busy || !canUpdate}
                                            onChange={() => handleToggle(hero)}
                                            label={active ? "Visible" : "Hidden"}
                                        />

                                        <div className="flex gap-1.5">
                                            {canUpdate && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="icon-sm"
                                                        icon={ArrowUp}
                                                        aria-label="Move up"
                                                        title="Move up"
                                                        disabled={index === 0 || reordering}
                                                        onClick={() => handleMove(index, -1)}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon-sm"
                                                        icon={ArrowDown}
                                                        aria-label="Move down"
                                                        title="Move down"
                                                        disabled={index === sorted.length - 1 || reordering}
                                                        onClick={() => handleMove(index, 1)}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon-sm"
                                                        icon={Pencil}
                                                        aria-label="Edit banner"
                                                        onClick={() => openForm(hero)}
                                                    />
                                                </>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    variant="danger-outline"
                                                    size="icon-sm"
                                                    icon={Trash2}
                                                    aria-label="Delete banner"
                                                    onClick={() => setToDelete(hero)}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {formOpen && (
                <HeroFormModal
                    key={formKey}
                    open={formOpen}
                    hero={editing}
                    nextOrder={nextOrder}
                    onClose={() => setFormOpen(false)}
                    onSaved={handleSaved}
                />
            )}

            <ConfirmDialog
                open={!!toDelete}
                title="Delete banner?"
                message={toDelete ? `"${toDelete.title || "This banner"}" and its image will be removed permanently.` : ""}
                loading={deleting}
                onClose={() => setToDelete(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default HeroPage;
