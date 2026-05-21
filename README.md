# greif-agentic-demo

**Live site:** https://greif-agentic-demo.vercel.app  
**Repo:** https://github.com/Prasannaverse13/greif-agentic-demo

An agentic SDLC pipeline demo built on Greif's corporate website. A GitHub
Issue triggers a four-agent orchestration loop — Triage → Developer → Tester →
Governance — powered by **Google Gemini Flash**, running entirely within GitHub
Actions (no external orchestration infrastructure required).

---

## Architecture

```
GitHub Issue (opened / edited)
        │
        ▼
┌─────────────────────────────────────────────┐
│  Job 1: TRIAGE AGENT (Gemini-powered)       │
│  • Calls Gemini Flash to classify intent    │
│  • Returns: edit_type, target_page,         │
│    new_headline, section_bullets            │
│  • Labels: triaged / needs-clarification    │
│  • Guards: prompt-injection, token budget   │
└──────────────────┬──────────────────────────┘
                   │ if passed = true
                   ▼
┌─────────────────────────────────────────────┐
│  Job 2: DEVELOPER AGENT                     │
│  • Creates branch auto/ticket-{N}           │
│  • Applies real Python edits:               │
│    A) footer_link  → all 3 HTML pages       │
│    B) hero_headline→ index.html <h1>        │
│    C) add_section  → target page <ul>/<p>  │
│  • Commits "Auto: {title}", opens draft PR  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Job 3: TESTER AGENT                        │
│  • Polls Vercel for preview URL             │
│  • Runs Playwright E2E (T1.1–T1.3)         │
│  • Checks internal links (T4.3 404 guard)   │
│  • Labels: tests-passed / tests-failing     │
│  • Labels: needs-followup if /404 found     │
└──────────────────┬──────────────────────────┘
         ┌─────────┴────────┐
         │ on failure        │
         ▼                   ▼
┌──────────────┐  ┌─────────────────────────────┐
│ RETRY JOB    │  │  Job 5: GOVERNANCE AGENT     │
│ Up to 2×     │  │  (Gemini-powered)            │
│ then escalate│  │  • Reviews PR diff via LLM   │
└──────────────┘  │  • Flags: forbidden claims,  │
                  │    competitors, brand voice   │
                  │  • Labels: governance-passed  │
                  │           / governance-block  │
                  └─────────────────────────────┘
```

### Staging / Production Gates (G5 / T4.5 / T4.6)

```
feature branch  →  main (production, Vercel auto-deploy)
                ↑
staging branch  →  staging-smoke.yml  →  promote-production.yml
                   (auto-runs on push)    (workflow_dispatch,
                                          requires confirmation)
```

---

## LLM Choice: Google Gemini Flash

**Why Gemini Flash instead of Claude / Ollama?**

| Criterion           | Gemini Flash          | Claude Sonnet       | Ollama (local)      |
|---------------------|----------------------|---------------------|---------------------|
| Free tier           | ✅ 1 M tokens/day     | ❌ Paid API only     | ✅ Free (local only) |
| Structured JSON out | ✅ `responseMimeType` | ⚠️ Prompt-only      | ⚠️ Variable         |
| Latency in Actions  | ~300 ms              | ~1–2 s              | ❌ No cloud runner   |
| Cost per ticket     | ~$0.0003             | ~$0.005             | $0 (infra cost)     |
| Internet accessible | ✅                   | ✅                   | ❌ (needs self-host) |

Gemini Flash's `responseMimeType: 'application/json'` makes structured
extraction reliable without manual regex parsing. Ollama is impractical in
GitHub Actions runners (no GPU, no persistent state). Claude is excellent but
requires a paid API key. Gemini's free tier eliminates cost risk for demos.

**Fallback:** If the Gemini API is unreachable, both Triage and Governance
fall back to deterministic keyword/regex matching so the pipeline never
fully halts due to an LLM outage.

---

## Setup

### Prerequisites

- Node.js ≥ 20
- A GitHub repository
- Vercel account (Hobby tier is free)
- A Gemini API key — get one free at https://aistudio.google.com/

### 1 — Clone and install

```bash
git clone https://github.com/Prasannaverse13/greif-agentic-demo.git
cd greif-agentic-demo
npm install
npx playwright install --with-deps chromium
```

### 2 — Add the Gemini API key to GitHub Secrets

In your repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret name      | Value                                         |
|------------------|-----------------------------------------------|
| `GEMINI_API_KEY` | Your key from Google AI Studio                |

> ⚠️ Never commit the raw API key to the repository.

### 3 — Create GitHub labels

The orchestrator auto-creates all required labels on first run. No manual setup needed.

### 4 — (Optional) Create a staging branch

```bash
git checkout -b staging
git push origin staging
```

Vercel will auto-deploy `staging` as a preview URL. The `staging-smoke.yml`
workflow fires on every push to this branch.

### 5 — Configure Vercel

The `vercel.json` in this repo sets `framework: null` (static HTML).
Connect the repo in the Vercel dashboard — no build command needed.

---

## Running tests locally

```bash
# Unit tests (Vitest)
npm test

# E2E tests (Playwright — requires a running server)
npm run serve &
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npm run test:e2e
```

