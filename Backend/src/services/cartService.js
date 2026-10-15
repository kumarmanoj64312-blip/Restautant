import Cart from "../models/Cart.js";
import Menu from "../models/Menu.js";

const getCartByUser = async (userId) => {
    let cart = await Cart.findOne({ user: userId }).populate("items.menu");

    if (!cart) {
        cart = await Cart.create({
            user: userId,
            items: [],
            totalAmount: 0,
        });
    }

    return cart;
};

const addToCart = async (userId, menuId, quantity = 1) => {
    const menu = await Menu.findById(menuId);

    if (!menu) {
        throw new Error("Menu item not found");
    }

    if (!menu.isAvailable) {
        throw new Error(`${menu.name} is currently unavailable`);
    }

    // Same price rule as orders: discount price wins when set
    const price = menu.discountPrice > 0 ? menu.discountPrice : menu.price;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
        cart = new Cart({
            user: userId,
            items: [],
            totalAmount: 0,
        });
    }

    const itemIndex = cart.items.findIndex(
        (item) => item.menu.toString() === menuId
    );

    if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        cart.items[itemIndex].price = price;
    } else {
        cart.items.push({
            menu: menuId,
            quantity,
            price,
        });
    }

    cart.totalAmount = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    await cart.save();

    return await Cart.findById(cart._id).populate("items.menu");
};

const updateCartItem = async (userId, menuId, quantity) => {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        throw new Error("Cart not found");
    }

    const item = cart.items.find(
        (item) => item.menu.toString() === menuId
    );

    if (!item) {
        throw new Error("Item not found in cart");
    }

    item.quantity = quantity;

    cart.totalAmount = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    await cart.save();

    return await Cart.findById(cart._id).populate("items.menu");
};

const removeCartItem = async (userId, menuId) => {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        throw new Error("Cart not found");
    }

    cart.items = cart.items.filter(
        (item) => item.menu.toString() !== menuId
    );

    cart.totalAmount = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    await cart.save();

    return await Cart.findById(cart._id).populate("items.menu");
};

const clearCart = async (userId) => {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        throw new Error("Cart not found");
    }

    cart.items = [];
    cart.totalAmount = 0;

    await cart.save();

    return cart;
};

export default {
    getCartByUser,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
};