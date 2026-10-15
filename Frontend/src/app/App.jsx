import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../features/auth/AuthContext";
import { CartProvider } from "../features/cart/CartContext";
import AppRouter from "./router";

// Start each new page at the top
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

const App = () => (
    <AuthProvider>
        <CartProvider>
            <ScrollToTop />
            <AppRouter />
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        borderRadius: "14px",
                        background: "#231c17",
                        color: "#fff",
                        fontSize: "14px",
                        fontWeight: 600,
                    },
                    success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
                }}
            />
        </CartProvider>
    </AuthProvider>
);

export default App;
