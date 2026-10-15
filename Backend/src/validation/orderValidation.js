import mongoose from "mongoose";

export const validatePlaceOrder = (req, res, next) => {
    const {
        items,
        shippingAddress,
        paymentMethod,
        totalAmount,
    } = req.body;

    const errors = [];

    if (!items || !Array.isArray(items) || items.length === 0) {
        errors.push("Order items are required.");
    } else {
        items.forEach((item, index) => {
            if (!item.menu) {
                errors.push(`Item ${index + 1}: Menu is required.`);
            } else if (!mongoose.Types.ObjectId.isValid(item.menu)) {
                errors.push(`Item ${index + 1}: Invalid Menu ID.`);
            }

            if (!item.quantity || Number(item.quantity) < 1) {
                errors.push(`Item ${index + 1}: Quantity must be at least 1.`);
            }

        });
    }

    if (!shippingAddress) {
        errors.push("Shipping address is required.");
    } else {
        if (
            !shippingAddress.name ||
            shippingAddress.name.trim() === ""
        ) {
            errors.push("Customer name is required.");
        }

        if (
            !shippingAddress.phone ||
            shippingAddress.phone.trim() === ""
        ) {
            errors.push("Phone number is required.");
        } else if (!/^[6-9]\d{9}$/.test(shippingAddress.phone)) {
            errors.push("Invalid phone number.");
        }

        if (
            !shippingAddress.address ||
            shippingAddress.address.trim() === ""
        ) {
            errors.push("Address is required.");
        }

        if (
            !shippingAddress.city ||
            shippingAddress.city.trim() === ""
        ) {
            errors.push("City is required.");
        }

        if (
            !shippingAddress.pincode ||
            shippingAddress.pincode.trim() === ""
        ) {
            errors.push("Pincode is required.");
        } else if (!/^\d{6}$/.test(shippingAddress.pincode)) {
            errors.push("Invalid pincode.");
        }
    }

    const allowedMethods = [
        "Cash on Delivery",
        "Online Payment",
        "UPI",
        "Card",
        "Razorpay",
    ];

    if (
        paymentMethod &&
        !allowedMethods.includes(paymentMethod)
    ) {
        errors.push("Invalid payment method.");
    }

    if (
        totalAmount === undefined ||
        Number(totalAmount) <= 0
    ) {
        errors.push("Invalid total amount.");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors,
        });
    }

    next();
};

export const validatePosOrder = (req, res, next) => {
    const {
        items,
        orderType,
        tableNumber,
        customerPhone,
        paymentMethod,
    } = req.body;

    const errors = [];

    if (!items || !Array.isArray(items) || items.length === 0) {
        errors.push("Order items are required.");
    } else {
        items.forEach((item, index) => {
            if (!item.menu) {
                errors.push(`Item ${index + 1}: Menu is required.`);
            } else if (!mongoose.Types.ObjectId.isValid(item.menu)) {
                errors.push(`Item ${index + 1}: Invalid Menu ID.`);
            }

            if (!item.quantity || Number(item.quantity) < 1) {
                errors.push(`Item ${index + 1}: Quantity must be at least 1.`);
            }
        });
    }

    const allowedTypes = ["Dine In", "Takeaway"];

    if (!allowedTypes.includes(orderType)) {
        errors.push("Order type must be Dine In or Takeaway.");
    }

    if (
        orderType === "Dine In" &&
        (!tableNumber || String(tableNumber).trim() === "")
    ) {
        errors.push("Table number is required for dine-in orders.");
    }

    if (
        customerPhone &&
        !/^[6-9]\d{9}$/.test(customerPhone)
    ) {
        errors.push("Invalid phone number.");
    }

    const allowedMethods = ["Cash", "UPI", "Card"];

    if (!allowedMethods.includes(paymentMethod)) {
        errors.push("Payment method must be Cash, UPI or Card.");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors,
        });
    }

    next();
};
