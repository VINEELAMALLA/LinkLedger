function detectPlatform(url) {
    const normalized = String(url || "").toLowerCase();

    if (normalized.includes("instagram.com")) return "instagram";
    if (normalized.includes("linkedin.com")) return "linkedin";
    if (normalized.includes("facebook.com") || normalized.includes("fb.com")) return "facebook";
    if (normalized.startsWith("http://") || normalized.startsWith("https://")) return "web";

    return "unknown";
}

module.exports = detectPlatform;
