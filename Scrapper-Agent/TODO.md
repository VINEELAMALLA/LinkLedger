 api al# Scrapper-Agent Fix: LinkedIn Courses, No Dups, Better Summarization
Status: ✅ Plan Approved | ⏳ In Progress

## Logical Steps from Approved Plan

### 1. ✅ Switch contentAnalyzer.js to Groq API (priority)
   - Detect `process.env.GROQ_API_KEY` first
   - Fallback to Mistral if no Groq key
   - Use `llama3-groq-70b-8192` or `mixtral-8x7b-32768`
   - Add exact Google AI courses example to system prompt
   - Test: `node test-linkedin-google-courses.js` → 9x Course items

### 2. ✅ Enhance prompts & fix fallback in contentAnalyzer.js
   - System prompt: Include user-provided example output format
   - Fallback: Pipe desc thru `removeNavigationNoise()`, force 'Course' for Google lists
   - Strengthen `inferCategory()` for numbered courses

### 3. ✅ Strengthen deduplication (ingestController.js)
   - Add `primary_link` + sorted `extracted_urls[0]` to `buildOpportunityIdentity()`
   - Ensure canonical URLs in identity

### 4. ✅ Client-side dedupe in UI (public/app.js)
   - Before renderItems(), unique by source_url + title hash
   - Group same-source multiples

### 5. [ ] Noise filters (utils/extractor.js)
   - Add selectors for LinkedIn language menu
   - Filter more UI text patterns

### 6. [ ] Test & Verify
   - Run all test-*.js → all ✅
   - Manual: Ingest Google courses post → verify UI shows 9 unique Courses, no noise/duplicates
   - Check storage: No dup records

### 7. [ ] Completion
   - Update TODO.md ✅ marks
   - attempt_completion with demo command

**Next Step:** Test extraction `node test-linkedin-google-courses.js` then Step 3: ingestController.js dedupe