---

## Triggering the agentic pipeline

Open a GitHub Issue with a well-scoped description. Examples:

**Pattern A — footer link (all pages):**
> Add an Investor Relations link to the footer on the homepage

**Pattern B — hero headline:**
> Change hero headline on homepage to: "Sustainable packaging, delivered globally"

**Pattern C — new section with bullets:**
> Add a new section "Our 2030 Commitments" to the about page
> - 50% recycled content across all product lines
> - Carbon-neutral manufacturing by 2030
> - Zero waste-to-landfill at all major sites

The Triage Agent (Gemini) classifies the issue within seconds. If accepted, the
Developer Agent opens a draft PR within ~1 minute. The Tester Agent runs
Playwright tests and checks for 404s; the Governance Agent reviews the diff.

---

## Workflow inventory

| File | Purpose |
|------|---------|
| `.github/workflows/orchestrator.yml` | 4-agent pipeline (Triage, Developer, Tester, Governance) + Retry |
| `.github/workflows/ci.yml` | Vitest unit + Playwright E2E + Lighthouse on every push/PR |
| `.github/workflows/staging-smoke.yml` | Smoke tests on `staging` branch push |
| `.github/workflows/promote-production.yml` | `workflow_dispatch` prod gate (T4.6) |

---

## Test suites

| Suite | File | Covers |
|-------|------|--------|
| 1 – Static quality | `e2e/homepage.spec.js` | T1.1 rendering, T1.2 all pages, T1.3 375 px viewport |
| 2 – Webhook parsing | `tests/webhook.test.js` | T2.3 GitHub Issues event parsing |
| 3 – Agent behaviour | `tests/agent.test.js` | T3.1–T3.6 triage, developer, tester, governance |
| 4 – E2E scenarios | `e2e/homepage.spec.js` | T4.1 footer link, T4.2 section bullets, T4.3 404 guard |
| 5 – Adversarial | `tests/agent.test.js` | T5.1 retry guard, T5.2 cost cap, T5.3 injection guard |

Lighthouse (T1.4) is enforced via `treosh/lighthouse-ci-action` in `ci.yml`
with a budget: performance ≥ 80, accessibility ≥ 90 (error).

---

## Known limitations & trade-offs

1. **Gemini API key is a single point of failure.** The keyword-matching
   fallback ensures the pipeline continues if the API is down, but LLM
   quality is lost. A secrets-rotation strategy is recommended for production.

2. **Vercel preview URL polling is best-effort.** The Tester Agent polls for
   the Vercel deployment URL for up to 3 minutes. If Vercel is slow or the
   GitHub Deployments API has stale data, the tester falls back to the
   production URL — which may not reflect the PR's changes.

3. **No real `/investors` page.** The footer link agent inserts
   `<a href="/investors">`, but that page does not exist. The Tester Agent
   will detect this 404 and add a `needs-followup` label; however, creating
   the page itself is out of scope for this demo.

4. **Branch protection must be configured manually.** The `governance-block`
   label signals a violation, but actually preventing the merge requires a
   GitHub branch protection rule that checks for the absence of
   `governance-block`. This is a one-time setup in the repo settings.

5. **Gemini Flash is non-deterministic.** Temperature is set to 0.0–0.1 to
   minimise variance, but occasional misclassifications are possible.
   The keyword fallback provides a safety net.

6. **No real CD to production.** `promote-production.yml` opens a staging →
   main PR which Vercel automatically deploys when merged. It does not invoke
   a deployment API directly — the Vercel GitHub integration handles that.

---

## Project structure

```
greif-agentic-demo/
├── index.html              # Homepage (cloned from greif.com)
├── about.html              # About page
├── products.html           # Products & services page
├── css/styles.css          # Brand styles (Greif design tokens, responsive)
├── js/main.js              # Hero slider, mobile nav
├── governance.md           # Governance Agent policy reference
├── vercel.json             # Static site config (no build step)
├── playwright.config.js    # Playwright config (PLAYWRIGHT_BASE_URL support)
├── package.json
├── e2e/
│   └── homepage.spec.js    # Suites 1 + 4 E2E tests
├── tests/
│   ├── agent.test.js       # Suites 3 + 5 unit tests
│   └── webhook.test.js     # Suite 2 webhook tests
└── .github/
    ├── lighthouse-budget.json
    └── workflows/
        ├── ci.yml
        ├── orchestrator.yml
        ├── staging-smoke.yml
        └── promote-production.yml
```

---

## Architecture decisions record

| Decision | Choice | Reason |
|----------|--------|--------|
| LLM provider | Gemini Flash | Free tier, JSON mode, low latency |
| Issue tracker | GitHub Issues | Native Actions trigger, free, no external SaaS |
| CI runner | GitHub Actions (ubuntu-latest) | Free 2 000 min/month, integrated secrets |
| Static hosting | Vercel (Hobby) | Auto-preview per branch, custom domain support |
| E2E framework | Playwright | Viewport emulation, cross-browser, JSON reporter |
| Unit framework | Vitest | Fast, ESM native, works with mocking |
| File edits in CI | Python stdlib | No `npm install` needed, `re`/`os` available everywhere |
