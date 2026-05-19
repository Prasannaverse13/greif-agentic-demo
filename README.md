# Greif Agentic Demo

Agentic SDLC pipeline demo for Greif — static site clone + CI/CD.

A simplified, mobile-responsive static clone of [greif.com](https://www.greif.com/) showcasing Greif's industrial packaging brand (navy blue `#002855`, accent blue `#0070CD`, sustainability green, and industrial gray tones).

## Pages

- **index.html** — Homepage with hero, sustainability highlights, markets, and footer
- **about.html** — Company overview, vision, purpose, values, and history
- **products.html** — Industrial packaging products and services

## Setup

```bash
git clone https://github.com/Prasannaverse13/greif-agentic-demo.git
cd greif-agentic-demo
npm install
```

## Local preview

Serve the static files with any local server, for example:

```bash
npx serve .
```

Open `http://localhost:3000` (or the port shown) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run Vitest unit tests (placeholder) |
| `npm run test:e2e` | Run Playwright end-to-end tests |

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push:

1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run `npm test`

## Project structure

```
greif-agentic-demo/
├── index.html
├── about.html
├── products.html
├── css/styles.css
├── js/main.js
├── tests/
├── .github/workflows/ci.yml
├── package.json
└── README.md
```

## Disclaimer

This is a demonstration project for an agentic software development lifecycle pipeline. It is not affiliated with or endorsed by Greif, Inc.

## Branch Protection Test

> This line was added on branch `test-branch-protection` to verify that GitHub branch protection rules block direct merges without an approved pull request review.
