import { useState } from "react";
import { RotateCcw } from "lucide-react";

import { Alert, Button, Input, Modal, Textarea } from "../../../components/ui";
import { formatCurrency, formatOrderId } from "../../../utils/format";

// Mount with key={payment._id} so the form resets for each payment
const RefundModal = ({ payment, onClose, onSubmit, loading = false }) => {
    const maxAmount = Number(payment?.amount) || 0;
    const [amount, setAmount] = useState(String(maxAmount));
    const [reason, setReason] = useState("");
    const [errors, setErrors] = useState({});

    const handleSubmit = (event) => {
        event.preventDefault();

        const value = Number(amount);
        const nextErrors = {};

        if (!Number.isFinite(value) || value <= 0) nextErrors.amount = "Enter an amount greater than zero.";
        else if (value > maxAmount) nextErrors.amount = `Cannot exceed ${formatCurrency(maxAmount)}.`;

        if (!reason.trim()) nextErrors.reason = "A reason is required.";
        else if (reason.trim().length > 300) nextErrors.reason = "Keep the reason under 300 characters.";

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length === 0) onSubmit(payment, value, reason.trim());
    };

    return (
        <Modal
            open={!!payment}
            onClose={loading ? undefined : onClose}
            title="Refund payment"
            description={payment ? `Payment ${formatOrderId(payment._id)} · ${formatCurrency(maxAmount)} via Razorpay` : ""}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" form="refund-form" variant="danger" icon={RotateCcw} loading={loading}>
                        Refund
                    </Button>
                </>
            }
        >
            <form id="refund-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Alert tone="warning">
                    The refund is sent to Razorpay straight away and the payment is marked as refunded. This cannot be undone.
                </Alert>
                <Input
                    label="Refund amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={maxAmount}
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    error={errors.amount}
                    hint={`Up to ${formatCurrency(maxAmount)}`}
                />
                <Textarea
                    label="Reason"
                    required
                    rows={3}
                    maxLength={300}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    error={errors.reason}
                    hint={`${reason.length}/300`}
                    placeholder="e.g. Order cancelled by the restaurant"
                />
            </form>
        </Modal>
    );
};

export default RefundModal;
