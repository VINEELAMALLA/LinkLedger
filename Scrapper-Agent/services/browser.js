const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

async function launchBrowser() {
    const executablePath = process.env.CHROME_PATH || undefined;

    return puppeteer.launch({
        headless: "new",
        executablePath,
        userDataDir: "./tmp-profile",
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-blink-features=AutomationControlled"
        ]
    });
}

module.exports = launchBrowser;
