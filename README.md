# IntelSpider Enterprise 2.0

> **Deterministic Pre-Meeting Account Intelligence & Evidence Audit Ledger**  
> *Zero-hallucination sales reconnaissance for B2B Account Executives, Sales Engineers, and Technical Founders.*

[![Next.js](https://img.shields.io/badge/Next.js-16%20App%20Router-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)

---

## The Problem: The Pre-Meeting Research Drain & AI Gimmicks

Before a critical 30-minute discovery call with a high-value enterprise prospect, sales engineers and account executives spend **45–60 minutes** performing tedious manual research:
1. Checking mail routing and security posture (Google Workspace vs Microsoft 365, DMARC enforcement).
2. Inspecting page scripts to see what CRM, analytics, or observability tools they run.
3. Scraping public ATS boards (Greenhouse, Lever) to identify engineering headcount priorities and architecture pain points.

### Why Standard LLM Research Tools Fail:
Most AI research tools simply scrape marketing slogans from landing pages and prompt a model to hallucinate "Moats", "Threat Scores", or "Pain Points". The output is corporate horoscope data: interchangeable, ungrounded, and dangerous to use in technical discovery calls.

---

## The Solution: Deterministic Ground-Truth Reconnaissance

IntelSpider 2.0 replaces LLM guesswork with a **4-stage deterministic collection and audit engine**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TARGET DOMAIN (e.g. linear.app)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             LAYER 1: DETERMINISTIC GROUND-TRUTH COLLECTORS             │
│                                                                        │
│ • DNS / DoH Recon: MX priority, SPF, DMARC enforcement, NS routing    │
│ • HTTP & Script Fingerprint: Next.js, Segment, Datadog RUM, CSP/HSTS   │
│ • Public ATS Harvester: Greenhouse / Lever engineering job postings    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               LAYER 2: CRYPTOGRAPHIC FACT AUDIT LEDGER                 │
│                                                                        │
│ Every fact minted with: [FACT_ID], verification level, raw proof,     │
│ source authority, timestamp, and SHA-256 integrity hash.              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             LAYER 3: STRICT CITATION-GROUNDED REASONING                │
│                                                                        │
│ Executive battlecard where every CTO/VP/CRO hook, discovery question,  │
│ and competitive landmine strictly cites verified [FACT_ID] tags.       │
│ Automated auditor flags and isolates ungrounded claims.                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 LAYER 4: STREAMING UI & PDF EXPORTER                   │
│                                                                        │
│ • Server-Sent Events (SSE) terminal streaming live collector logs      │
│ • Interactive Evidence Drawer (click citation to inspect raw proof)    │
│ • Client-side 1-click vector PDF generation (zero headless browser ops)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

- **Authoritative DNS & Mail Audit:**  
  Queries DNS-over-HTTPS (DoH) across Cloudflare and Google DNS to deterministically identify mail providers (Google Workspace, M365, Proofpoint), SPF records, and DMARC enforcement policies (`p=reject`, `p=quarantine`, `p=none`), calculating an Email Security Grade (A+ to F).
- **HTTP Script & DOM Fingerprinting:**  
  Inspects HTTP response headers (`Server`, `HSTS`, `CSP`, `x-vercel-id`) and scans client script tags for 20+ enterprise signatures (Segment CDP, PostHog, Datadog RUM, Sentry, Intercom, HubSpot, Next.js).
- **Public ATS Engineering Harvester:**  
  Queries public Greenhouse and Lever API endpoints without authentication to parse open engineering requisitions and extract required architecture keywords (Kubernetes, Snowflake, dbt, Rust, TypeScript).
- **Immutable Fact Registry & Anti-Hallucination Guardrail:**  
  Every discovered proof is hashed via SHA-256 and registered into an immutable audit ledger. The post-generation auditor verifies that every claim in the sales battlecard cites an authentic `[FACT_ID]`.
- **Zero-Render / Vercel Serverless Architecture:**  
  No persistent backend server, Docker containers, or Render VM costs. Runs entirely on Next.js 15 App Router API routes and client-side React.
- **Client-Side Vector PDF Briefing:**  
  1-click generation of executive briefing sheets directly in the browser via `jspdf` and `html2canvas`.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript 5.0 (Strict mode)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Document Export:** jsPDF + html2canvas
- **DOM Parsing:** Cheerio
- **Deployment:** Vercel (Edge & Serverless Node.js)

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js 24)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Anshdeep-Singh/intelspider.git
cd intelspider

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables (Optional)

IntelSpider operates out of the box in **100% Deterministic Ground-Truth Mode** with zero external API keys.

If you wish to enable enriched LLM synthesis, create a `.env.local` file:

```env
GEMINI_API_KEY=your_google_gemini_api_key
```

*(You can also input your Gemini API key directly in the web UI via the header key manager).*

---

## API Reference

### `GET /api/recon`

Streams Server-Sent Events (SSE) or returns JSON report.

#### Parameters:
- `domain` (required, string): Target domain to inspect (e.g. `linear.app`).
- `format` (optional, string): Pass `format=json` for direct REST JSON response.
- `apiKey` (optional, string): Per-request Gemini API key override.

#### Sample JSON Response:
```json
{
  "id": "recon_1727500000000_linear_app",
  "domain": "linear.app",
  "dnsAudit": {
    "mailProvider": "Google Workspace",
    "emailSecurityGrade": "A+",
    "dmarcPolicy": "reject",
    "cdnDnsProvider": "Cloudflare"
  },
  "httpAudit": {
    "detectedTechnologies": [
      { "name": "Next.js", "category": "Frontend" },
      { "name": "Datadog RUM", "category": "Observability" },
      { "name": "Segment CDP", "category": "TagManager" }
    ]
  },
  "atsAudit": {
    "provider": "greenhouse",
    "totalOpenRoles": 14,
    "topEngineeringKeywords": [
      { "keyword": "TypeScript", "count": 12 },
      { "keyword": "PostgreSQL", "count": 8 }
    ]
  },
  "auditLedger": {
    "totalFacts": 9,
    "deterministicCount": 9,
    "verificationRatio": 1.0,
    "auditIntegrityHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
}
```

---

## License

MIT © [Anshdeep Singh](https://anshdeepsingh.com)
