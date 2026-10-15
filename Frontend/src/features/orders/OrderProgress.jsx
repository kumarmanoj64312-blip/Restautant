import { Check, ChefHat, CircleCheck, ClipboardCheck, PackageCheck, Truck, XCircle } from "lucide-react";
import { formatDateTime } from "../../utils/format";

const ORDER_STEPS = [
    { status: "Pending", label: "Placed", icon: ClipboardCheck },
    { status: "Confirmed", label: "Confirmed", icon: CircleCheck },
    { status: "Preparing", label: "Preparing", icon: ChefHat },
    { status: "Ready", label: "Ready", icon: PackageCheck },
    { status: "Out for Delivery", label: "On the way", icon: Truck },
    { status: "Delivered", label: "Delivered", icon: Check },
];

// Horizontal tracker: Pending -> Confirmed -> Preparing -> Ready -> Out for Delivery -> Delivered
const OrderProgress = ({ status, cancelledAt }) => {
    if (status === "Cancelled") {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <XCircle size={18} className="shrink-0" />
                <span>
                    This order was cancelled{cancelledAt ? ` on ${formatDateTime(cancelledAt)}` : ""}.
                </span>
            </div>
        );
    }

    const currentIndex = Math.max(
        ORDER_STEPS.findIndex((step) => step.status === status),
        0
    );
    const progress = (currentIndex / (ORDER_STEPS.length - 1)) * 100;

    return (
        <div aria-label={`Order status: ${status}`}>
            <div className="relative">
                {/* Track behind the dots */}
                <div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-cream" aria-hidden="true">
                    <div
                        className="h-full rounded-full bg-brand transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <ol className="relative flex justify-between">
                    {ORDER_STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const done = index < currentIndex;
                        const current = index === currentIndex;

                        return (
                            <li
                                key={step.status}
                                className="flex w-8 flex-col items-center"
                                aria-current={current ? "step" : undefined}
                            >
                                <span
                                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
                                        done
                                            ? "border-brand bg-brand text-white"
                                            : current
                                              ? "border-brand bg-surface text-brand ring-4 ring-brand/15"
                                              : "border-line bg-surface text-muted"
                                    }`}
                                >
                                    {done ? <Check size={15} strokeWidth={3} /> : <Icon size={15} />}
                                </span>
                                <span
                                    className={`mt-2 hidden w-20 text-center text-[11px] font-semibold leading-tight sm:block ${
                                        done || current ? "text-ink" : "text-muted"
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            </div>

            {/* Small screens: only the current step label */}
            <p className="mt-3 text-center text-xs font-semibold text-ink sm:hidden">
                {ORDER_STEPS[currentIndex].label}
                <span className="font-normal text-muted">
                    {" "}
                    · step {currentIndex + 1} of {ORDER_STEPS.length}
                </span>
            </p>
        </div>
    );
};

export default OrderProgress;
