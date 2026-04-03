const STOP_WORDS = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with']);
const TITLE_BANNED_WORDS = new Set([
  'you', 'your', 'yours', 'want', 'wanted', 'wants', 'like', 'likes', 'liked', 'comment', 'comments',
  'apply', 'applying', 'join', 'joining', 'learn', 'learning', 'looking', 'best', 'free', 'click',
  'open', 'opened', 'applications', 'application', 'hiring', 'register', 'registration', 'registrations',
  'attention', 'jump-start', 'bio', 'link', 'today', 'tomorrow', 'yesterday', 'online', 'expert', 'trainers',
  'trainer', 'support', 'ready', 'master', 'discount', 'offer', 'off', 'sale', 'limited', 'batch',
  'january', 'february', 'march', 'april', 'may',
  'june', 'july', 'august', 'september', 'october', 'november', 'december'
]);
const TITLE_KEY_TERMS = [
  'internship', 'program', 'course', 'kit', 'bootcamp', 'workshop', 'fellowship', 'scholarship',
  'training', 'certification', 'role', 'hiring', 'job', 'challenge', 'hackathon', 'summit',
  'webinar', 'conference', 'class', 'interview', 'scientist-b', 'engineer', 'developer', 'analyst'
];
const LOCATION_LIKE_WORDS = new Set([
  'hyderabad', 'mardan', 'india', 'indian', 'pakistan', 'karachi', 'lahore', 'delhi', 'mumbai', 'bangalore',
  'chennai', 'kolkata', 'pune', 'london', 'dubai', 'usa', 'uk', 'germany', 'arabic', 'spanish', 'english',
  'malay', 'czech', 'danish', 'bahasa', 'indonesia', 'malaysia', 'tagalog', 'turkish', 'thai', 'japanese',
  'korean', 'french', 'italian', 'dutch', 'norwegian', 'polish', 'portuguese', 'romanian', 'russian', 'swedish'
]);
const TITLE_LEADING_VERBS = new Set([
  'build', 'start', 'learn', 'join', 'apply', 'boost', 'master', 'become', 'explore', 'discover',
  'unlock', 'transform', 'grow', 'launch', 'kickstart', 'improve', 'advance'
]);
const TITLE_FRAGMENT_WORDS = new Set([
  'recruiters', 'recruiter', 'candidates', 'candidate', 'understand', 'looking', 'look', 'seeking',
  'should', 'must', 'need', 'needs', 'prefer', 'preferred', 'required', 'requires'
]);

function sanitizeDescriptionText(description) {
  return String(description || "").replace(/\s+/g, " ").trim();
}

