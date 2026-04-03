require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const scrapeRoutes = require("./routes/scrapeRoutes");
const { startDeadlineScheduler } = require("./services/deadlineScheduler");
const { cleanDuplicateItems } = require("./services/storage");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3001"
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
console.log('Loading routes...');
app.use("/api", scrapeRoutes);
console.log('Routes loaded');

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    try {
        await cleanDuplicateItems();
        console.log("Storage cleaned of high-level duplicates.");
    } catch (err) {
        console.error("Failed to clean duplicate items on startup:", err);
    }
});

startDeadlineScheduler(); // Commented out to disable automatic email sending
