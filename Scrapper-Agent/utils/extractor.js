function cleanText(value) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim();
}

function removeNavigationNoise(text) {
    // Remove common navigation, language menu, and UI text that shouldn't be in content
    const noisePatterns = [
        /Bahasa\s+\w+/gi,  // Language names: "Bahasa Indonesia", "Bahasa Malaysia", etc.
        /Čeština|Dansk|Deutsch|Español|Français|한국어|Italiano|Nederlands|Português|Русский|Ελληνικά|עברית|العربية/gi,
        /繁體中文|简体中文|日本語|ไทย|Tiếng\s+\w+/gi,
        /\(Bahasa\s+\w+\)/gi,
        /\(English\|/gi,
        /Choose a language|Pilih bahasa|選擇語言/gi,
        /Sign in|Sign up|Log in|Register|Join now/gi,
        /Help\s+Center|Privacy|Terms|Cookie/gi,
        /^[\s]*(About|Home|My Network|Jobs|Messaging|Notifications|Settings|Preferences)\s*$/gim,
        /\|[\s]*(About|Careers|Blog|Safety|Terms|Privacy|Ad Choices|Advertising|Business Services)\s*\|/gi
    ];

    let cleaned = text;
    for (const pattern of noisePatterns) {
        cleaned = cleaned.replace(pattern, "");
    }

    // Remove lines that are just language codes or single words from navigation
    const lines = cleaned.split(/\n|\s{2,}/).filter(line => {
        const trimmed = line.trim();
        // Keep only meaningful content (longer phrases, not single words like "linkedin", "policy", "page")
        if (trimmed.length < 4) return false;
        if (/^(page|policy|linkedin|link|open|view|english|chinese|indonesia|malaysia|malay|tagalog)$/i.test(trimmed)) {
            return false;
        }
        return true;
    });

    return lines.join(" ").replace(/\s+/g, " ").trim();
}

async function extractDescription(page) {
    return page.evaluate(() => {
        const take = (selector, attr = "textContent") => {
            const node = document.querySelector(selector);
            if (!node) return "";

            const value = attr === "textContent" ? node.textContent : node.getAttribute(attr);
            return (value || "").replace(/\s+/g, " ").trim();
        };

        const title =
            document.title ||
            take("meta[property='og:title']", "content") ||
            take("meta[name='twitter:title']", "content");

        let description =
            take("meta[property='og:description']", "content") ||
            take("meta[name='description']", "content") ||
            take("meta[name='twitter:description']", "content");

        // LinkedIn-specific selectors for post content
        if (!description) {
            const candidates = [
                // LinkedIn post content containers
                "article",
                "main",
                ".feed-shared-update-v2",
                "[data-ad-preview='message']",
                // LinkedIn specific text containers
                ".break-words",
                ".ql-editor",
                "[data-test-id='feed-item-update-body']",
                // Post text paragraphs
                "p[dir='ltr']",
                ".display-flex.flex-column.full-width span[dir='ltr']",
                ".show-more-less-html__markup"
            ];

            for (const selector of candidates) {
                const element = document.querySelector(selector);
                if (element) {
                    const text = element.textContent || element.innerText || "";
                    if (text.trim().length > 50) {  // Only use if meaningful length
                        description = text.replace(/\s+/g, " ").trim().slice(0, 1500);
                        break;
                    }
                }
            }
        }

        // Fallback: extract all text but be more selective
        if (!description || description.length < 30) {
            const bodyText = (document.body?.innerText || "").replace(/\s+/g, " ").trim();
            // Take first 1500 chars of body as last resort
            description = bodyText.slice(0, 1500);
        }

        // Extract links - filter out LinkedIn UI links
        const extractedLinks = Array.from(document.querySelectorAll("a[href]"))
            .map((node) => {
                const href = node.getAttribute("href") || "";
                const text = node.textContent || "";
                return {
                    href: href,
                    text: text.trim()
                };
            })
            .filter(link => {
                // Exclude LinkedIn UI links
                const href = link.href.toLowerCase();
                const text = link.text.toLowerCase();
                const isUILink = /^\/(jobs|courses|in\/|company\/|messaging|feed\/|my-network|notifications|settings|safety|help|about|directory|hashtag)/.test(href)
                    || /^(sign in|sign up|log in|register|join|about|careers|blog|help|settings|contact|terms|privacy)$/i.test(text)
                    || text.length < 3;
                
                return !isUILink && href;
            })
            .map(link => link.href)
            .slice(0, 80);

        return {
            title: (title || "").trim(),
            description: (description || "No description found").trim(),
            extractedLinks
        };
    }).then((data) => ({
        ...data,
        title: cleanText(data.title),
        description: removeNavigationNoise(cleanText(data.description))
    }));
}

module.exports = extractDescription;
