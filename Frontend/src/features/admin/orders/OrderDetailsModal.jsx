import { MapPin, StickyNote, XCircle } from "lucide-react";

import { Badge, Button, Modal, Select, StatusBadge } from "../../../components/ui";
import { formatCurrency, formatDateTime, formatOrderId } from "../../../utils/format";
import {
    canCancelOrder,
    getCustomerContact,
    getCustomerName,
    getNextStatuses,
    getOrderTypeLabel,
} from "./orderUtils";

const SummaryRow = ({ label, value, strong = false }) => (
    <div className={`flex justify-between gap-4 ${strong ? "text-base font-bold text-ink" : "text-sm text-muted"}`}>
        <span>{label}</span>
        <span className={strong ? "" : "text-ink"}>{value}</span>
    </div>
);

// Full order view with status update and cancel actions
const OrderDetailsModal = ({ order, onClose, onStatusChange, onCancel, canUpdate = true, canCancel = true, updating = false }) => {
    if (!order) return null;

    const nextStatuses = canUpdate ? getNextStatuses(order) : [];
    const address = order.shippingAddress;

    return (
        <Modal
            open={!!order}
            onClose={onClose}
            size="lg"
            title={`Order ${formatOrderId(order._id)}`}
            description={`${order.orderNumber ? `${order.orderNumber} · ` : ""}${formatDateTime(order.createdAt)}`}
            footer={
                <>
                    {canCancel && canCancelOrder(order) && (
                        <Button variant="danger-outline" icon={XCircle} onClick={() => onCancel(order)} disabled={updating}>
                            Cancel order
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                {/* Status and quick facts */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 rounded-2xl bg-canvas p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted">Customer</p>
                        <p className="font-semibold text-ink">{getCustomerName(order)}</p>
                        {getCustomerContact(order) && <p className="text-sm text-muted">{getCustomerContact(order)}</p>}
                        <div className="flex flex-wrap gap-2 pt-1">
                            <Badge tone="brand">{getOrderTypeLabel(order)}</Badge>
                            <Badge>{order.paymentMethod}</Badge>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-2xl bg-canvas p-4">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold uppercase tracking-wide text-muted">Order status</span>
                            <StatusBadge status={order.orderStatus} />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold uppercase tracking-wide text-muted">Payment</span>
                            <StatusBadge status={order.paymentStatus} />
                        </div>
                        {nextStatuses.length > 0 && (
                            <Select
                                aria-label="Move order to"
                                value=""
                                disabled={updating}
                                onChange={(event) => event.target.value && onStatusChange(order, event.target.value)}
                                placeholder="Move to…"
                                options={nextStatuses.map((status) => ({ value: status, label: status }))}
                            />
                        )}
                    </div>
                </div>

                {/* Items */}
                <div>
                    <h3 className="mb-3 text-sm font-bold text-ink">Items</h3>
                    <ul className="divide-y divide-line rounded-2xl border border-line">
                        {(order.items || []).map((item, index) => (
                            <li key={`${item.menu?._id || item.menu || item.name}-${index}`} className="flex items-center gap-3 p-3">
                                {item.image?.url ? (
                                    <img src={item.image.url} alt={item.name} className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                                ) : (
                                    <span className="h-11 w-11 shrink-0 rounded-xl bg-cream" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                                    <p className="text-xs text-muted">
                                        {item.quantity} × {formatCurrency(item.price)}
                                    </p>
                                </div>
                                <span className="text-sm font-semibold text-ink">
                                    {formatCurrency(item.total ?? item.price * item.quantity)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Address and notes */}
                {(address || order.notes) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {address && (
                            <div className="rounded-2xl border border-line p-4 text-sm">
                                <p className="mb-2 flex items-center gap-2 font-bold text-ink">
                                    <MapPin size={16} className="text-brand" /> Delivery address
                                </p>
                                <p className="text-ink">{address.name}</p>
                                <p className="text-muted">{address.phone}</p>
                                <p className="mt-1 text-muted">
                                    {[address.address, address.city, address.state, address.pincode].filter(Boolean).join(", ")}
                                </p>
                            </div>
                        )}
                        {order.notes && (
                            <div className="rounded-2xl border border-line p-4 text-sm">
                                <p className="mb-2 flex items-center gap-2 font-bold text-ink">
                                    <StickyNote size={16} className="text-brand" /> Notes
                                </p>
                                <p className="whitespace-pre-line text-muted">{order.notes}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Totals */}
                <div className="space-y-2 rounded-2xl bg-canvas p-4">
                    <SummaryRow label="Subtotal" value={formatCurrency(order.subtotal)} />
                    {Number(order.deliveryCharge) > 0 && (
                        <SummaryRow label="Delivery" value={formatCurrency(order.deliveryCharge)} />
                    )}
                    {Number(order.tax) > 0 && <SummaryRow label="Tax" value={formatCurrency(order.tax)} />}
                    {Number(order.discount) > 0 && (
                        <SummaryRow label="Discount" value={`− ${formatCurrency(order.discount)}`} />
                    )}
                    <div className="border-t border-line pt-2">
                        <SummaryRow label="Total" value={formatCurrency(order.totalAmount)} strong />
                    </div>
                </div>

                {(order.deliveredAt || order.cancelledAt) && (
                    <p className="text-xs text-muted">
                        {order.deliveredAt && `Delivered ${formatDateTime(order.deliveredAt)}. `}
                        {order.cancelledAt && `Cancelled ${formatDateTime(order.cancelledAt)}.`}
                    </p>
                )}
            </div>
        </Modal>
    );
};

export default OrderDetailsModal;
