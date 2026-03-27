# Remote AI Jobs - Specification

## Concept & Vision

A curated job board for AI/ML professionals seeking remote opportunities. Clean, fast, no fluff. Jobs aggregated from multiple sources (Indeed, LinkedIn, Glassdoor, etc.) plus direct company postings. Charge companies $99-299/month to post jobs.

**Vibe:** Futuristic but professional. Think "AI meets productivity porn." Dark mode by default, sharp typography, minimal clutter.

## Design Language

### Aesthetic
- Dark theme: #0a0a0f background, #1a1a2e cards
- Accent: Electric blue #0066ff
- Secondary: Purple #7b2dff
- Text: White #ffffff, muted #8888aa

### Typography
- Headings: Inter (700) — sharp, modern
- Body: Inter (400) — clean readability
- Monospace: JetBrains Mono — for tags/skills

### Motion
- Cards: subtle hover lift (transform: translateY(-4px))
- Loading: skeleton shimmer
- Filters: smooth accordion transitions

## Layout

### Pages
1. **Home** — Hero + search + featured jobs + categories
2. **Jobs Listing** — Filterable job list with sidebar
3. **Job Detail** — Full job description + apply button + company info
4. **Post a Job** — Form for companies to submit listings (paid)
5. **Admin** — Dashboard to manage jobs

### Structure
```
Header: Logo | Search | Post Job | Login
Hero: Large headline + search bar
Content: Job cards in grid
Footer: Links + copyright
```

## Features

### Job Aggregation
- Scrape jobs from Indeed API (or scrape)
- Scrape from LinkedIn (if possible)
- Glassdoor integration
- Manual company submissions
- Deduplicate similar listings

### Search & Filter
- Keyword search (title, company, skills)
- Filters: Remote only, Experience level, Salary range, Job type
- Sort: Newest, Salary high-low

### Job Cards
- Company logo (or placeholder)
- Job title
- Company name
- Location (always "Remote")
- Salary range (if available)
- Posted date
- Tags (Python, ML, etc.)
- Quick apply / View details

### Posting Flow
1. Company signs up (email + payment)
2. Submits job details (title, description, salary, apply URL)
3. Job goes live after approval
4. Subscription: $99/month for 10 jobs, $299/month unlimited

### Admin
- Approve/reject jobs
- Mark as featured
- Delete spam
- View analytics

## Technical

### Stack
- **Frontend:** Vanilla HTML/CSS/JS (lightweight, fast)
- **Backend:** Node.js + Express
- **Database:** SQLite (simple, file-based)
- **Jobs API:** RapidAPI (Indeed, LinkedIn) or web scraping with Puppeteer/Cheerio

### Data Model
```
Jobs:
  - id
  - title
  - company
  - company_logo
  - description
  - requirements
  - salary_min
  - salary_max
  - currency
  - location (always "Remote")
  - apply_url
  - source (indeed, linkedin, manual)
  - source_url
  - posted_at
  - expires_at
  - featured
  - approved
  - created_at

Companies:
  - id
  - name
  - email
  - website
  - logo
  - subscription_tier
  - subscription_expires

Users (admin):
  - id
  - email
  - password_hash
```

## MVP Scope

1. Landing page with search
2. Job listings page with filters
3. Job detail page
4. Admin login
5. Manual job posting (no payment yet)
6. Job scraping from 1-2 sources

## TODO

- [x] Project setup
- [ ] Database schema
- [ ] Basic Express server
- [ ] Landing page UI
- [ ] Jobs listing page
- [ ] Job detail page
- [ ] Search & filters
- [ ] Job scraper (at least one source)
- [ ] Admin panel
- [ ] Payment integration (later)