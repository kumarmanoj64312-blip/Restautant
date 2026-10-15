import express from "express";
import {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getCart);

router.post("/add", addToCart);

router.put("/update", updateCartItem);

router.delete("/remove/:menuId", removeCartItem);

router.delete("/clear", clearCart);

export default router;