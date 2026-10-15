import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        menu: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Menu",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            url: {
                type: String,
                default: "",
            },
            public_id: {
                type: String,
                default: "",
            },
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "Quantity must be a whole number.",
            },
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        state: {
            type: String,
            default: "",
            trim: true,
        },
        pincode: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            unique: true,
            trim: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: "An order must contain at least one item.",
            },
        },

        orderType: {
            type: String,
            enum: [
                "Delivery",
                "Dine In",
                "Takeaway",
            ],
            default: "Delivery",
            required: true,
        },

        // Online orders need an address; POS dine-in/takeaway orders do not.
        shippingAddress: {
            type: shippingAddressSchema,
            required: function () {
                return this.orderType === "Delivery";
            },
        },

        // POS-only details
        tableNumber: {
            type: String,
            default: "",
            trim: true,
        },

        customerName: {
            type: String,
            default: "",
            trim: true,
        },

        customerPhone: {
            type: String,
            default: "",
            trim: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        paymentMethod: {
            type: String,
            enum: [
                "Cash on Delivery",
                "Online Payment",
                "Cash",
                "UPI",
                "Card",
            ],
            default: "Cash on Delivery",
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: [
                "Pending",
                "Paid",
                "Failed",
                "Refunded",
            ],
            default: "Pending",
            required: true,
        },

        orderStatus: {
            type: String,
            enum: [
                "Pending",
                "Confirmed",
                "Preparing",
                "Ready",
                "Out for Delivery",
                "Delivered",
                "Cancelled",
            ],
            default: "Pending",
            required: true,
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        deliveryCharge: {
            type: Number,
            default: 0,
            min: 0,
        },

        tax: {
            type: Number,
            default: 0,
            min: 0,
        },

        discount: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        deliveredAt: {
            type: Date,
            default: null,
        },

        cancelledAt: {
            type: Date,
            default: null,
        },

        notes: {
            type: String,
            default: "",
            trim: true,
            maxlength: 1000,
        },
    },
    { timestamps: true }
);

orderSchema.pre("save", function () {
    if (!this.orderNumber) {
        this.orderNumber =
            "THS-" +
            Date.now() +
            "-" +
            Math.floor(Math.random() * 1000);
    }
});

const Order = mongoose.model("Order", orderSchema);

export default Order;