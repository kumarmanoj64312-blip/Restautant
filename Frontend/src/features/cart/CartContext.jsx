import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCart } from "../../api/cartApi";
import { useAuth } from "../auth/AuthContext";

const CartContext = createContext(undefined);

// Accepts a cart object or a cart API response ({ cart } or { data })
const countItems = (input) => {
    const cart = input?.cart ?? input?.data ?? input;

    return (cart?.items || []).reduce((total, item) => total + (Number(item.quantity) || 0), 0);
};

/**
 * Keeps the cart item count for the navbar badge.
 * Pages that change the cart call refreshCart() (or setCartFromResponse(res.data)).
 */
export const CartProvider = ({ children }) => {
    const { user, isCustomer } = useAuth();
    const userId = user?._id;

    // Remember whose cart the count belongs to, so it resets on logout/switch
    const [state, setState] = useState({ owner: null, count: 0 });

    const setCartFromResponse = useCallback(
        (cart) => setState({ owner: userId, count: countItems(cart) }),
        [userId]
    );

    const refreshCart = useCallback(async () => {
        if (!userId || !isCustomer) return;

        try {
            const response = await getCart();
            setState({ owner: userId, count: countItems(response) });
        } catch {
            // Badge is non-critical
        }
    }, [userId, isCustomer]);

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const value = useMemo(
        () => ({
            count: state.owner === userId ? state.count : 0,
            refreshCart,
            setCartFromResponse,
        }),
        [state, userId, refreshCart, setCartFromResponse]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
    const context = useContext(CartContext);

    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }

    return context;
};
