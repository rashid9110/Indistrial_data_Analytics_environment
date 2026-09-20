const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");

const Alert = require("./models/Alert");

const app = express();
const httpServer = http.createServer(app);

const PORT = 5005;

const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/predictive-maintenance";

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
];


// =========================
// CORS
// =========================

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

app.use(express.json());


// =========================
// SOCKET.IO
// =========================

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});


// =========================
// BASIC ROUTE
// =========================

app.get("/", (req, res) => {
    res.json({
        message: "Predictive Maintenance Backend is running",
        port: PORT,
    });
});


// =========================
// GET ALL ALERTS
// =========================

app.get("/api/alerts", async (req, res) => {
    try {
        const alerts = await Alert.find()
            .sort({ timestamp: -1 })
            .limit(100)
            .lean();

        console.log(
            `GET /api/alerts -> ${alerts.length} alerts`
        );

        res.json(alerts);
    } catch (error) {
        console.error("GET ALERTS ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch alerts",
            error: error.message,
        });
    }
});


// =========================
// CREATE ALERT
// =========================

app.post("/api/alerts", async (req, res) => {
    try {
        console.log("POST /api/alerts:");
        console.log(req.body);

        const {
            productID,
            torque,
            toolWear,
            rotationalSpeed,
            status,
        } = req.body;

        if (!productID) {
            return res.status(400).json({
                message: "productID is required",
            });
        }

        if (torque === undefined) {
            return res.status(400).json({
                message: "torque is required",
            });
        }

        if (toolWear === undefined) {
            return res.status(400).json({
                message: "toolWear is required",
            });
        }

        if (rotationalSpeed === undefined) {
            return res.status(400).json({
                message: "rotationalSpeed is required",
            });
        }

        const alert = await Alert.create({
            productID,
            torque,
            toolWear,
            rotationalSpeed,
            status,
        });

        const payload = alert.toObject();

        console.log(
            `[ALERT SAVED] ${productID} | ${status}`
        );

        // Send the newly created alert to every connected React client
        io.emit("alert", payload);

        res.status(201).json(payload);
    } catch (error) {
        console.error("POST ALERT ERROR:", error);

        res.status(500).json({
            message: "Failed to save alert",
            error: error.message,
        });
    }
});


// =========================
// SOCKET CONNECTION
// =========================

io.on("connection", (socket) => {
    console.log(
        `[SOCKET CONNECTED] ${socket.id}`
    );

    socket.on("disconnect", (reason) => {
        console.log(
            `[SOCKET DISCONNECTED] ${socket.id} - ${reason}`
        );
    });
});


// =========================
// MONGODB + SERVER
// =========================

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        httpServer.listen(PORT, () => {
            console.log(
                `Predictive maintenance server listening on port ${PORT}`
            );
            console.log(
                `Backend: http://localhost:${PORT}`
            );
        });
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error
        );
    });