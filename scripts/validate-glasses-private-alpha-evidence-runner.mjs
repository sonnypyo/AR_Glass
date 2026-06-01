#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SUMMARY = "data/runs/20260528_voice_direction_mvp/92-glasses-private-alpha-evidence-runner/glasses-alpha-evidence-summary.json";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const requireGlassesAlphaCandidate = args.includes("--require-glasses-alpha-candidate");
const fileArg = args.find((arg) => !arg.startsWith("--")) || DEFAULT_SUMMARY;

const requiredCommandLabels = [
  "Validate glasses hardware session",
  "Validate glasses hardware evidence draft",
  "Check strict glasses hardware validation",
  "Dry-run glasses hardware manifest apply",
  "Check glasses-alpha service gate",
  "Write service readiness audit",
];

const privatePatterns = [
  /\btranscript\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|$)/i,
  /\bspeaker(?:Name|Label|Text)?\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|$)/i,
  /\bcaller(?:Name|Label)\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|$)/i,
  /\bprofile(?:Name|Label)\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|$)/i,
  /\bphrase\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|$)/i,
  /\bembedding\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|$)/i,
  /\benc:v\d+:/i,
  /\bpcm\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|$)/i,
  /\braw(?:Audio|Pcm)\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|$)/i,
  /\baudioBytes\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|$)/i,
  /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,
];

function usage() {
  return [
    "Usage: scripts/validate-glasses-private-alpha-evidence-runner.mjs [summary.json] [--json] [--require-glasses-alpha-candidate]",
    "",
    "Validates the non-PII summary written by run-glasses-private-alpha-evidence.mjs.",
    "Strict mode requires a real glasses-private-alpha candidate and should fail for no-hardware/draft runs.",
  ].join("\n");
}

if (showHelp) {
  console.log(usage());
  process.exit(0);
}

function resolveInsideWorkspace(value) {
  const absolute = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to read outside workspace: ${absolute}`);
  }
  return { absolute, relative };
}

function collectStrings(value, strings = []) {
  if (typeof value === "string") {
    strings.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, strings);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, strings);
  }
  return strings;
}

const errors = [];
const warnings = [];
const { absolute, relative } = resolveInsideWorkspace(fileArg);
let summary = null;

if (!fs.existsSync(absolute)) {
  errors.push(`Summary file does not exist: ${relative}`);
} else {
  try {
    summary = JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch (error) {
    errors.push(`Summary JSON parse failed: ${error.message}`);
  }
}

if (summary) {
  if (summary.schemaVersion !== 1) errors.push(`Unexpected schemaVersion: ${summary.schemaVersion}`);
  if (summary.ok !== true) errors.push("Summary ok must be true.");
  if (!summary.generatedAt) errors.push("Missing generatedAt.");
  if (!summary.sessionDir) errors.push("Missing sessionDir.");
  if (!summary.reportPath?.endsWith("glasses-alpha-evidence-summary.md")) errors.push("Unexpected reportPath.");
  if (!summary.summaryJsonPath?.endsWith("glasses-alpha-evidence-summary.json")) errors.push("Unexpected summaryJsonPath.");
  if (!summary.serviceReadinessAuditPath?.endsWith("service-readiness-audit.md")) errors.push("Missing service readiness audit path.");
  if (summary.rawOutputPersisted !== false) errors.push("rawOutputPersisted must be false.");
  if (!Array.isArray(summary.commands) || summary.commands.length === 0) errors.push("commands must be a non-empty array.");
  if (!Array.isArray(summary.nextActions) || summary.nextActions.length === 0) errors.push("nextActions must be a non-empty array.");

  const labels = new Set((summary.commands ?? []).map((command) => command.label));
  for (const label of requiredCommandLabels) {
    if (!labels.has(label)) errors.push(`Missing command result: ${label}`);
  }

  for (const command of summary.commands ?? []) {
    if (!["pass", "expected-fail"].includes(command.status)) {
      errors.push(`Command ${command.label} has unsupported status: ${command.status}`);
    }
    if (command.rawOutputPersisted !== false) {
      errors.push(`Command ${command.label} must have rawOutputPersisted=false.`);
    }
    if ("outputPreview" in command) {
      errors.push(`Command ${command.label} must not persist outputPreview.`);
    }
  }

  if (summary.manifest?.privacyGuardrailsClear !== true) errors.push("Manifest privacy guardrails must be clear.");
  if (summary.manifest?.androidXrProjectedReady === true && summary.strictHardwareValidationOk !== true) {
    errors.push("androidXrProjectedReady cannot be true before strict glasses hardware validation passes.");
  }
  if (typeof summary.glassesHardwareEvidenceCandidate !== "boolean") errors.push("glassesHardwareEvidenceCandidate must be boolean.");
  if (typeof summary.glassesPrivateAlphaCandidate !== "boolean") errors.push("glassesPrivateAlphaCandidate must be boolean.");
  if (summary.glassesPrivateAlphaCandidate && !summary.glassesHardwareEvidenceCandidate) {
    errors.push("glassesPrivateAlphaCandidate cannot be true while glassesHardwareEvidenceCandidate is false.");
  }
  if (summary.glassesHardwareEvidenceCandidate && summary.strictHardwareValidationOk !== true) {
    errors.push("glassesHardwareEvidenceCandidate requires strictHardwareValidationOk=true.");
  }
  if (summary.glassesPrivateAlphaCandidate && summary.strictServiceGateOk !== true) {
    errors.push("glassesPrivateAlphaCandidate requires strictServiceGateOk=true.");
  }

  if (requireGlassesAlphaCandidate && summary.glassesPrivateAlphaCandidate !== true) {
    errors.push("Strict mode requires glassesPrivateAlphaCandidate=true.");
  }

  for (const text of collectStrings(summary)) {
    for (const pattern of privatePatterns) {
      if (pattern.test(text)) errors.push(`Summary appears to include private structured value matching ${pattern}.`);
    }
  }

  if (summary.glassesPrivateAlphaCandidate !== true) {
    warnings.push("Summary is workflow evidence only; glasses private alpha is not ready.");
  }
}

const result = {
  file: relative,
  ok: errors.length === 0,
  errors,
  warnings,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Glasses private alpha runner summary validation passed: ${relative}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Glasses private alpha runner summary validation failed: ${relative}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
