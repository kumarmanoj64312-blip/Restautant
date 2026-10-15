// Razorpay keys come from .env (Dashboard -> Settings -> API Keys).
// Template values like "your_razorpay_key_id" count as "not configured",
// so the site can hide online payment instead of failing at checkout.

const looksReal = (value) =>
    typeof value === "string" &&
    value.trim().length > 0 &&
    !/^your[_-]/i.test(value.trim());

export const getRazorpayKeys = () => ({
    keyId: process.env.RAZORPAY_KEY_ID?.trim() || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET?.trim() || "",
});

export const isRazorpayConfigured = () => {
    const { keyId, keySecret } = getRazorpayKeys();

    // Razorpay key ids always start with rzp_test_ or rzp_live_
    return looksReal(keyId) && keyId.startsWith("rzp_") && looksReal(keySecret);
};
