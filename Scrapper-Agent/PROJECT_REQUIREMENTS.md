# Project Requirements Document (PRD)

## 1. Project Name
Deadline Guard: Multi-Agent Saved-Post Organizer

## 2. Final Problem Statement
Students and early professionals save a large number of social posts and blogs containing internships, courses, learning links, and concept explanations. Over time, these saved items become noisy and unsearchable, causing users to miss important deadlines or fail to revisit useful content.

Deadline Guard converts scattered saved links into a structured, searchable, and deadline-aware dashboard using a multi-agent pipeline.

## 3. Why This Problem Matters in the Real World
- Missed opportunities: users lose internship/course chances due to deadline overload.
- Information fatigue: 100+ saved reels/posts are hard to revisit manually.
- Poor discoverability: native social media save features do not support meaningful classification/search.
- Time wastage: users repeatedly re-open and scan posts to find links.

## 4. Hackathon Strength
- High relatability and clear user pain.
- Strong agentic AI story: scrape agent + extraction/classification agent + deadline notifier.
- Demo-friendly flow with immediate visible transformation.
- Practical impact that judges can understand in under one minute.

## 5. Product Goal (MVP)
Allow users to paste URLs (single or multiple) and get:
- Summary of each post/page
- Category (Internship, Course, Theory Concept, AI Tool, Other)
- Keywords for search
- Organization name
- Extracted opportunity link
- Deadline extraction and upcoming reminders by email

## 6. User Flow
1. User opens homepage.
2. User enters email ID.
3. User pastes one URL or multiple URLs (one per line).
4. Scraper agent extracts title/description/links from source page.
5. Groq extraction agent summarizes and returns structured JSON.
6. Records are stored and shown in dashboard.
7. User filters by category or searches keywords/company/topic.
8. Deadline scheduler sends email reminders for near deadlines.

## 7. Multi-Agent Design
### Agent 1: Source Scraper Agent
- Detects platform (LinkedIn, Instagram, Facebook, generic web).
- Uses Puppeteer for dynamic page extraction.
- Returns raw description and outgoing links.

### Agent 2: Content Intelligence Agent (Groq)
- Summarizes raw text.
- Extracts organization name, primary link, relevant URLs, deadline, keywords.
- Assigns category and theory concept topic.

### Agent 3: Deadline Notifier Agent
- Periodically checks stored records.
- Finds items with upcoming deadlines.
- Sends grouped email reminders to each user.

## 8. Functional Requirements
1. URL ingestion:
- Accept `url` for single and `urls[]` for batch mode.
- Validate email format and HTTP/HTTPS links.

2. Scraping:
- Support LinkedIn, Instagram, Facebook, and generic web pages.
- Fallback to broad text extraction when metadata is unavailable.

3. AI extraction/classification:
- Generate summary.
- Extract organization, primary link, keywords, deadline, and concept topic.
- Classify into fixed categories.

4. Dashboard:
- Sidebar quick menu by category.
- Stats: total processed, category counts, upcoming deadlines.
- Search by keyword/company/topic/link text.

5. Notifications:
- Upcoming deadline view in UI.
- Email sending via SMTP configuration.

## 9. Non-Functional Requirements
- Performance: typical URL processing under 15 seconds.
- Reliability: partial failures in batch must not block successful items.
- Security: API keys only via environment variables.
- Maintainability: modular services with clear responsibilities.

## 10. Tech Stack
Frontend:
- Next.js 15 + React 19 + TypeScript
- Tailwind CSS
- shadcn-style UI components

Backend:
- Node.js + Express
- Puppeteer + puppeteer-extra + stealth plugin
- node-cron
- nodemailer

AI/LLM:
- Groq Chat Completions API with strict JSON output

Storage:
- JSON file for MVP (`data/items.json`)
- Upgrade path: PostgreSQL/MongoDB for scale

## 11. API Contract (MVP)
1. `POST /api/ingest`
- Body: `{ userEmail, url }` or `{ userEmail, urls: [] }`
- Response: processed items, processed count, failure list

2. `POST /api/ingest/batch`
- Same contract as ingest endpoint

3. `GET /api/items`
- Query: `userEmail`, `category`, `search`, `deadlineStatus`

4. `GET /api/dashboard/stats`
- Query: `userEmail`

5. `GET /api/notifications`
- Query: `userEmail`

6. `POST /api/notifications/send`
- Triggers immediate reminder run

## 12. Data Schema (Current MVP Record)
- `id`
- `source_url`
- `user_email`
- `platform`
- `raw_title`
- `raw_description`
- `summary`
- `category`
- `concept_topic`
- `keywords[]`
- `organization_name`
- `primary_link`
- `extracted_urls[]`
- `deadline`
- `deadline_status`
- `provider`
- `notified`
- `created_at`
- `updated_at`

## 13. Step-by-Step Implementation Procedure
1. Configure environment variables for backend and frontend.
2. Start backend service and validate `/api/ingest` with one test URL.
3. Start frontend and verify email capture on home page.
4. Ingest 5-10 sample URLs (single + bulk textarea mode).
5. Validate classification quality for internships, courses, theory concepts.
6. Verify keyword search and category filters from dashboard.
7. Configure SMTP and trigger `POST /api/notifications/send`.
8. Demonstrate upcoming deadline panel and sent reminder flow.
9. Freeze demo dataset for judge presentation.
10. Record metrics: processed count, classification distribution, due-soon items.

## 14. Demo Script for Judges
1. Show chaotic saved-links problem in one slide.
2. Paste mixed URLs into Deadline Guard.
3. Show automatic summary, category, company, link, deadline extraction.
4. Search a keyword/company and open extracted opportunity link.
5. Trigger reminder email and show due-soon panel.
6. Close with user impact: less overwhelm, fewer missed deadlines.

## 15. Risk Register
- Private or restricted social links may not scrape reliably.
- Some deadlines may be ambiguous in natural text.
- Rate limits/cost constraints on LLM calls.

Mitigations:
- Show graceful fallback and error messaging.
- Allow fallback rule-based extraction when model output is unavailable.
- Keep model prompts deterministic with strict JSON schema.

## 16. Success Criteria for Hackathon
- End-to-end run from URL ingestion to dashboard item creation.
- Category accuracy good enough for meaningful filtering.
- Search quickly surfaces relevant opportunities.
- Upcoming deadlines are visible and reminders can be sent.

## 17. Security Note
Never hardcode API keys in source code. Keep Groq and SMTP secrets in `.env` and rotate keys if a secret was exposed publicly.
