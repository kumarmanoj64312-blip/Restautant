import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { addToCart } from "../../api/cartApi";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";

/**
 * Shared add-to-cart behaviour for the public menu.
 * const { add, pendingId, canOrder } = useAddToCart();
 * add(menu, quantity, { redirectTo: "/cart" })
 */
const useAddToCart = () => {
    const { isAuthenticated, isStaff } = useAuth();
    const { setCartFromResponse, refreshCart } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [pendingId, setPendingId] = useState(null);

    const add = useCallback(
        async (menu, quantity = 1, { redirectTo } = {}) => {
            if (!menu?._id) return false;

            if (!isAuthenticated) {
                toast("Please log in to start your order.");
                navigate("/login", { state: { from: location } });
                return false;
            }

            if (isStaff) {
                toast.error("Staff accounts can't place online orders.");
                return false;
            }

            if (menu.isAvailable === false) {
                toast.error(`${menu.name} is currently unavailable.`);
                return false;
            }

            setPendingId(menu._id);

            try {
                const response = await addToCart(menu._id, quantity);
                // Backend sends the cart as `cart`; fall back to the standard envelope
                const cart = response?.cart ?? response?.data;

                if (Array.isArray(cart?.items)) {
                    setCartFromResponse(cart);
                } else {
                    refreshCart();
                }

                toast.success(
                    quantity > 1 ? `${quantity} × ${menu.name} added to cart` : `${menu.name} added to cart`
                );

                if (redirectTo) navigate(redirectTo);
                return true;
            } catch (error) {
                toast.error(getErrorMessage(error, "Could not add this dish to your cart."));
                return false;
            } finally {
                setPendingId(null);
            }
        },
        [isAuthenticated, isStaff, navigate, location, setCartFromResponse, refreshCart]
    );

    return { add, pendingId, canOrder: !isStaff };
};

export default useAddToCart;
