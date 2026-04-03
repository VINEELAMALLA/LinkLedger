const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "items.json");

async function ensureDataFile() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify({ items: [] }, null, 2), "utf8");
    }
}

async function readDb() {
    await ensureDataFile();
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    if (!Array.isArray(parsed.items)) parsed.items = [];
    return parsed;
}

async function writeDb(db) {
    await ensureDataFile();
    await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

function buildDeadlineStatus(deadline) {
    if (!deadline) return "none";
    const now = new Date();
    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) return "none";
    if (date < now) return "overdue";
    const days = (date - now) / (1000 * 60 * 60 * 24);
    if (days <= 10) return "upcoming";
    return "scheduled";
}

function normalizeUrl(value) {
    try {
        const parsed = new URL(String(value || "").trim());
        parsed.hash = "";
        parsed.search = "";
        parsed.protocol = parsed.protocol.toLowerCase();
        parsed.hostname = parsed.hostname.toLowerCase().replace(/^(m|mobile|l)\./, "");

        if (parsed.pathname.length > 1) {
            parsed.pathname = parsed.pathname.replace(/\/+$/, "");
        }

        return parsed.toString();
    } catch {
        return String(value || "").trim().toLowerCase();
    }
}

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function buildItemIdentity(item) {
    const sourceKey = normalizeUrl(item.source_url || item.resource_url || item.primary_link || "");
    const titleKey = normalizeText(item.opportunity_title || item.raw_title || "");
    const categoryKey = normalizeText(item.category || "");
    const organizationKey = normalizeText(item.organization_name || "");
    const summaryKey = normalizeText(item.summary || item.raw_description || "").slice(0, 140);
    const primaryLink = normalizeUrl(item.primary_link || item.resource_url || item.source_url || "");

    return [
        normalizeText(item.user_email || ""),
        normalizeText(item.platform || ""),
        primaryLink,
        titleKey || summaryKey,
        categoryKey,
        organizationKey
    ].join("__");
}

function buildStrictItemIdentity(item) {
    const primaryLink = normalizeUrl(item.primary_link || item.resource_url || item.source_url || "");

    return [
        normalizeText(item.user_email || ""),
        normalizeText(item.platform || ""),
        primaryLink,
        normalizeText(item.opportunity_title || item.summary || ""),
        normalizeText(item.category || ""),
        normalizeText(item.organization_name || "")
    ].join("__");
}

