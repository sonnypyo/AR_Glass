#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const processDocArg = args.find((arg) => !arg.startsWith("--")) || "docs/14-support-incident-process.md";

const requiredSections = [
  "Purpose",
  "Scope",
  "Support Intake",
  "Allowed Support Fields",
  "Deletion Verification",
  "Mistaken Alert Triage",
  "Severity Levels",
  "Incident Response",
  "Tester Communication Templates",
  "Evidence Files To Attach",
  "Release Gate",
];

const requiredMarkers = [
  "false positive",
  "wrong speaker",
  "wrong direction",
  "missed alert",
  "output failure",
  "local delete action",
  "deletion verification drill",
  "mistaken-alert incident drill",
  "device-evidence.md",
  "service-readiness-audit.md",
  "glasses-preflight.md",
];

const prohibitedPrivateMarkers = [
  "Raw audio.",
  "PCM buffers.",
  "Transcripts.",
  "Speaker names or profile labels.",
  "Voice embeddings.",
  "Encrypted payload values.",
  "Bluetooth owner names.",
  "Private alert message text.",
];

function usage() {
  return [
    "Usage: scripts/validate-support-incident-process.mjs [process-doc.md] [--json]",
    "",
    "Validates the support/deletion/mistaken-alert process document for required sections and privacy guardrails.",
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

function hasSection(markdown, title) {
  return new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`, "m").test(markdown);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const { absolute, relative } = resolveInsideWorkspace(processDocArg);
const errors = [];
const warnings = [];

if (!fs.existsSync(absolute)) {
  errors.push(`Support process doc does not exist: ${relative}`);
} else {
  const markdown = fs.readFileSync(absolute, "utf8");

  if (!markdown.startsWith("# Support And Incident Process")) {
    errors.push("Support process doc must start with '# Support And Incident Process'.");
  }

  for (const section of requiredSections) {
    if (!hasSection(markdown, section)) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  for (const marker of requiredMarkers) {
    if (!markdown.toLowerCase().includes(marker.toLowerCase())) {
      errors.push(`Missing required marker: ${marker}`);
    }
  }

  for (const marker of prohibitedPrivateMarkers) {
    if (!markdown.includes(marker)) {
      errors.push(`Missing explicit prohibited private marker: ${marker}`);
    }
  }

  if (!/\|\s*S0\s*\|/.test(markdown) || !/\|\s*S1\s*\|/.test(markdown)) {
    errors.push("Severity table must include S0 and S1 rows.");
  }

  if (!/Backend deletion is not implemented in the current app/i.test(markdown)) {
    warnings.push("Document should state backend deletion is not implemented in the current local-first app.");
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
  console.log(`Support incident process validation passed: ${relative}`);
  for (const warning of warnings) {
    console.log(`warning: ${warning}`);
  }
} else {
  console.error(`Support incident process validation failed: ${relative}`);
  for (const error of errors) {
    console.error(`error: ${error}`);
  }
  for (const warning of warnings) {
    console.error(`warning: ${warning}`);
  }
}

process.exit(result.ok ? 0 : 1);
