const scrapeByUrl = require("../services/scrapeByUrl");
const { analyzeContent, resolveOpportunityTitle, inferCategory } = require("../services/contentAnalyzer");
const { replaceItemsForUserSource, listItems, getDashboardStats, assignRandomDemoDeadlines, updateItemDeadline } = require("../services/storage");
const { notifyUpcomingDeadlines } = require("../services/deadlineScheduler");

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function isValidHttpUrl(value) {
    try {
        const parsed = new URL(String(value || ""));
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

function normalizeUrlInput(url, urls) {
    const unique = new Set();

    const canonicalizeUrl = (value) => {
        try {
            const parsed = new URL(String(value || "").trim());
            parsed.hash = "";
            // Keep query params (some post URLs rely on them), but normalize protocol/host/case.
            parsed.protocol = parsed.protocol.toLowerCase();
            parsed.hostname = parsed.hostname.toLowerCase();
            parsed.hostname = parsed.hostname.replace(/^(m|mobile|l)\./, "");
            // For social media post URLs, query params are usually tracking and should not create duplicates.
            if (
                parsed.hostname.includes("facebook.com")
                || parsed.hostname.includes("instagram.com")
                || parsed.hostname.includes("linkedin.com")
                || parsed.hostname.includes("x.com")
                || parsed.hostname.includes("twitter.com")
            ) {
                parsed.search = "";
            }
            // Normalize trailing slash except root.
            if (parsed.pathname.length > 1) {
                parsed.pathname = parsed.pathname.replace(/\/+$/, "");
            }
            return parsed.toString();
        } catch {
            return String(value || "").trim();
        }
    };

    if (url) unique.add(canonicalizeUrl(url));
    if (Array.isArray(urls)) {
        for (const item of urls) {
            if (typeof item === "string" && item.trim()) {
                unique.add(canonicalizeUrl(item));
            }
        }
    }

    return [...unique].filter(Boolean);
}

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function extractLinksFromText(text) {
    const matches = Array.from(new Set((String(text || "").match(/https?:\/\/[^\s)"'>]+/gi) || [])));
    return matches.map((url) => url.replace(/[),.;]+$/g, "")).filter(Boolean);
}

function buildOpportunityIdentity(item) {
    const primaryLinkNorm = normalizeUrlInput(item.primary_link || item.source_url)[0] || "";
    const firstExtractNorm = normalizeUrlInput(item.extracted_urls && item.extracted_urls[0])[0] || "";
    return [
        normalizeUrlInput(item.source_url)[0] || "",
        normalizeText(item.opportunity_title || item.raw_title || ""),
        normalizeText(item.category || ""),
        normalizeText(item.organization_name || ""),
        normalizeText(item.summary || item.raw_description || "").slice(0, 140),
        primaryLinkNorm,
        firstExtractNorm
    ].join("__");
}

async function processOneUrl(sourceUrl, userEmail, categories = []) {
    console.time(`processOneUrl-${sourceUrl}`);
    console.time(`scrape-${sourceUrl}`);
    const scraped = await scrapeByUrl(sourceUrl);
    console.timeEnd(`scrape-${sourceUrl}`);
    
    const descriptionLinks = extractLinksFromText(scraped.description);
    
    console.time(`analyze-${sourceUrl}`);
    const analysis = await analyzeContent({
        title: scraped.title,
        description: scraped.description,
        sourceUrl,
        extractedLinks: scraped.extractedLinks || [],
        categories
    });
    console.timeEnd(`analyze-${sourceUrl}`);
    
    const opportunities = Array.isArray(analysis.opportunities) && analysis.opportunities.length
        ? analysis.opportunities
        : [{
            title: scraped.title || analysis.organization_name || "Opportunity",
            link: analysis.primary_link || sourceUrl,
            category: analysis.category,
            concept_topic: analysis.concept_topic,
            organization_name: analysis.organization_name,
            deadline: analysis.deadline,
            keywords: analysis.keywords,
            summary: analysis.summary,
            extracted_urls: analysis.extracted_urls || []
        }];

        const toStoreRaw = await Promise.all(opportunities.map(async (opportunity) => {
            const resolvedTitle = await resolveOpportunityTitle({
                candidateTitle: opportunity.title || scraped.title || analysis.organization_name || "",
                description: opportunity.summary || analysis.summary || scraped.description || scraped.title || ""
            });
            const resolvedCategory = opportunity.category
                || analysis.category
                || inferCategory(`${resolvedTitle} ${opportunity.summary || analysis.summary || scraped.description || ""}`);

            return {
            source_url: sourceUrl,
            resource_url: sourceUrl,
            user_email: userEmail,
            platform: scraped.platform,
            raw_title: scraped.title,
            raw_description: scraped.description,
            summary: opportunity.summary || analysis.summary,
            category: resolvedCategory,
            concept_topic: opportunity.concept_topic || analysis.concept_topic,
            organization_name: opportunity.organization_name || analysis.organization_name,
            opportunity_title: resolvedTitle,
            primary_link: opportunity.link || analysis.primary_link || sourceUrl,
            extracted_urls: opportunity.extracted_urls || analysis.extracted_urls || [],
            description_links: descriptionLinks,
            deadline: opportunity.deadline || analysis.deadline,
            keywords: opportunity.keywords || analysis.keywords || [],
            provider: analysis.provider || "fallback"
        }}));

    // Remove duplicate opportunities that only differ by a noisy extracted link.
    const seen = new Set();
    const toStore = toStoreRaw.filter((item) => {
        const key = buildOpportunityIdentity(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    console.time(`store-${sourceUrl}`);
    const inserted = await replaceItemsForUserSource({
        userEmail,
        sourceUrl,
        items: toStore
    });
    console.timeEnd(`store-${sourceUrl}`);

    console.timeEnd(`processOneUrl-${sourceUrl}`);
    return inserted;
}

async function ingestController(req, res) {
    const { url, urls, userEmail, categories = [] } = req.body;
    const candidates = normalizeUrlInput(url, urls);

    if (!candidates.length) {
        return res.status(400).json({ success: false, error: "At least one URL is required" });
    }

    if (!isValidEmail(userEmail)) {
        return res.status(400).json({ success: false, error: "Valid userEmail is required" });
    }

    const invalid = candidates.filter((candidate) => !isValidHttpUrl(candidate));
    if (invalid.length) {
        return res.status(400).json({
            success: false,
            error: "One or more URLs are invalid. Use full http/https links.",
            invalidUrls: invalid
        });
    }

    try {
        const processPromises = candidates.map(async (candidate) => {
            try {
                const created = await processOneUrl(candidate, userEmail, categories);
                return { success: true, items: created, url: candidate };
            } catch (error) {
                return { success: false, error: error.message, url: candidate };
            }
        });

        const results = await Promise.allSettled(processPromises);

        const items = [];
        const failures = [];

        for (const result of results) {
            if (result.status === 'fulfilled') {
                const { success, items: created, error, url } = result.value;
                if (success) {
                    items.push(...created);
                } else {
                    failures.push({ url, error });
                }
            } else {
                failures.push({ url: 'unknown', error: result.reason.message });
            }
        }

        if (!items.length) {
            return res.status(500).json({
                success: false,
                error: "Failed to process all URLs",
                failures
            });
        }

        const singleMode = candidates.length === 1;
        const demoDeadlineResult = await assignRandomDemoDeadlines(userEmail);

        return res.json({
            success: true,
            item: singleMode ? items[0] : undefined,
            items,
            processedCount: items.length,
            failedCount: failures.length,
            failures,
            demoDeadlinesAssigned: demoDeadlineResult.assigned
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function getItemsController(req, res) {
    try {
        const items = await listItems({
            userEmail: req.query.userEmail,
            category: req.query.category,
            search: req.query.search,
            deadlineStatus: req.query.deadlineStatus
        });
        res.json({ success: true, items });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getStatsController(req, res) {
    try {
        const stats = await getDashboardStats(req.query.userEmail);
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getNotificationsController(req, res) {
    try {
        const items = await listItems({
            userEmail: req.query.userEmail,
            deadlineStatus: "upcoming"
        });

        const notifications = items.map((item) => ({
            id: item.id,
            message: `${item.opportunity_title || item.organization_name || item.category} deadline on ${item.deadline}`,
            deadline: item.deadline,
            primary_link: item.primary_link
        }));

        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function sendNotificationsController(req, res) {
    try {
        const userEmail = req.body?.userEmail || req.query?.userEmail;
        const result = await notifyUpcomingDeadlines(userEmail);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function updateDeadlineController(req, res) {
    try {
        const { itemId } = req.params;
        const { deadline } = req.body;
        
        if (!itemId) {
            return res.status(400).json({ success: false, error: "itemId is required" });
        }
        
        const updatedItem = await updateItemDeadline(itemId, deadline);
        res.json({ success: true, item: updatedItem });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function reclassifyController(req, res) {
    try {
        const { reclassifyItems } = require("../services/storage");
        const updated = await reclassifyItems();
        res.json({ success: true, message: `Reclassified ${updated} items` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function generateTitlesController(req, res) {
    try {
        const { generateTitles } = require("../services/storage");
        const updated = await generateTitles();
        res.json({ success: true, message: `Generated titles for ${updated} items` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    ingestController,
    getItemsController,
    getStatsController,
    getNotificationsController,
    sendNotificationsController,
    updateDeadlineController,
    reclassifyController,
    generateTitlesController
};
