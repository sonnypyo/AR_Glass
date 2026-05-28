#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const docArg = args.find((arg) => !arg.startsWith("--")) || "docs/16-privacy-policy-data-safety-draft.md";

const requiredSections = [
  "Purpose",
  "Official Source Snapshot",
  "Current App Data Inventory",
  "Data Safety Worksheet Draft",
  "Privacy Policy Draft Text",
  "In-App Disclosure Mapping",
  "External Review Checklist",
  "Release Gate",
  "Trial/Error Notes",
];

const requiredMarkers = [
  "Submission status: DRAFT_NOT_SUBMITTED",
  "Review status: LEGAL_POLICY_REVIEW_REQUIRED",
  "Current build answer: no user data is collected or shared off device by the app.",
  "Microphone input",
  "Recognized speech text",
  "Speaker label",
  "Prototype voice feature reference",
  "Meta DAT SDK data",
  "Android XR Projected data",
  "Voice Direction Glass Privacy Policy",
  "Developer: TBD legal name",
  "Privacy contact: TBD email or contact URL",
  "does not store raw audio, PCM buffers, full speech transcripts",
  "Meta DAT and Android XR real adapters are not active yet",
  "privacy-consent-copy",
  "store-and-sdk-policy-clearance",
  "production-speaker-model",
  "A Markdown draft in this repository is not an acceptable Play privacy policy URL by itself.",
];

const requiredUrls = [
  "https://support.google.com/googleplay/android-developer/answer/10144311?hl=en",
  "https://support.google.com/googleplay/android-developer/answer/10787469?hl=en",
  "https://support.google.com/googleplay/android-developer/answer/11150561?hl=en-EN",
  "https://support.google.com/googleplay/android-developer/answer/9859455?hl=en-EN",
  "https://support.google.com/googleplay/android-developer/answer/13326895?hl=en-EN",
];

const prohibitedClaims = [
  "Submission status: SUBMITTED",
  "Review status: APPROVED",
  "Data Safety submitted",
  "policy clearance complete",
  "production ready",
];

function usage() {
  return [
    "Usage: scripts/validate-privacy-data-safety-draft.mjs [draft-doc.md] [--json]",
    "",
    "Validates the privacy policy and Play Data Safety draft for required sections, source URLs, draft status, and release-gate guardrails.",
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

function countTableRows(markdown, tableName) {
  const start = markdown.indexOf(`## ${tableName}`);
  if (start === -1) return 0;
  const rest = markdown.slice(start);
  const next = rest.slice(1).search(/\n##\s+/);
  const section = next === -1 ? rest : rest.slice(0, next + 1);
  return section.split("\n").filter((line) => /^\|.+\|$/.test(line)).length;
}

const errors = [];
const warnings = [];
const { absolute, relative } = resolveInsideWorkspace(docArg);

if (!fs.existsSync(absolute)) {
  errors.push(`Privacy/Data Safety draft does not exist: ${relative}`);
} else {
  const markdown = fs.readFileSync(absolute, "utf8");

  if (!markdown.startsWith("# Privacy Policy And Data Safety Draft")) {
    errors.push("Draft must start with '# Privacy Policy And Data Safety Draft'.");
  }

  for (const section of requiredSections) {
    if (!hasSection(markdown, section)) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  for (const marker of requiredMarkers) {
    if (!markdown.includes(marker)) {
      errors.push(`Missing required marker: ${marker}`);
    }
  }

  for (const url of requiredUrls) {
    if (!markdown.includes(url)) {
      errors.push(`Missing required official source URL: ${url}`);
    }
  }

  for (const claim of prohibitedClaims) {
    if (markdown.toLowerCase().includes(claim.toLowerCase())) {
      errors.push(`Draft must not claim completed external review: ${claim}`);
    }
  }

  if (countTableRows(markdown, "Current App Data Inventory") < 10) {
    errors.push("Current App Data Inventory table is too small to cover the app data surface.");
  }

  if (countTableRows(markdown, "Data Safety Worksheet Draft") < 8) {
    errors.push("Data Safety Worksheet Draft table is too small.");
  }

  if (!/TBD/.test(markdown)) {
    warnings.push("Draft should keep TBD placeholders until developer identity/contact are provided.");
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
  console.log(`Privacy/Data Safety draft validation passed: ${relative}`);
  for (const warning of warnings) {
    console.log(`warning: ${warning}`);
  }
} else {
  console.error(`Privacy/Data Safety draft validation failed: ${relative}`);
  for (const error of errors) {
    console.error(`error: ${error}`);
  }
  for (const warning of warnings) {
    console.error(`warning: ${warning}`);
  }
}

process.exit(result.ok ? 0 : 1);