function isMeaningfulTitle(title) {
  const text = String(title || "").trim();
  if (!text) return false;
  if (text.length < 4) return false;
  if (/[()[\]{}]/.test(text)) return false;
  if (/[?]/.test(text)) return false;
  if (/%/.test(text)) return false;
  if (/[#@_]/.test(text)) return false;
  if (/https?:\/\//i.test(text)) return false;
  if (/likes?|comments?|followers?|members|manage|instagram|linkedin|facebook|page not found|uh oh|online expert trainers|certification support/i.test(text)) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 6) return false;

  const normalizedWords = words.map((word) => word.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, ""));
  if (normalizedWords.some((word) => !word || TITLE_BANNED_WORDS.has(word))) return false;
  if (normalizedWords.every((word) => LOCATION_LIKE_WORDS.has(word))) return false;
  if (normalizedWords.every((word) => ['online', 'expert', 'trainer', 'trainers', 'support'].includes(word))) return false;
  if (TITLE_LEADING_VERBS.has(normalizedWords[0]) && !normalizedWords.some((word) => TITLE_KEY_TERMS.includes(word))) return false;
  if (normalizedWords.some((word) => TITLE_FRAGMENT_WORDS.has(word)) && !normalizedWords.some((word) => TITLE_KEY_TERMS.includes(word))) return false;
  if (/^(build|start|learn|join|apply|boost|master)\b/i.test(text)) return false;
  if (/(career healthcare start|healthcare start|build career|recruiters look candidates|candidates who understand)/i.test(text)) return false;

  const hasKeyTerm = normalizedWords.some((word) => TITLE_KEY_TERMS.includes(word));
  const hasUppercaseSignal = words.some((word) => /[A-Z]/.test(word) && word.replace(/[^A-Za-z]/g, "").length >= 2);
  const hasNonLocationSignal = normalizedWords.some((word) => !LOCATION_LIKE_WORDS.has(word));

  return (hasKeyTerm || hasUppercaseSignal) && hasNonLocationSignal;
}

function buildContextualFallbackTitle(description) {
  const text = sanitizeDescriptionText(description).toLowerCase();

  if (/\bscientist-b\b/.test(text)) return "Scientist-B Opportunity";
  if (/\binternship\b/.test(text)) return "Internship Opportunity";
  if (/\bfellowship\b/.test(text)) return "Fellowship Opportunity";
  if (/\bscholarship\b/.test(text)) return "Scholarship Opportunity";
  if (/\bbootcamp\b/.test(text)) return "Bootcamp Opportunity";
  if (/\bworkshop\b/.test(text)) return "Workshop Opportunity";
  if (/\bwebinar\b/.test(text)) return "Webinar Opportunity";
  if (/\bhackathon\b/.test(text)) return "Hackathon Opportunity";
  if (/\bchallenge\b/.test(text)) return "Challenge Opportunity";
  if (/\btraining\b/.test(text)) return "Training Opportunity";
  if (/\bcertification\b/.test(text)) return "Certification Opportunity";
  if (/\bcourse\b/.test(text) || /\bkit\b/.test(text) || /\bclass\b/.test(text)) return "Course Opportunity";
  if (/\bjob\b|\bhiring\b|\brole\b|\bdeveloper\b|\bengineer\b|\banalyst\b/.test(text)) return "Job Opportunity";
  if (/\bprogram\b/.test(text)) return "Program Opportunity";

  return "Career Opportunity";
}

function extractTitleCandidateFromDescription(description) {
  const text = sanitizeDescriptionText(description)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  const patterns = [
    /\b([A-Za-z0-9&/+\- ]{3,60}?(?:SAP IBP|Power BI|Data Analytics|Cyber Security|Cloud Computing|SQL|Python|Java|React|AWS|Azure|DevOps)\s+(?:Course|Training|Certification|Bootcamp|Workshop|Program))/i,
    /\b((?:SAP IBP|Power BI|Data Analytics|Cyber Security|Cloud Computing|SQL|Python|Java|React|AWS|Azure|DevOps))\b/i,
    /check out [^.!?]{0,120}?'s ([A-Za-z0-9&/()+\- ]{5,80}?(?:Program|Internship|Course|Kit|Bootcamp|Workshop|Fellowship|Scholarship))/i,
    /(?:that'?s exactly why this|this)\s+([A-Za-z0-9&/()+\- ]{5,80}?(?:Program|Internship|Course|Kit|Bootcamp|Workshop|Fellowship|Scholarship))\s+(?:exists|is|was)\b/i,
    /([A-Za-z0-9&/+\- ]{3,60}?(?:Interview Kit|Internship Program|Summer Internship|Scientist-B|Training Program|Certification Course|Bootcamp|Workshop|Hackathon))/i,
    /\b([A-Za-z0-9&/()+\- ]{5,80}?(?:Program|Internship|Course|Kit|Bootcamp|Workshop|Fellowship|Scholarship))\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    const rawCandidate = match[1]
      .replace(/\bLast[- ]Minute\b/gi, " ")
      .replace(/\bCollege students\b/gi, " ")
      .trim();

    const candidate = normalizeGeneratedTitle(
      /^(sap ibp|power bi|data analytics|cyber security|cloud computing|sql|python|java|react|aws|azure|devops)$/i.test(rawCandidate)
        ? `${rawCandidate} Training`
        : rawCandidate
    );

    if (isMeaningfulTitle(candidate)) {
      return candidate;
    }
  }

  if (/\bNIC\b/i.test(text) && /\bScientist-B\b/i.test(text)) {
    return "NIC Scientist-B";
  }

  return "";
}

function normalizeGeneratedTitle(title) {
  const cleaned = String(title || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ")
    .replace(/[|_*~`#@^+=<>[\]{}]/g, " ")
    .replace(/\bLast[- ]Minute\b/gi, " ")
    .replace(/\b(?:follow|share|save|dm|message|comment)\b/gi, " ")
    .replace(/\b\d+%\s*off\b/gi, " ")
    .replace(/\boff\b/gi, " ")
    .replace(/\b\d{1,2}(st|nd|rd|th)?\b/gi, " ")
    .replace(/\b\d{3,}\b/g, " ")
    .replace(/\b(?:mon|tue|wed|thu|fri|sat|sun)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned
    .split(/\s+/)
    .filter((word) => {
      const normalized = word.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");
      if (!normalized) return false;
      if (TITLE_BANNED_WORDS.has(normalized)) return false;
      if (/^\d+$/.test(normalized)) return false;
      return true;
    })
    .slice(0, 8)
    .join(" ")
    .trim();
}

async function generateTitle(description) {
  const apiKey = String(process.env.GROQ_API_KEY || "").trim();
  const model = process.env.GROQ_MODEL || "llama3-8b-8192";
  const endpoint = "https://api.groq.com/openai/v1/chat/completions";

  if (!apiKey) {
    const heuristicTitle = extractTitleCandidateFromDescription(description);
    if (heuristicTitle) return heuristicTitle;
    const words = String(description || "").split(/\s+/).slice(0, 5).join(" ");
    const fallback = normalizeGeneratedTitle(words);
    return isMeaningfulTitle(fallback) ? fallback : buildContextualFallbackTitle(description);
  }

  const cleanDescription = sanitizeDescriptionText(description);

  const systemPrompt = "Extract a clean item-card title of only the core opportunity/topic in 2-6 words. Return only the title text. The title must be meaningful on its own. It must be a noun phrase, not a sentence fragment or call to action. Do not include brackets or any text inside brackets. Do not include emojis, symbols, dates, usernames, engagement words, call-to-action wording, pronouns, filler words, verbs like want/join/apply/learn/build/start, adjectives like best/free, nouns like comments/likes, or platform metadata. Do not use location names, country names, city names, language names, or region names as the title.";

  const userPrompt = `Identify the actual item-card title from this social media post description.

Rules:
- Output only 2 to 6 words.
- Keep only the core topic, program name, role, event name, or resource name.
- The title must make sense by itself without needing the original sentence.
- Do not use brackets, parentheses, or any text that was inside brackets.
- Do not use a location name, city name, country name, state name, or language name as the title.
- Do not include emojis or decorative symbols.
- Do not include words like you, your, want, like, comments, likes, apply, join, learn, best, free.
- Do not output sentence fragments such as "Build Career Healthcare Start".
- Do not start the title with verbs like build, start, learn, join, apply, boost, or master.
- Do not output recruiter advice or prose fragments such as "Recruiters look candidates who understand".
- Do not include dates, months, day names, numbers used as metadata, usernames, hashtags, or platform text.
- Do not write a sentence or phrase with verbs/adjectives unless they are part of the official program name.
- Prefer concise noun phrases.
- If the post is noisy, infer the cleanest topic name from the description.

Examples:
- "Attention college students! Want jump-start your data career?" -> "Data Analytics Internship"
- "2,931 likes, 44 comments, March 10" -> "Course Opportunity"
- "FREE cloud computing and cybersecurity course" -> "Cloud Computing Cybersecurity Course"
- "Bahasa Indonesia (Bahasa Indonesia)" -> "Career Opportunity"
- "Build Career Healthcare? Start" -> "Healthcare Training Program"
- "Recruiters look candidates who understand" -> "Career Opportunity"

Return only the title.

Description: ${cleanDescription.slice(0, 500)}

Random: ${Date.now()}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 50,
        temperature: 0.3
      })
    });

    const data = await response.json();

    let title = data?.choices?.[0]?.message?.content?.trim() || "";

    let cleanTitle = title.replace(/^["']|["']$/g, "").replace(/[,\s]+$/, "").trim();

    cleanTitle = cleanTitle
      .replace(/\d+\s+likes?,\s*\d+\s+comments?\s*[-—]\s*$/i, "")
      .replace(/\d+\s*million\+\s*members\s*\|\s*Manage\s*$/i, "")
      .replace(/^\d+%\s*FREE\s*/i, "FREE ")
      .replace(/Looking for the best\s*/i, "")
      .replace(/\s*[-—]\s*$/, "")
      .replace(/^\s*attention\s+college\s+students!?\s*/i, "")
      .replace(/want to\s*$/i, "")
      .trim();

    cleanTitle = normalizeGeneratedTitle(cleanTitle);

    if (!isMeaningfulTitle(cleanTitle)) {
      const heuristicTitle = extractTitleCandidateFromDescription(cleanDescription);
      if (heuristicTitle) {
        cleanTitle = heuristicTitle;
      }
    }

    if (/\d+\s+likes?|\d+\s+comments?|million\+|members|manage|language|page not found|uh oh/i.test(cleanTitle) || cleanTitle.length < 3 || !isMeaningfulTitle(cleanTitle)) {
      const heuristicTitle = extractTitleCandidateFromDescription(cleanDescription);
      if (heuristicTitle) {
        cleanTitle = heuristicTitle;
      }
    }

    if (/\d+\s+likes?|\d+\s+comments?|million\+|members|manage|language|page not found|uh oh/i.test(cleanTitle) || cleanTitle.length < 3 || !isMeaningfulTitle(cleanTitle)) {
      const words = String(cleanDescription || "").split(/\s+/).filter(w => w.length > 2 && !/^\d+$/.test(w) && !STOP_WORDS.has(w.toLowerCase())).slice(0, 5).join(" ");
      const fallback = normalizeGeneratedTitle(words);
      cleanTitle = isMeaningfulTitle(fallback) ? fallback : buildContextualFallbackTitle(cleanDescription);
    }

    return isMeaningfulTitle(cleanTitle) ? cleanTitle : buildContextualFallbackTitle(cleanDescription);
  } catch (error) {
    console.error("Error generating title:", error);
    const heuristicTitle = extractTitleCandidateFromDescription(cleanDescription);
    if (heuristicTitle) return heuristicTitle;
    const words = String(cleanDescription || "").split(/\s+/).filter(w => w.length > 2 && !/^\d+$/.test(w) && !STOP_WORDS.has(w.toLowerCase())).slice(0, 5).join(" ");
    const fallback = normalizeGeneratedTitle(words);
    return isMeaningfulTitle(fallback) ? fallback : buildContextualFallbackTitle(cleanDescription);
  }
}

async function analyzeContent({ title, description, sourceUrl, extractedLinks = [], categories = [] }) {
  // Placeholder implementation
  return { opportunities: [], categories: [] };
}

async function resolveOpportunityTitle({ candidateTitle, description }) {
  const normalizedCandidate = normalizeGeneratedTitle(candidateTitle);
  if (isMeaningfulTitle(normalizedCandidate)) {
    return normalizedCandidate;
  }

  const heuristicTitle = extractTitleCandidateFromDescription(description);
  if (heuristicTitle) {
    return heuristicTitle;
  }

  return generateTitle(description || candidateTitle || "");
}

function inferCategory(cleanText) {
  const text = sanitizeDescriptionText(cleanText).toLowerCase();

  if (!text) return "Other";

  if (/\b(internship|intern|summer internship|winter internship|trainee program)\b/.test(text)) {
    return "Internship";
  }

  if (/\b(course|certification|certificate|training|bootcamp|workshop|webinar|masterclass|tutorial|learn|learning|class|sql certification|interview kit)\b/.test(text)) {
    return "Course";
  }

  if (/\b(job|jobs|hiring|vacancy|vacancies|role|roles|position|positions|recruitment|apply now|walk-in|engineer|developer|analyst|scientist-b)\b/.test(text)) {
    return "Job";
  }

  if (/\b(ai tool|tool|app|platform|software|extension|plugin|saas|generator|assistant)\b/.test(text)) {
    return "AI Tool";
  }

  if (/\b(theory|concept|architecture|explanation|explained|guide|roadmap|fundamentals|basics|introduction|overview|workflow)\b/.test(text)) {
    return "Theory Concept";
  }

  return "Other";
}

module.exports = { analyzeContent, inferCategory, generateTitle, normalizeGeneratedTitle, extractTitleCandidateFromDescription, isMeaningfulTitle, buildContextualFallbackTitle, resolveOpportunityTitle };
