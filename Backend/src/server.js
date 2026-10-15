import dotenv from "dotenv";
dotenv.config();

import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import seedAdmin from "./seeds/adminSeed.js";
import migrateRoles from "./utils/migrateRoles.js";

const PORT = Number(process.env.PORT || 5000);

const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/thehungrysport";

const server = http.createServer(app);

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(
            `❌ Port ${PORT} is already in use. Stop the other server or change PORT in your .env file.`
        );
    } else {
        console.error("❌ HTTP server error:", error.message);
    }

    process.exit(1);
});

const startServer = async () => {
    try {
        await mongoose.connect(MONGODB_URI);

        console.log("✅ MongoDB Connected");

        await migrateRoles();
        await seedAdmin();

        server.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Server Error:", error.message);
        process.exit(1);
    }
};

startServer();

const shutdown = async () => {
    try {
        await mongoose.connection.close();
        console.log("MongoDB Disconnected");
    } catch (error) {
        console.error("MongoDB shutdown error:", error.message);
    } finally {
        process.exit(0);
    }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);