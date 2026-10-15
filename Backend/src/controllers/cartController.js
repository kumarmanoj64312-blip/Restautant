import cartService from "../services/cartService.js";

export const getCart = async (req, res) => {
    try {
        const cart = await cartService.getCartByUser(req.user._id);

        res.status(200).json({
            success: true,
            message: "Cart fetched successfully",
            cart,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const addToCart = async (req, res) => {
    try {
        const { menuId, quantity } = req.body;

        const cart = await cartService.addToCart(
            req.user._id,
            menuId,
            Number(quantity) || 1
        );

        res.status(200).json({
            success: true,
            message: "Item added to cart",
            cart,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const { menuId, quantity } = req.body;

        const cart = await cartService.updateCartItem(
            req.user._id,
            menuId,
            Number(quantity)
        );

        res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            cart,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const removeCartItem = async (req, res) => {
    try {
        const { menuId } = req.params;

        const cart = await cartService.removeCartItem(
            req.user._id,
            menuId
        );

        res.status(200).json({
            success: true,
            message: "Item removed from cart",
            cart,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const clearCart = async (req, res) => {
    try {
        await cartService.clearCart(req.user._id);

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};