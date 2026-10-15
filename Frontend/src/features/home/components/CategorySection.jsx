import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { getActiveCategories } from "../../../api/categoryApi";
import { getErrorMessage, unwrapList } from "../../../api/client";
import { EmptyState, ErrorState, Skeleton } from "../../../components/ui";
import { sortCategories } from "../../menu/menuUtils";
import SectionHeading from "./SectionHeading";

const MAX_SHOWN = 12;

const CategorySection = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getActiveCategories();
            setCategories(sortCategories(unwrapList(response)).slice(0, MAX_SHOWN));
        } catch (err) {
            setError(getErrorMessage(err, "Categories couldn't be loaded."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <section className="section bg-surface" aria-labelledby="categories-heading">
            <div className="container-page">
                <SectionHeading
                    eyebrow="Explore"
                    id="categories-heading"
                    title="What are you craving?"
                    linkTo="/menu"
                    linkLabel="Full menu"
                />

                {loading ? (
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4" aria-hidden="true">
                        {Array.from({ length: 6 }, (_, index) => (
                            <div key={index} className="space-y-3">
                                <Skeleton className="aspect-square rounded-2xl" />
                                <Skeleton className="mx-auto h-4 w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <ErrorState message={error} onRetry={load} className="py-8" />
                ) : categories.length === 0 ? (
                    <EmptyState
                        icon={LayoutGrid}
                        title="Categories coming soon"
                        description="We're still arranging the menu. You can browse all dishes in the meantime."
                        className="py-8"
                    />
                ) : (
                    <ul className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x-4 gap-y-6">
                        {categories.map((category) => (
                            <li key={category._id}>
                                <Link to={`/menu?category=${category._id}`} className="group block text-center">
                                    <span className="block aspect-square overflow-hidden rounded-2xl bg-cream ring-1 ring-line transition group-hover:shadow-lift group-hover:ring-brand/40">
                                        {category.image?.url ? (
                                            <img
                                                src={category.image.url}
                                                alt=""
                                                loading="lazy"
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center font-display text-3xl font-semibold text-brand/70">
                                                {category.name?.charAt(0)}
                                            </span>
                                        )}
                                    </span>
                                    <span className="mt-3 block truncate text-sm font-semibold text-ink transition group-hover:text-brand sm:text-base">
                                        {category.name}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
};

export default CategorySection;
