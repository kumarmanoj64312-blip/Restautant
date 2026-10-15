import { ChevronLeft, ChevronRight } from "lucide-react";

const buildPages = (current, total, siblings = 1) => {
    const pages = [];
    const left = Math.max(current - siblings, 1);
    const right = Math.min(current + siblings, total);

    if (left > 1) {
        pages.push(1);
        if (left > 2) pages.push("left-gap");
    }

    for (let page = left; page <= right; page++) pages.push(page);

    if (right < total) {
        if (right < total - 1) pages.push("right-gap");
        pages.push(total);
    }

    return pages;
};

// <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />
const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange, className = "" }) => {
    if (totalPages <= 1) return null;

    const navButton =
        "flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink transition hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-40";

    return (
        <nav aria-label="Pagination" className={`flex items-center justify-center gap-1.5 ${className}`}>
            <button
                type="button"
                className={navButton}
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
            >
                <ChevronLeft size={17} />
            </button>

            {buildPages(currentPage, totalPages).map((page) =>
                typeof page === "number" ? (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        aria-current={page === currentPage ? "page" : undefined}
                        className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${
                            page === currentPage
                                ? "bg-brand text-white"
                                : "border border-line bg-surface text-ink hover:border-brand hover:text-brand"
                        }`}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={page} className="px-1 text-muted">
                        …
                    </span>
                )
            )}

            <button
                type="button"
                className={navButton}
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
            >
                <ChevronRight size={17} />
            </button>
        </nav>
    );
};

export default Pagination;
