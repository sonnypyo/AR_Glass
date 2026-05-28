#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const docArg = args.find((arg) => !arg.startsWith("--")) || "docs/17-store-review-submission-package-draft.md";

const requiredSections = [
  "Purpose",
  "Official Source Snapshot",
  "Current Release Scope",
  "Store Listing Draft",
  "App Content Declarations Draft",
  "Reviewer Instructions Draft",
  "Screenshots And Media Plan",
  "Public Copy Guardrails",
  "Submission Blockers",
  "Release Gate",
  "Trial/Error Notes",
];

const requiredMarkers = [
  "Submission package status: DRAFT_NOT_SUBMITTED",
  "Review status: NOT_REQUESTED",
  "Release track: INTERNAL_TESTING_DRAFT",
  "It is not a Play Console submission",
  "App access: no login or restricted account flow in current build",
  "Adults only; not designed for children.",
  "No ads.",
  "URL: TBD public non-PDF URL",
  "Do not claim front/back direction accuracy before hardware evidence exists.",
  "Do not claim production speaker identification while the prototype acoustic feature path is active.",
  "Do not claim Meta Ray-Ban Display support until real DAT adapter evidence exists.",
  "Do not claim Android XR production support until real Projected/XR runtime evidence exists.",
  "Do not claim glasses-side per-side haptics until an official API and hardware proof exist.",
  "device-evidence.md",
  "scripts/validate-device-evidence.mjs",
  "privacy-consent-copy",
  "store-and-sdk-policy-clearance",
  "production-speaker-model",
  "front-back-direction-evidence",
  "support-incident-process",
];

const requiredUrls = [
  "https://support.google.com/googleplay/android-developer/answer/9859152?hl=en-EN",
  "https://support.google.com/googleplay/android-developer/answer/9859455?hl=en-EN",
  "https://support.google.com/googleplay/android-developer/answer/10144311?hl=en",
  "https://support.google.com/googleplay/android-developer/answer/10787469?hl=en",
  "https://support.google.com/googleplay/android-developer/answer/9867159?hl=en-EN",
  "https://support.google.com/googleplay/android-developer/answer/9859655?hl=en",
  "https://support.google.com/googleplay/android-developer/answer/13393723?hl=en",
  "https://support.google.com/googleplay/android-developer/answer/16558241?hl=en",
  "https://wearables.developer.meta.com/docs/develop",
  "https://developer.android.com/develop/xr/jetpack-xr-sdk",
];

const prohibitedClaims = [
  "Submission package status: SUBMITTED",
  "Review status: APPROVED",
  "Release track: PRODUCTION",
  "available on Google Play",
  "Play review approved",
  "Meta Wearables approved",
  "Android XR approved",
  "production ready",
  "guaranteed speaker identity",
  "guaranteed front/back direction",
  "glasses-side haptics supported",
];

function usage() {
  return [
    "Usage: scripts/validate-store-review-submission-package.mjs [draft-doc.md] [--json]",
    "",
    "Validates the store-review submission package draft for source URLs, draft-only status, Play field limits, and release-gate guardrails.",
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

function tableValue(markdown, fieldName) {
  const rowPattern = new RegExp(`^\\|\\s*${escapeRegExp(fieldName)}\\s*\\|\\s*([^|]+?)\\s*\\|`, "m");
  const match = markdown.match(rowPattern);
  return match ? match[1].trim() : "";
}

function countChecklistItems(markdown, sectionName) {
  const start = markdown.indexOf(`## ${sectionName}`);
  if (start === -1) return 0;
  const rest = markdown.slice(start);
  const next = rest.slice(1).search(/\n##\s+/);
  const section = next === -1 ? rest : rest.slice(0, next + 1);
  return section.split("\n").filter((line) => /^\d+\.\s+/.test(line)).length;
}

const errors = [];
const warnings = [];
const { absolute, relative } = resolveInsideWorkspace(docArg);

if (!fs.existsSync(absolute)) {
  errors.push(`Store review submission package draft does not exist: ${relative}`);
} else {
  const markdown = fs.readFileSync(absolute, "utf8");

  if (!markdown.startsWith("# Store Review Submission Package Draft")) {
    errors.push("Draft must start with '# Store Review Submission Package Draft'.");
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
      errors.push(`Draft must not claim completed review or unsupported capability: ${claim}`);
    }
  }

  const appName = tableValue(markdown, "App name");
  if (!appName) {
    errors.push("Store Listing Draft must include an App name row.");
  } else if ([...appName].length > 30) {
    errors.push(`App name exceeds 30 characters: ${[...appName].length}`);
  }

  const shortDescription = tableValue(markdown, "Short description");
  if (!shortDescription) {
    errors.push("Store Listing Draft must include a Short description row.");
  } else if ([...shortDescription].length > 80) {
    errors.push(`Short description exceeds 80 characters: ${[...shortDescription].length}`);
  }

  const fullDescription = tableValue(markdown, "Full description");
  if (!fullDescription) {
    errors.push("Store Listing Draft must include a Full description row.");
  } else {
    if ([...fullDescription].length > 4000) {
      errors.push(`Full description exceeds 4000 characters: ${[...fullDescription].length}`);
    }
    for (const requiredText of [
      "does not store raw audio",
      "does not guarantee speaker identity",
      "does not prove front/back direction accuracy",
    ]) {
      if (!fullDescription.includes(requiredText)) {
        errors.push(`Full description is missing limitation text: ${requiredText}`);
      }
    }
  }

  if (countChecklistItems(markdown, "Reviewer Instructions Draft") < 7) {
    errors.push("Reviewer Instructions Draft should include at least seven numbered steps.");
  }

  if (countChecklistItems(markdown, "Submission Blockers") < 7) {
    errors.push("Submission Blockers should include at least seven numbered blockers.");
  }

  if (!/TBD/.test(markdown)) {
    warnings.push("Draft should keep TBD placeholders until public privacy URL and account details are available.");
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
  console.log(`Store review submission package validation passed: ${relative}`);
  for (const warning of warnings) {
    console.log(`warning: ${warning}`);
  }
} else {
  console.error(`Store review submission package validation failed: ${relative}`);
  for (const error of errors) {
    console.error(`error: ${error}`);
  }
  for (const warning of warnings) {
    console.error(`warning: ${warning}`);
  }
}

process.exit(result.ok ? 0 : 1);
