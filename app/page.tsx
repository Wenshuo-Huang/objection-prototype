"use client";

import Link from "next/link";

const SAMPLE_CERTIFICATE = {
  id: "OBJ-2025-7F3A9C",
  timestamp: "2025-04-28T14:32:07Z",
  confidence: 87,
  classification: "HIGH CREDIBILITY",
  evidenceCount: 5,
  breakdown: [
    { label: "Internal timeline consistency", score: 92 },
    { label: "Cross-document corroboration", score: 88 },
    { label: "Source motivation plausibility", score: 84 },
    { label: "Document provenance integrity", score: 91 },
    { label: "Claim specificity & verifiability", score: 79 },
  ],
  attribution:
    '"The data exclusions were not scientifically justified," said a source verified via Objection\'s independent certification process [Certificate #OBJ-2025-7F3A9C].',
};

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg tracking-tight">Objection</span>
        <Link
          href="/verify"
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
        >
          Submit Evidence
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 max-w-3xl mx-auto">
        <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4">
          Anonymous Source Verification
        </span>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Prove the evidence is real.
          <br />
          <span className="text-gray-400">Not just that it exists.</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mb-10">
          Objection verifies evidence packages from anonymous sources — checking
          consistency, corroboration, and provenance — then generates a
          privacy-preserving certificate journalists can cite in print.
        </p>
        <Link
          href="/verify"
          className="bg-gray-900 text-white px-8 py-3 rounded-md text-base font-medium hover:bg-gray-700 transition-colors"
        >
          Submit an Evidence Package
        </Link>
      </section>

      {/* Problem / Solution */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-3">
              The Problem
            </h2>
            <h3 className="text-2xl font-bold mb-4">
              Anyone can hash a file after fabricating it.
            </h3>
            <p className="text-gray-500">
              A cryptographic hash only proves a file has not changed since the
              hash was created. It says nothing about when the file was first
              created, or whether the events it describes actually happened.
              Provenance requires more than a checksum.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-3">
              The Solution
            </h2>
            <h3 className="text-2xl font-bold mb-4">
              Cross-document coherence as proof of provenance.
            </h3>
            <p className="text-gray-500">
              Objection timestamps each file the moment it enters the system,
              then uses AI to check whether the internal timelines, named
              entities, and specific claims are consistent across the entire
              evidence package. Fabricated documents fail this test. Real ones
              pass.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-10 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Secure Intake",
                body: "Upload evidence files. Each file is SHA-256 hashed and server-timestamped on receipt. No source identity is recorded.",
              },
              {
                step: "02",
                title: "AI Verification Engine",
                body: "Claude analyzes the package for timeline consistency, cross-document corroboration, claim specificity, and source motivation plausibility.",
              },
              {
                step: "03",
                title: "Certificate & Attribution",
                body: "A privacy-preserving certificate is generated with a unique ID, confidence score, and copy-ready attribution language.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-3">
                <span className="text-3xl font-bold text-gray-200">{item.step}</span>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Certificate */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-10 text-center">
            Example Certificate
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 font-mono mb-1">CERTIFICATE ID</p>
                <p className="font-mono font-bold text-lg">{SAMPLE_CERTIFICATE.id}</p>
              </div>
              <span className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
                {SAMPLE_CERTIFICATE.classification}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">TIMESTAMP</p>
                <p className="font-mono text-xs">{SAMPLE_CERTIFICATE.timestamp}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">CONFIDENCE SCORE</p>
                <p className="font-bold text-2xl text-gray-900">
                  {SAMPLE_CERTIFICATE.confidence}
                  <span className="text-sm text-gray-400 font-normal">/100</span>
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-gray-400 font-semibold uppercase mb-3">
                Evidence Breakdown
              </p>
              <div className="space-y-2">
                {SAMPLE_CERTIFICATE.breakdown.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-gray-800 h-1.5 rounded-full"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-52 shrink-0">{item.label}</span>
                    <span className="text-xs font-mono font-semibold w-8 text-right">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Attribution Language</p>
              <p className="text-sm text-gray-700 italic">{SAMPLE_CERTIFICATE.attribution}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to verify a source?</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Upload an evidence package and get a certificate in minutes. No account required.
        </p>
        <Link
          href="/verify"
          className="bg-gray-900 text-white px-8 py-3 rounded-md text-base font-medium hover:bg-gray-700 transition-colors"
        >
          Submit Evidence
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-400">
        Objection — Anonymous Source Verification System &copy; 2025
      </footer>
    </main>
  );
}
