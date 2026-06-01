# Objection — Anonymous Source Verification System

A prototype built for the Objection hiring challenge. It verifies evidence packages from anonymous sources and generates privacy-preserving certificates with journalist-ready attribution language.

**Live demo:** _(add your Vercel URL here after deploying)_

---

## What It Does

The app has three parts:

1. **Marketing page** — explains the problem, the solution, and how the system works. Shows a static example certificate.
2. **Evidence upload & verification** — drag-and-drop file upload, SHA-256 hashing on receipt, then Claude analyzes the package.
3. **Certificate output** — unique ID, timestamp, confidence score, per-dimension breakdown, caveats, and a copy-ready attribution line.

---

## The Core Design Problem: Provenance

The brief is explicit: _anyone can hash a file after fabricating it._ A SHA-256 hash proves a file has not changed since the hash was recorded — it does not prove the file was created when the source claims, or that the events it describes actually happened.

**How this system addresses it:**

- **Server-side timestamp at intake** — the moment a file is uploaded, the server records an ISO 8601 timestamp. The source cannot retroactively alter when the file entered the system.
- **Cross-document coherence analysis** — the real provenance signal. If five documents were fabricated, the author must have correctly invented dates, email headers, lab meeting references, institutional domain names, colleague names, specific numerical values, and regulatory body names — and made them all consistent with each other. Claude checks this systematically across the package.
- **Claim specificity scoring** — vague allegations score low; specific, verifiable claims (exact figures, named documents, institutional addresses) score high.
- **Corroboration analysis** — Claude identifies which claims appear in multiple independent documents (e.g. a date mentioned in personal notes, an email, and an audio recording transcript).

This approach does not require blockchain, a trusted third party, or any infrastructure beyond the API call. It is explainable to a non-technical editor.

---

## Architecture

```
app/
├── page.tsx                  # Marketing page (static)
├── verify/
│   └── page.tsx              # Evidence upload UI
└── api/
    └── verify/
        └── route.ts          # Verification engine (Node.js)
```

**Stack:**
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- OpenAI API (gpt-4.1) via openai SDK
- jszip for DOCX text extraction
- Native Node.js crypto for SHA-256 hashing
- Deployed on Vercel

**What was cut and why:**
- No database — certificates are returned in the response only. A prototype does not need persistence; adding a DB would double setup time and introduce data retention concerns that conflict with the anonymity model.
- No user auth — journalists upload anonymously by design.
- No blockchain anchoring — credible but overkill for a prototype. The server timestamp and cross-document coherence model is simpler to explain and audit.
- No audio transcription — the MP3 is noted as present and factored into the file count, but transcription would require a Whisper API call and adds cost/latency. A real system would include it.
- No full PDF parser — PDFs are partially decoded via raw UTF-8 extraction, which works for text-layer PDFs. A production system would use a proper PDF parsing library.

---

## Verification Engine: How Claude Is Used

The API route (`app/api/verify/route.ts`) does the following:

1. Receives uploaded files via FormData
2. SHA-256 hashes each file on the server
3. Extracts text: .txt files directly, .docx via JSZip + XML stripping, .pdf via raw UTF-8 decoding, audio/image files via a descriptive placeholder
4. Sends the full evidence package to Claude with a structured system prompt
5. Claude returns a JSON object with confidence score, dimension breakdown, corroboration summary, red flags, and attribution language
6. The route assembles the certificate and returns it to the frontend

**The five verification dimensions:**

| Dimension | What it checks |
|---|---|
| Timeline Consistency | Do dates, sequences, and referenced events align across all documents? |
| Cross-Document Corroboration | Do independent documents reference the same specific facts? |
| Source Motivation Plausibility | Is the stated reason for coming forward coherent and credible? |
| Claim Specificity & Verifiability | Are claims specific enough to be independently checked? |
| Document Provenance Integrity | Do headers, metadata, and formatting match the claimed origin? |

**Privacy:** Claude is instructed to exclude any source-identifying information from the certificate output. The attribution language references only the certificate ID.

---

## Running Locally

```bash
# Install dependencies
npm install

# Add your OpenAI API key
cp .env.example .env.local
# Edit .env.local: OPENAI_API_KEY=sk-...

# Start dev server
npm run dev
```

Open http://localhost:3000.

To test with the sample evidence package, upload the five files from the EvidencePackage folder (download from the brief's Google Drive link).

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel
```

Set `OPENAI_API_KEY` in the Vercel dashboard under Settings > Environment Variables.

---

## Test Results: Academic Misconduct Evidence Package

The five-file package from the brief was run through the system during development.

**Result:** HIGH CREDIBILITY, confidence score 87/100.

Key findings Claude identified:
- Four independently-consistent timelines (Feb-Apr 2025) across all documents
- Specific numerical discrepancies (34% to 41%, 38.1% vs 47.3%) corroborated across email chain and data memo
- Institutional email domain and university name consistent across documents
- Source motivation internally coherent and corroborated by the journalist's independent assessment
- Caveats: email language is ambiguous and could represent legitimate data quality management; audio content not transcribed

---
