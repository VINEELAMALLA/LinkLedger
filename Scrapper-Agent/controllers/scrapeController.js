const scrapeByUrl = require("../services/scrapeByUrl");

async function scrapeController(req, res) {
    const { url } = req.body;

    try {
        if (!url) {
            return res.status(400).json({ success: false, error: "URL is required" });
        }

        const result = await scrapeByUrl(url);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = scrapeController;
