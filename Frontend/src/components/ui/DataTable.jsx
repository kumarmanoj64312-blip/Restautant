import { PageLoader } from "./Spinner";
import { EmptyState } from "./States";

/**
 * Simple responsive table for admin lists.
 *
 * <DataTable
 *   rows={orders}
 *   rowKey={(row) => row._id}
 *   loading={loading}
 *   empty={{ title: "No orders yet" }}
 *   columns={[
 *     { key: "name", header: "Name" },
 *     { key: "total", header: "Total", align: "right", render: (row) => formatCurrency(row.total) },
 *   ]}
 *   rowClassName={(row) => (row.highlight ? "bg-amber-50/60" : "")}   // optional
 * />
 */
const DataTable = ({ columns, rows = [], rowKey = (row) => row._id, loading = false, empty = {}, onRowClick, rowClassName }) => {
    if (loading) return <PageLoader />;

    if (rows.length === 0) {
        return <EmptyState title={empty.title || "Nothing here yet"} description={empty.description} icon={empty.icon} action={empty.action} />;
    }

    const alignClass = (align) =>
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
                <thead>
                    <tr className="border-b border-line bg-canvas/70">
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                scope="col"
                                className={`whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted ${alignClass(column.align)} ${column.className || ""}`}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-line">
                    {rows.map((row, index) => (
                        <tr
                            key={rowKey(row, index)}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            className={`transition hover:bg-canvas/60 ${onRowClick ? "cursor-pointer" : ""} ${rowClassName?.(row) || ""}`}
                        >
                            {columns.map((column) => (
                                <td
                                    key={column.key}
                                    className={`px-4 py-3 align-middle text-ink ${alignClass(column.align)} ${column.className || ""}`}
                                >
                                    {column.render ? column.render(row, index) : row[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
