import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import Button from "./Button";

const SIZES = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
};

/**
 * <Modal open={open} onClose={close} title="Edit item" footer={<Button>Save</Button>}>
 *   ...content
 * </Modal>
 */
const Modal = ({ open, onClose, title, description, size = "md", footer, children }) => {
    // Close on Escape and lock page scroll while open
    useEffect(() => {
        if (!open) return undefined;

        const onKey = (event) => {
            if (event.key === "Escape") onClose?.();
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-[2px]" onClick={onClose} />

            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`relative flex max-h-[92vh] w-full ${SIZES[size] || SIZES.md} animate-fade-up flex-col rounded-t-3xl bg-surface shadow-lift sm:rounded-3xl`}
            >
                <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="text-lg font-bold text-ink">{title}</h2>
                        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-muted transition hover:bg-cream hover:text-ink"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

                {footer && (
                    <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

/**
 * Replacement for window.confirm:
 * <ConfirmDialog open={!!toDelete} title="Delete item?" message="..." onConfirm={...} onClose={...} loading={busy} />
 */
export const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message,
    confirmText = "Delete",
    tone = "danger",
    loading = false,
}) => (
    <Modal
        open={open}
        onClose={loading ? undefined : onClose}
        title={title}
        size="sm"
        footer={
            <>
                <Button variant="outline" onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
                    {confirmText}
                </Button>
            </>
        }
    >
        <div className="flex gap-3">
            <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    tone === "danger" ? "bg-red-50 text-danger" : "bg-brand-soft text-brand"
                }`}
            >
                <AlertTriangle size={20} />
            </span>
            <p className="pt-2 text-sm text-muted">{message}</p>
        </div>
    </Modal>
);

export default Modal;
