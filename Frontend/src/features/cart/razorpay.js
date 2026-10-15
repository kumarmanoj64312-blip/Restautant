import { createPayment, verifyRazorpayPayment } from "../../api/paymentApi";
import { SITE } from "../../config/site";

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise = null;

const loadRazorpay = () => {
    if (window.Razorpay) return Promise.resolve();

    if (!scriptPromise) {
        scriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = SCRIPT_URL;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => {
                scriptPromise = null;
                script.remove();
                reject(new Error("Couldn't load the payment window. Check your connection."));
            };
            document.body.appendChild(script);
        });
    }

    return scriptPromise;
};

/**
 * Pays an already-created order through Razorpay:
 * POST /payments -> open checkout -> POST /payments/verify-razorpay.
 * Resolves when the payment is verified; rejects if it fails or is dismissed.
 */
export const payOrderOnline = async (order, prefill = {}) => {
    const paymentResponse = await createPayment({
        order: order._id,
        amount: order.totalAmount,
        paymentMethod: "Razorpay",
    });
    const payment = paymentResponse?.data;

    if (!payment?.razorpayOrderId || !payment?.razorpayKeyId) {
        throw new Error("Online payment is not available right now.");
    }

    await loadRazorpay();

    return new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
            key: payment.razorpayKeyId,
            order_id: payment.razorpayOrderId,
            amount: Math.round(Number(payment.amount || order.totalAmount) * 100),
            currency: "INR",
            name: SITE.name,
            description: `Order ${order.orderNumber || ""}`.trim(),
            prefill,
            theme: { color: "#e85d04" },
            handler: async (result) => {
                try {
                    // Razorpay returns snake_case; the API expects camelCase
                    await verifyRazorpayPayment({
                        razorpayOrderId: result.razorpay_order_id,
                        razorpayPaymentId: result.razorpay_payment_id,
                        razorpaySignature: result.razorpay_signature,
                    });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            },
            modal: {
                ondismiss: () => reject(new Error("Payment was cancelled.")),
            },
        });

        checkout.on?.("payment.failed", (response) => {
            reject(new Error(response?.error?.description || "Payment failed."));
        });

        checkout.open();
    });
};