function shouldRegenerateStoredTitle(title) {
    const text = String(title || "").trim();
    if (!text) return true;
    if (text.length < 4) return true;
    if (/[()[\]{}]/.test(text)) return true;

    return /untitled opportunity|likes?|comments?|page not found|uh oh|manage your professional|attention college students|jump-start|instagram|linkedin|facebook|applications open|dataelevate|bahasa indonesia|english|malay|czech|danish|german|spanish|arabic|hyderabad|mardan|india|pakistan|_[a-z0-9]+|[#@]/i.test(text);
}

async function cleanDuplicateItems() {
    const db = await readDb();
    const map = new Map();

    for (const item of db.items) {
        const key = buildStrictItemIdentity(item);
        const existing = map.get(key);
        if (!existing || (item.updated_at && item.updated_at > existing.updated_at)) {
            map.set(key, item);
        }
    }

    if (map.size !== db.items.length) {
        db.items = [...map.values()];
        await writeDb(db);
    }
}


async function insertItem(payload) {
    const db = await readDb();
    const now = new Date().toISOString();
    const payloadIdentity = buildItemIdentity(payload);
    const existing = db.items.find((item) => buildItemIdentity(item) === payloadIdentity);

    const record = {
        id: existing?.id || crypto.randomUUID(),
        source_url: payload.source_url,
        resource_url: payload.resource_url || payload.source_url,
        user_email: payload.user_email,
        platform: payload.platform,
        raw_description: payload.raw_description,
        raw_title: payload.raw_title || "",
        opportunity_title: payload.opportunity_title || payload.raw_title || "Opportunity",
        summary: payload.summary || "",
        category: payload.category || "Other",
        concept_topic: payload.concept_topic || null,
        keywords: payload.keywords || [],
        organization_name: payload.organization_name || "Unknown",
        primary_link: payload.primary_link || payload.source_url,
        extracted_urls: payload.extracted_urls || [],
        description_links: payload.description_links || [],
        deadline: payload.deadline || null,
        deadline_status: buildDeadlineStatus(payload.deadline),
        provider: payload.provider || "fallback",
        notified: existing?.notified || false,
        created_at: existing?.created_at || now,
        updated_at: now
    };

    if (existing) {
        db.items = db.items.map((item) => (item.id === existing.id ? record : item));
    } else {
        db.items.push(record);
    }

    await writeDb(db);
    return record;
}

async function replaceItemsForUserSource({ userEmail, sourceUrl, items }) {
    const db = await readDb();
    const now = new Date().toISOString();

    // Remove previously extracted records for this user and source URL.
    db.items = db.items.filter((item) => !(item.user_email === userEmail && item.source_url === sourceUrl));

    const nextRecords = (items || []).map((payload) => ({
        id: crypto.randomUUID(),
        source_url: payload.source_url,
        resource_url: payload.resource_url || payload.source_url,
        user_email: payload.user_email,
        platform: payload.platform,
        raw_description: payload.raw_description,
        raw_title: payload.raw_title || "",
        opportunity_title: payload.opportunity_title || payload.raw_title || "Opportunity",
        summary: payload.summary || "",
        category: payload.category || "Other",
        concept_topic: payload.concept_topic || null,
        keywords: payload.keywords || [],
        organization_name: payload.organization_name || "Unknown",
        primary_link: payload.primary_link || payload.source_url,
        extracted_urls: payload.extracted_urls || [],
        description_links: payload.description_links || [],
        deadline: payload.deadline || null,
        deadline_status: buildDeadlineStatus(payload.deadline),
        provider: payload.provider || "fallback",
        notified: false,
        created_at: now,
        updated_at: now
    }));

    // Deduplicate within the batch to avoid repeating in UI.
    const batchMap = new Map();
    for (const rec of nextRecords) {
        const key = buildItemIdentity(rec);
        if (!batchMap.has(key)) {
            batchMap.set(key, rec);
        }
    }
    const uniqueNext = [...batchMap.values()];

    db.items.push(...uniqueNext);
    await writeDb(db);

    return uniqueNext;
}

async function listItems({ userEmail, category, search, deadlineStatus }) {
    const db = await readDb();
    let items = db.items.map((item) => ({
        ...item,
        deadline_status: buildDeadlineStatus(item.deadline)
    }));

    // Collapse legacy duplicates that differ only by extracted links or tracking params.
    const deduped = new Map();
    for (const item of items) {
        const key = buildItemIdentity(item);

        const prev = deduped.get(key);
        if (!prev || String(item.updated_at || "") > String(prev.updated_at || "")) {
            deduped.set(key, item);
        }
    }
    items = [...deduped.values()];

    // Additional strict dedupe by user + platform + primary link + title.
    const strictMap = new Map();
    for (const item of items) {
        const targetLink = normalizeUrl(item.primary_link || item.resource_url || item.source_url || "") || "";
        const key = [
            normalizeText(item.user_email || ""),
            normalizeText(item.platform || ""),
            targetLink.toLowerCase(),
            normalizeText(item.opportunity_title || item.summary || "")
        ].join("__");

        const prev = strictMap.get(key);
        if (!prev || String(item.updated_at || "") > String(prev.updated_at || "")) {
            strictMap.set(key, item);
        }
    }
    items = [...strictMap.values()];

    if (userEmail) {
        items = items.filter((item) => item.user_email === userEmail);
    }

    if (category) {
        items = items.filter((item) => item.category.toLowerCase() === String(category).toLowerCase());
    }

    if (deadlineStatus) {
        items = items.filter((item) => item.deadline_status === deadlineStatus);
    }

    if (search) {
        const needle = String(search).toLowerCase();
        items = items.filter((item) => {
            const corpus = [
                item.summary,
                item.opportunity_title || "",
                item.raw_description,
                item.organization_name,
                item.category,
                item.concept_topic || "",
                item.primary_link || "",
                item.resource_url || "",
                ...(item.extracted_urls || []),
                ...(item.keywords || [])
            ].join(" ").toLowerCase();
            return corpus.includes(needle);
        });
    }

    items.sort((a, b) => {
        if (!a.deadline && !b.deadline) return b.created_at.localeCompare(a.created_at);
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
    });

    return items;
}

async function getDashboardStats(userEmail) {
    const items = await listItems({ userEmail });
    const stats = {
        total: items.length,
        byCategory: {},
        deadlinesUpcoming: 0,
        deadlinesOverdue: 0,
        latestProcessedAt: items[0]?.updated_at || null
    };

    for (const item of items) {
        stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
        if (item.deadline_status === "upcoming") stats.deadlinesUpcoming += 1;
        if (item.deadline_status === "overdue") stats.deadlinesOverdue += 1;
    }

    return stats;
}

async function markNotified(itemIds) {
    if (!itemIds.length) return;
    const db = await readDb();
    db.items = db.items.map((item) => {
        if (!itemIds.includes(item.id)) return item;
        return { ...item, notified: true, updated_at: new Date().toISOString() };
    });
    await writeDb(db);
}

async function updateItemDeadline(itemId, newDeadline) {
    const db = await readDb();
    const itemIndex = db.items.findIndex((item) => item.id === itemId);
    
    if (itemIndex === -1) {
        throw new Error("Item not found");
    }
    
    const updatedItem = {
        ...db.items[itemIndex],
        deadline: newDeadline,
        deadline_status: buildDeadlineStatus(newDeadline),
        notified: false, // Reset notified status when deadline changes
        updated_at: new Date().toISOString()
    };
    
    db.items[itemIndex] = updatedItem;
    await writeDb(db);
    
    return updatedItem;
}

async function getDeadlineItemsForNotification() {
    const items = await listItems({});
    return items.filter((item) => item.deadline_status === "upcoming" && !item.notified && item.user_email);
}

function addDays(baseDate, days) {
    const next = new Date(baseDate);
    next.setDate(next.getDate() + days);
    return next;
}

function toDateOnly(value) {
    return value.toISOString().slice(0, 10);
}

function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

async function assignRandomDemoDeadlines(userEmail) {
    if (!userEmail) return { assigned: 0, items: [] };

    const db = await readDb();
    const now = new Date();
    const owned = db.items.filter((item) => item.user_email === userEmail);
    if (owned.length < 3) {
        return { assigned: 0, items: [] };
    }

    const alreadyAssigned = owned.filter((item) => item.provider === "demo-deadline");
    if (alreadyAssigned.length >= 3) {
        const refreshed = alreadyAssigned.map((item) => ({
            ...item,
            deadline_status: buildDeadlineStatus(item.deadline)
        }));
        return { assigned: 0, items: refreshed };
    }

    const available = shuffle(
        owned.filter((item) => item.provider !== "demo-deadline")
    );

    if (available.length < 3 - alreadyAssigned.length) {
        return { assigned: 0, items: [] };
    }

    const selected = [...alreadyAssigned, ...available.slice(0, 3 - alreadyAssigned.length)].slice(0, 3);
    const deadlines = [
        toDateOnly(addDays(now, 1)),
        toDateOnly(addDays(now, 2)),
        toDateOnly(addDays(now, 3))
    ];

    const selectedIds = new Set(selected.map((item) => item.id));
    const deadlineMap = new Map(selected.map((item, index) => [item.id, deadlines[index]]));
    const updatedAt = new Date().toISOString();

    db.items = db.items.map((item) => {
        if (!selectedIds.has(item.id)) return item;
        const deadline = deadlineMap.get(item.id) || item.deadline || null;
        return {
            ...item,
            deadline,
            deadline_status: buildDeadlineStatus(deadline),
            notified: false,
            provider: "demo-deadline",
            updated_at: updatedAt
        };
    });

    await writeDb(db);

    const refreshed = db.items
        .filter((item) => selectedIds.has(item.id))
        .map((item) => ({
            ...item,
            deadline_status: buildDeadlineStatus(item.deadline)
        }));

    return { assigned: selectedIds.size, items: refreshed };
}

async function reclassifyItems() {
    const db = await readDb();
    const { inferCategory } = require("./contentAnalyzer");
    
    let updated = 0;
    for (const item of db.items) {
        const text = `${item.opportunity_title || ""} ${item.raw_description || ""}`.trim();
        const newCategory = inferCategory(text);
        if (newCategory !== item.category && newCategory !== "Other") {
            item.category = newCategory;
            item.updated_at = new Date().toISOString();
            updated++;
        }
    }
    
    if (updated > 0) {
        await writeDb(db);
        console.log(`Reclassified ${updated} items`);
    } else {
        console.log("No items needed reclassification");
    }
    
    return updated;
}

async function generateTitles() {
    const db = await readDb();
    const { generateTitle, normalizeGeneratedTitle, extractTitleCandidateFromDescription, isMeaningfulTitle, buildContextualFallbackTitle } = require("./contentAnalyzer");
    
    let updated = 0;
    for (const item of db.items) {
        const description = item.raw_description || item.summary || "";
        const currentTitle = item.opportunity_title || item.raw_title || "";
        let newTitle = normalizeGeneratedTitle(currentTitle);

        if ((shouldRegenerateStoredTitle(currentTitle) || !newTitle || newTitle === "Untitled Opportunity" || !isMeaningfulTitle(newTitle)) && description.trim()) {
            newTitle = extractTitleCandidateFromDescription(description) || await generateTitle(description);
        }

        item.opportunity_title = (newTitle && newTitle !== "Untitled Opportunity" && isMeaningfulTitle(newTitle))
            ? newTitle
            : buildContextualFallbackTitle(description || currentTitle);
        item.updated_at = new Date().toISOString();
        updated++;
    }
    
    if (updated > 0) {
        await writeDb(db);
        console.log(`Generated titles for ${updated} items`);
    } else {
        console.log("No titles generated");
    }
    
    return updated;
}

module.exports = {
    insertItem,
    replaceItemsForUserSource,
    listItems,
    getDashboardStats,
    getDeadlineItemsForNotification,
    assignRandomDemoDeadlines,
    markNotified,
    updateItemDeadline,
    cleanDuplicateItems,
    reclassifyItems,
    generateTitles
};
