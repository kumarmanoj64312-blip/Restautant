import { formatCurrency } from "../../utils/format";

// Subtotal / delivery / tax / total block shared by the cart and checkout pages
const OrderSummary = ({ itemCount, subtotal, deliveryCharge, tax, taxRate, total }) => (
    <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
            <dt className="text-muted">
                Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
            </dt>
            <dd className="font-semibold text-ink">{formatCurrency(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className={`font-semibold ${deliveryCharge > 0 ? "text-ink" : "text-success"}`}>
                {deliveryCharge > 0 ? formatCurrency(deliveryCharge) : "Free"}
            </dd>
        </div>
        {tax > 0 && (
            <div className="flex justify-between">
                <dt className="text-muted">Tax ({taxRate}%)</dt>
                <dd className="font-semibold text-ink">{formatCurrency(tax)}</dd>
            </div>
        )}
        <div className="flex items-baseline justify-between border-t border-dashed border-line pt-4">
            <dt className="text-base font-bold text-ink">Total</dt>
            <dd className="font-display text-2xl font-semibold text-brand">{formatCurrency(total)}</dd>
        </div>
    </dl>
);

export default OrderSummary;
