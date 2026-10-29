import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import CategoryRoutes from "./routes/categoryRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import heroRoutes from "./routes/heroRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";

// Import Error Middleware
import {
    notFound,
    default as errorMiddleware,
} from "./middleware/errorMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==========================
// CORS Configuration
// ==========================

const allowedOrigins = [
    ...(process.env.CLIENT_URL || "http://localhost:5173").split(","),
    "https://restautant-xi.vercel.app",
]
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            // Allow requests without an Origin header, such as server-to-server requests.
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Origin not allowed by CORS.")
            );
        },
        credentials: true,
    })
);

// ==========================
// Request Body Middleware
// ==========================

app.use(
    express.json({
        limit: "10mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb",
    })
);

app.use(cookieParser());

// ==========================
// Logging
// ==========================

if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
}

// ==========================
// Static Uploads
// ==========================

app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"))
);

// ==========================
// Root Route
// ==========================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Restaurant API is running.",
    });
});

// ==========================
// Health Check
// ==========================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy.",
        timestamp: new Date().toISOString(),
    });
});

// ==========================
// Authentication Routes
// ==========================

app.use("/api/auth", authRoutes);

// ==========================
// Category Routes
// Keep uppercase path for compatibility
// ==========================

app.use("/api/Category", CategoryRoutes);

// ==========================
// Menu Routes
// Support both existing API paths
// ==========================

app.use("/api/menu", menuRoutes);
app.use("/api/menus", menuRoutes);

// ==========================
// Cart Routes
// ==========================

app.use("/api/cart", cartRoutes);

// ==========================
// Order Routes
// ==========================

app.use("/api/orders", orderRoutes);

// ==========================
// Payment Routes
// ==========================

app.use("/api/payments", paymentRoutes);

// ==========================
// Settings Routes
// ==========================

app.use("/api/settings", settingsRoutes);

// ==========================
// Dashboard Routes
// ==========================

app.use("/api/dashboard", dashboardRoutes);

// ==========================
// Staff & Roles (admin only, except /roles/me)
// ==========================

app.use("/api/staff", staffRoutes);
app.use("/api/roles", roleRoutes);

// ==========================
// Staff HR: attendance & leave
// ==========================

app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);

// ==========================
// Hero Routes
// ==========================

app.use("/api/hero", heroRoutes);

// ==========================
// Offer Routes
// ==========================

app.use("/api/offers", offerRoutes);

// ==========================
// Contact Routes
// ==========================

app.use("/api/contact", contactRoutes);

// ==========================
// 404 Not Found Handler
// ==========================

app.use(notFound);

// ==========================
// Global Error Handler
// ==========================

app.use(errorMiddleware);

export default app;