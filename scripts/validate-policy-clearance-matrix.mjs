#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const docArg = args.find((arg) => !arg.startsWith("--")) || "docs/15-policy-clearance-matrix.md";

const requiredSections = [
  "Purpose",
  "Source Snapshot",
  "Clearance Matrix",
  "Data And Permission Mapping",
  "Platform Packaging Notes",
  "Required Manual Reviews",
  "Release Gate",
  "Trial/Error Notes",
];

const requiredMarkers = [
  "Clearance result: BLOCKED",
  "External submission: not performed",
  "Meta logged-in review: required",
  "Google Play Console review: required",
  "Production speaker model: not selected",
  "Front/back direction: unproven",
  "RECORD_AUDIO",
  "FOREGROUND_SERVICE_MICROPHONE",
  "android:foregroundServiceType=\"microphone\"",
  "android:requiredDisplayCategory=\"xr_projected\"",
  "com.meta.wearable.mwdat.APPLICATION_ID",
  "com.meta.wearable.mwdat.ANALYTICS_OPT_OUT",
  "store-and-sdk-policy-clearance",
  "No raw audio, PCM, transcripts, speaker names, voice embeddings, encrypted payload values, Bluetooth owner names, or private alert text in evidence.",
];

const requiredUrls = [
  "https://wearables.developer.meta.com/docs/develop",
  "https://github.com/facebook/meta-wearables-dat-android",
  "https://wearables.developer.meta.com/terms",
  "https://wearables.developer.meta.com/acceptable-use-policy",
  "https://developer.android.com/develop/xr/jetpack-xr-sdk",
  "https://developer.android.com/develop/xr/jetpack-xr-sdk/build-immersive",
  "https://developer.android.com/guide/topics/media/audio-capture",
  "https://developer.android.com/develop/background-work/services/fgs/service-types",
  "https://developer.android.com/about/versions/12/foreground-services",
  "https://support.google.com/googleplay/android-developer/answer/10144311?hl=en",
  "https://support.google.com/googleplay/android-developer/answer/16558241?hl=en",
  "https://support.google.com/googleplay/android-developer/answer/11150561?hl=en-EN",
];

function usage() {
  return [
    "Usage: scripts/validate-policy-clearance-matrix.mjs [matrix-doc.md] [--json]",
    "",
    "Validates the policy clearance matrix for required official-source references, blocker status, and privacy guardrails.",
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

function countToken(markdown, token) {
  return (markdown.match(new RegExp(escapeRegExp(token), "g")) ?? []).length;
}

const errors = [];
const warnings = [];
const { absolute, relative } = resolveInsideWorkspace(docArg);

if (!fs.existsSync(absolute)) {
  errors.push(`Policy clearance matrix does not exist: ${relative}`);
} else {
  const markdown = fs.readFileSync(absolute, "utf8");

  if (!markdown.startsWith("# Policy Clearance Matrix")) {
    errors.push("Policy clearance matrix must start with '# Policy Clearance Matrix'.");
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
      errors.push(`Missing required source URL: ${url}`);
    }
  }

  if (countToken(markdown, "| BLOCKED |") < 8) {
    errors.push("Clearance matrix must keep at least eight rows in BLOCKED status.");
  }

  if (countToken(markdown, "| MANUAL_REQUIRED |") < 2) {
    errors.push("Clearance matrix must include manual physical/operational review rows.");
  }

  if (/Clearance result:\s*PASS/i.test(markdown) || /External submission:\s*performed/i.test(markdown)) {
    errors.push("Matrix must not claim clearance passed or external submission performed.");
  }

  if (!/Login required/i.test(markdown)) {
    warnings.push("Matrix should explicitly note login-required Meta sources.");
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
  console.log(`Policy clearance matrix validation passed: ${relative}`);
  for (const warning of warnings) {
    console.log(`warning: ${warning}`);
  }
} else {
  console.error(`Policy clearance matrix validation failed: ${relative}`);
  for (const error of errors) {
    console.error(`error: ${error}`);
  }
  for (const warning of warnings) {
    console.error(`warning: ${warning}`);
  }
}

process.exit(result.ok ? 0 : 1);
