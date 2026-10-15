import { useCallback, useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { getPopularMenus } from "../../../api/menuApi";
import { getErrorMessage, unwrapList } from "../../../api/client";
import { Button, EmptyState, ErrorState } from "../../../components/ui";
import MenuCard, { MenuCardSkeleton } from "../../menu/components/MenuCard";
import SectionHeading from "./SectionHeading";

const LIMIT = 8;

const PopularSection = () => {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getPopularMenus(LIMIT);
            setMenus(unwrapList(response));
        } catch (err) {
            setError(getErrorMessage(err, "Popular dishes couldn't be loaded."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <section className="section" aria-labelledby="popular-heading">
            <div className="container-page">
                <SectionHeading
                    eyebrow="Guest favourites"
                    id="popular-heading"
                    title="Our most-loved dishes"
                    description="The plates our regulars keep coming back for."
                    linkTo="/menu"
                    linkLabel="See the full menu"
                />

                {loading ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }, (_, index) => (
                            <MenuCardSkeleton key={index} />
                        ))}
                    </div>
                ) : error ? (
                    <ErrorState message={error} onRetry={load} className="py-8" />
                ) : menus.length === 0 ? (
                    <EmptyState
                        icon={UtensilsCrossed}
                        title="No favourites picked yet"
                        description="Our chefs are still choosing their highlights. Browse the full menu instead."
                        action={<Button to="/menu">Browse menu</Button>}
                        className="py-8"
                    />
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {menus.map((menu) => (
                            <MenuCard key={menu._id} menu={menu} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default PopularSection;
