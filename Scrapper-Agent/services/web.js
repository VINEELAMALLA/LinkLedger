const launchBrowser = require("./browser");
const extractDescription = require("../utils/extractor");

async function scrapeWeb(url) {
    const browser = await launchBrowser();
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
        await page.waitForTimeout(2500);

        const data = await extractDescription(page);
        return {
            platform: "web",
            ...data,
            url
        };
    } finally {
        await browser.close();
    }
}

module.exports = scrapeWeb;
