const detectPlatform = require("./detector");
const scrapeInstagram = require("./instagram");
const scrapeLinkedIn = require("./linkedin");
const scrapeFacebook = require("./facebook");
const scrapeWeb = require("./web");

async function scrapeByUrl(url) {
    const platform = detectPlatform(url);

    switch (platform) {
        case "instagram":
            return scrapeInstagram(url);
        case "linkedin":
            return scrapeLinkedIn(url);
        case "facebook":
            return scrapeFacebook(url);
        case "web":
            return scrapeWeb(url);
        default:
            throw new Error("Unsupported platform URL");
    }
}

module.exports = scrapeByUrl;
