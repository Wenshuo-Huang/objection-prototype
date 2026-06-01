"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface BreakdownItem {
  dimension: string;
  score: number;
  summary: string;
}

interface Certificate {
  id: string;
  timestamp: string;
  confidence: number;
  classification: string;
  evidenceCount: number;
  fileHashes: { name: string; hash: string }[];
  breakdown: BreakdownItem[];
  corroborationSummary: string;
  redFlags: string[];
  attributionLanguage: string;
}

type Status = "idle" | "uploading" | "analyzing" | "done" | "error";

export default function VerifyPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [context, setContext] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (files.length === 0) return;
    setStatus("uploading");
    setCertificate(null);
    setErrorMsg("");

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("context", context);

      setStatus("analyzing");
      const res = await fetch("/api/verify", { method: "POST", body: formData });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Verification failed");
      }

      const data = await res.json();
      setCertificate(data);
      setStatus("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }

  function copyAttribution() {
    if (!certificate) return;
    navigator.clipboard.writeText(certificate.attributionLanguage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const classificationColor = (c: string) => {
    if (c.includes("HIGH")) return "bg-green-50 text-green-700 border-green-200";
    if (c.includes("MODERATE")) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight hover:text-gray-600">
          Objection
        </Link>
        <span className="text-sm text-gray-400">Evidence Verification</span>
      </nav>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Submit Evidence Package</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Upload your evidence files. No source identity is collected or stored.
          Each file is cryptographically hashed on receipt.
        </p>

        {/* Upload zone */}
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-gray-400 transition-colors mb-4"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            accept=".txt,.pdf,.docx,.mp3,.wav,.png,.jpg,.jpeg"
          />
          <p className="text-gray-400 text-sm">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-gray-300 text-xs mt-1">
            Supports: .txt, .pdf, .docx, .mp3, .wav, images
          </p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <ul className="mb-6 space-y-2">
            {files.map((f, i) => (
              <li
                key={i}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2 text-sm"
              >
                <span className="font-mono text-gray-700 truncate max-w-xs">{f.name}</span>
                <span className="text-gray-400 text-xs ml-2 shrink-0">
                  {(f.size / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={() => removeFile(i)}
                  className="ml-4 text-gray-300 hover:text-red-400 text-lg leading-none shrink-0"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Context field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brief context (optional)
          </label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            rows={3}
            placeholder="e.g. Academic misconduct allegation, gene therapy study, Ashworth University, 2025"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={files.length === 0 || status === "analyzing" || status === "uploading"}
          className="w-full bg-gray-900 text-white py-3 rounded-md font-medium text-sm hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === "uploading" && "Hashing files..."}
          {status === "analyzing" && "Analyzing evidence package..."}
          {status === "idle" || status === "done" || status === "error"
            ? "Verify Evidence Package"
            : null}
        </button>

        {/* Error */}
        {status === "error" && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Certificate */}
        {status === "done" && certificate && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6">Verification Certificate</h2>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              {/* Header */}
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 font-mono mb-1">CERTIFICATE ID</p>
                  <p className="font-mono font-bold text-lg">{certificate.id}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{certificate.timestamp}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${classificationColor(certificate.classification)}`}
                >
                  {certificate.classification}
                </span>
              </div>

              {/* Score */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 uppercase mb-1">Confidence Score</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold">{certificate.confidence}</span>
                  <span className="text-gray-400 mb-1">/100</span>
                </div>
                <div className="mt-2 bg-gray-100 rounded-full h-2 w-full">
                  <div
                    className="bg-gray-800 h-2 rounded-full transition-all"
                    style={{ width: `${certificate.confidence}%` }}
                  />
                </div>
              </div>

              {/* Breakdown */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 font-semibold uppercase mb-3">
                  Dimension Scores
                </p>
                <div className="space-y-4">
                  {certificate.breakdown.map((item) => (
                    <div key={item.dimension}>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-gray-800 h-1.5 rounded-full"
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-semibold w-8 text-right">
                          {item.score}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-700">{item.dimension}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Corroboration summary */}
              <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-xs font-semibold text-blue-700 uppercase mb-2">
                  Corroboration Analysis
                </p>
                <p className="text-sm text-blue-800">{certificate.corroborationSummary}</p>
              </div>

              {/* Red flags */}
              {certificate.redFlags.length > 0 && (
                <div className="mb-6 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                  <p className="text-xs font-semibold text-yellow-700 uppercase mb-2">
                    Caveats & Limitations
                  </p>
                  <ul className="space-y-1">
                    {certificate.redFlags.map((flag, i) => (
                      <li key={i} className="text-sm text-yellow-800 flex gap-2">
                        <span>&#8212;</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* File hashes */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 font-semibold uppercase mb-2">
                  File Integrity ({certificate.fileHashes.length} files)
                </p>
                <div className="space-y-1">
                  {certificate.fileHashes.map((fh) => (
                    <div key={fh.name} className="flex gap-3 text-xs font-mono text-gray-500">
                      <span className="truncate max-w-[180px] shrink-0">{fh.name}</span>
                      <span className="text-gray-300">SHA-256:</span>
                      <span className="truncate text-gray-400">{fh.hash}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attribution */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 font-semibold uppercase">
                    Attribution Language
                  </p>
                  <button
                    onClick={copyAttribution}
                    className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded px-2 py-1 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-sm text-gray-700 italic">{certificate.attributionLanguage}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-400">
        Objection — Anonymous Source Verification System &copy; 2025
      </footer>
    </main>
  );
}
