const express = require("express");
const scrapeController = require("../controllers/scrapeController");
const { registerController, loginController } = require("../controllers/authController");
const {
    ingestController,
    getItemsController,
    getStatsController,
    getNotificationsController,
    sendNotificationsController,
    updateDeadlineController,
    reclassifyController,
    generateTitlesController
} = require("../controllers/ingestController");

const router = express.Router();

router.post("/auth/register", registerController);
router.post("/auth/login", loginController);
router.post("/scrape", scrapeController);
router.post("/ingest", ingestController);
router.post("/ingest/batch", ingestController);
router.get("/items", getItemsController);
router.get("/dashboard/stats", getStatsController);
router.get("/notifications", getNotificationsController);
router.post("/notifications/send", sendNotificationsController);
router.put("/items/:itemId/deadline", updateDeadlineController);
router.post("/reclassify", reclassifyController);
router.post("/generate-titles", generateTitlesController);

module.exports = router;
