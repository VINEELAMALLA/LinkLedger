# Groq API Configuration Guide

## Issue Summary
Two problems were fixed:

1. **URL Duplication**: Links appearing multiple times in `extracted_urls`
2. **Word Relationships**: Groq API not properly matching course titles to their links

---

## Solutions Implemented

### 1. URL Deduplication Fixes

**Where duplicates were removed:**
- `normalizeOpportunity()` - Using Set to deduplicate URLs per opportunity
- `normalizeGroqResponse()` - Using Map for case-insensitive deduplication across all URLs
- Final `allExtracted` - Double-check deduplication before returning

**How it works:**
```javascript
// Before: duplicates possible
const urlSet = new Set([link, ...rawUrls])
const extracted_urls = [...urlSet].slice(0, 20)

// After: proper deduplication with Map
const urlMap = new Map();
[...urls].forEach(url => {
    if (!urlMap.has(url.toLowerCase())) {
        urlMap.set(url.toLowerCase(), url);
    }
});
const extracted_urls = [...urlMap.values()];
```

### 2. Word Relationship Detection Improvements

**Pre-parsing structure:**
Before sending to Groq, the code now parses numbered items and their links:
```javascript
const numberedItems = [
    { number: '1', title: 'Introduction to Generative AI', link: 'https://lnkd.in/e-i-QWYc' },
    { number: '2', title: 'Introduction to Large Language Models', link: 'https://lnkd.in/eqUNgYyr' },
    ...
];
```

**Improved Groq prompts:**
- System prompt now explains PATTERN MATCHING and TITLE-TO-LINK RELATIONSHIPS
- User prompt includes STEP-BY-STEP instructions for linking titles to URLs
- Added example mapping to show expected output format
- Explicit validation: "Count numbered items in input AND opportunities in output - they should MATCH"

**Key instruction added:**
```
STEP 1: Identify all numbered items (pattern: digit(s) + dash/dot/paren + text)
STEP 2: For each numbered item, find its link by looking at:
  - Text after 'Access it:' or 'Link:' on same line
  - Next 1-3 lines if not on same line
  - Patterns like 'Apply:', 'Get Started:', 'Enroll:', 'Join:'
STEP 3: Create exactly ONE opportunity object per numbered item (if it has a link)
STEP 4: Do NOT merge or skip any items
STEP 5: Verify count: if 9 items exist → output 9 opportunities (not 1, not 5)
```

---

## Setting Up Groq API Key

### Step 1: Get Groq API Key
1. Go to https://console.groq.com/
2. Sign up or login
3. Go to API Keys section
4. Create new API key
5. Copy the key

### Step 2: Set Environment Variable

**Option A: Create `.env` file in Scrapper-Agent folder**

Create `c:\JHTUH\Scrapper-Agent\.env`:
```
GROQ_API_KEY=gsk_YOUR_API_KEY_HERE
GROQ_MODEL=llama-3.3-70b-versatile
```

**Option B: Set in PowerShell (temporary)**
```powershell
$env:GROQ_API_KEY="gsk_YOUR_API_KEY_HERE"
$env:GROQ_MODEL="llama-3.3-70b-versatile"
node server.js
```

**Option C: Set in PowerShell profile (permanent)**
```powershell
[Environment]::SetEnvironmentVariable("GROQ_API_KEY", "gsk_YOUR_API_KEY_HERE", "User")
[Environment]::SetEnvironmentVariable("GROQ_MODEL", "llama-3.3-70b-versatile", "User")
```
Then restart PowerShell/cmd.

### Step 3: Verify Setup

Run the test:
```bash
cd c:\JHTUH\Scrapper-Agent
node test-api-improvements.js
```

Expected output:
```
✅ PASSED: No duplicate URLs found
✅ PASSED: All 3 opportunities extracted
✅ PASSED: All relationships detected correctly
```

If you see "⚠️ GROQ_API_KEY not set. Using fallback extraction.", the environment variable isn't set correctly.

---

## What Changed in the Code

### `services/contentAnalyzer.js`

1. **URL Deduplication** (lines 350-370)
   - Using Map instead of Set for case-insensitive deduplication
   - Triple-check deduplication in `normalizeGroqResponse()`

2. **Pre-parsing** (lines 390-410)
   - Parses numbered items and links before sending to Groq
   - Includes this in the prompt as "PRE-PARSED STRUCTURE"

3. **Improved Prompts** (lines 430-480)
   - System prompt: Added PATTERN MATCHING and title-to-link relationship instructions
   - User prompt: Added STEP-BY-STEP instructions and example mapping

4. **Better Error Handling** (lines 500-530)
   - Validates Groq API key
   - Checks API response validity
   - Falls back to local extraction if API fails
   - Logs warnings for debugging

---

## Testing

Run comprehensive tests:

```bash
# Test 1: URL Deduplication
node test-api-improvements.js

# Test 2: LinkedIn Google Courses
node test-linkedin-google-courses.js

# Test 3: Link Filtering
node test-link-filtering.js

# Test 4: Course Extraction
node test-course-extraction.js
```

---

## Expected Behavior

### Before Fixes
```
Input: 3 courses with 9 extracted links (all with duplicates)
Output: extracted_urls had 9 items (with duplicates)
Output: opportunities: 1 or 2 (missing some)
```

### After Fixes
```
Input: 3 courses with 9 extracted links (with duplicates)
Output: extracted_urls has 3 items (all unique)
Output: opportunities: 3 (all matched correctly)
Category: Course (not "Theory Concept")
Organization: Google (not "LinkedIn")
```

---

## Troubleshooting

### Issue: "Using fallback extraction"
**Cause**: Groq API key not set or invalid
**Solution**: Check `.env` file and API key

### Issue: Still getting duplicates
**Cause**: Cache or old code running
**Solution**: 
```bash
npm cache clean --force
node test-api-improvements.js
```

### Issue: Poor title-to-link matching
**Cause**: Groq model not understanding structure
**Solution**: Ensure pre-parsed structure is being sent in prompt

