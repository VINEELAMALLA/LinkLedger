# Scraper Extraction Improvements

## Problem
The previous extraction logic wasn't properly handling LinkedIn posts with multiple numbered items (courses, internships, etc.), each with their own dedicated link.

## Example Format That was failing:
```
Free Google AI Courses

1 - Introduction to Generative AI
Get a fast, clear overview of AI...
Access it: https://lnkd.in/e-i-QWYc

2 - Introduction to Large Language Models
Go deeper into the tech...
Access it: https://lnkd.in/eqUNgYyr

[...9 courses total...]
```

## Solution Implemented

### 1. Enhanced System Prompt (contentAnalyzer.js)
- **More explicit** about extracting ALL items from numbered lists
- **Clarified** that each course/item with its own link = separate opportunity object
- **Emphasized** matching course names to their dedicated links correctly
- **Specified** that source post URL should NOT be included as course links

### 2. Improved extractNumberedOpportunities() Function
**Changes:**
- Now uses `pendingLinks` arrays to collect all URLs following a numbered title
- Tracks whether we have a complete title+link pair before creating opportunity objects
- Creates ONE opportunity per link (not merging multiple links into one opportunity)
- Handles empty lines as "save pending opportunity" markers
- Properly saves the last pending opportunity even if file ends

**Old Logic Issue:**
- Only handled one link per numbered title
- Would skip entire items if format didn't match exactly

**New Logic:**
- Multiple links after one title create multiple opportunities
- Flexible line parsing that handles various spacing/formatting

### 3. Better User Prompt (contentAnalyzer.js)
Added explicit extraction instructions:
```
INSTRUCTIONS:
1. If you see numbered items (1 - Title, 2 - Title, etc), extract EVERY SINGLE ONE
2. Match each item to its corresponding link immediately following it
3. Create opportunities array with one object per numbered item
4. Ensure all numbered items are represented if they have links
```

## Expected Output Format
For each course, the system now extracts:
```json
{
  "courseName": "Introduction to Generative AI",
  "courseLink": "https://lnkd.in/e-i-QWYc",
  "resourcePost": "https://www.linkedin.com/feed/update/..."
}
```

In the database, it's stored as:
```json
{
  "opportunity_title": "Introduction to Generative AI",
  "primary_link": "https://lnkd.in/e-i-QWYc",
  "source_url": "https://www.linkedin.com/feed/update/...",
  "resource_url": "https://www.linkedin.com/feed/update/...",
  "category": "Course"
}
```

## Testing
Created `test-course-extraction.js` to test the extraction with your exact example:
- 9 Google AI courses
- Each with its own link
- Validates all 9 are extracted as separate opportunities
- Shows the resource post URL is stored separately

## Files Modified
1. `services/contentAnalyzer.js`
   - Updated system prompt (line ~320)
   - Rewrote extractNumberedOpportunities() function (line ~130)
   - Enhanced user prompt (line ~330)

## Files Created
1. `test-course-extraction.js` - Test script for validating the extraction
