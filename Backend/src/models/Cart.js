import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
    {
        menu: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Menu",
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
            default: 1,
            min: 1,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        total: {
            type: Number,
            default: 0,
        },
    },
    {
        _id: false,
    }
);

cartItemSchema.pre("save", function () {
    this.total = this.price * this.quantity;
});

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // Creates a unique index automatically
        },

        items: [cartItemSchema],

        totalItems: {
            type: Number,
            default: 0,
        },

        subtotal: {
            type: Number,
            default: 0,
        },

        deliveryCharge: {
            type: Number,
            default: 0,
        },

        tax: {
            type: Number,
            default: 0,
        },

        discount: {
            type: Number,
            default: 0,
        },

        totalAmount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

cartSchema.pre("save", function () {
    this.totalItems = this.items.reduce(
        (total, item) => total + item.quantity,
        0
    );

    this.subtotal = this.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    this.totalAmount =
        this.subtotal +
        this.deliveryCharge +
        this.tax -
        this.discount;
});

cartSchema.methods.clearCart = function () {
    this.items = [];
    this.totalItems = 0;
    this.subtotal = 0;
    this.deliveryCharge = 0;
    this.tax = 0;
    this.discount = 0;
    this.totalAmount = 0;
};

// ❌ Removed duplicate index:
// cartSchema.index({ user: 1 });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;