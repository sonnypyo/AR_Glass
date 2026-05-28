#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const docArg = args.find((arg) => !arg.startsWith("--")) || "docs/19-release-notes-versioning.md";

const buildGradlePath = "apps/voice-direction-glass/app/build.gradle.kts";
const defaultNotesDir = "apps/voice-direction-glass/release-notes";

const requiredSections = [
  "Purpose",
  "Official Source Snapshot",
  "Current Version Source",
  "Release Notes Draft",
  "Versioning Rules",
  "Internal Testing Gate",
  "Public Copy Guardrails",
  "Validation Command",
  "Release Gate",
  "Trial/Error Notes",
];

const requiredMarkers = [
  "Release notes status: INTERNAL_TESTING_DRAFT",
  "Version status: VERSION_0_1_0_CODE_1",
  "External submission: not performed",
  "apps/voice-direction-glass/app/build.gradle.kts",
  "apps/voice-direction-glass/release-notes/internal-testing-v0.1.0.md",
  "500 Unicode characters per language",
  "DRAFT_NOT_SUBMITTED",
  "not production speaker ID",
  "not front/back proven",
  "not real Meta DAT/Android XR release support",
  "node scripts/validate-release-notes-versioning.mjs --json",
  "privacy-consent-copy",
  "store-and-sdk-policy-clearance",
  "production-speaker-model",
  "front-back-direction-evidence",
  "Upload-ready release validation remains blocked",
];

const requiredUrls = [
  "https://support.google.com/googleplay/android-developer/answer/9859348?hl=en-EN",
  "https://support.google.com/googleplay/android-developer/answer/9845334?hl=en",
  "https://support.google.com/googleplay/android-developer/answer/9859152?hl=en-EN",
];

const prohibitedPositiveClaims = [
  "guaranteed speaker identity",
  "front/back direction proven",
  "real Meta DAT support",
  "Android XR production support",
  "glasses haptics supported",
  "production ready",
  "available on Google Play",
  "Play upload complete",
  "external submission performed",
];

const requiredEnglishLimitations = [
  "Not production speaker ID",
  "not front/back proven",
  "not real Meta DAT/Android XR release support",
];

const requiredKoreanLimitations = [
  "production 화자 식별",
  "front/back 검증",
  "실제 Meta DAT/Android XR 출시 지원",
  "아직 아닙니다",
];

function usage() {
  return [
    "Usage: scripts/validate-release-notes-versioning.mjs [doc.md] [--json]",
    "",
    "Validates release-note/versioning docs against the current Gradle version and Play internal-testing guardrails.",
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasSection(markdown, title) {
  return new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`, "m").test(markdown);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");
}

function extractGradleValue(source, field) {
  const quoted = source.match(new RegExp(`${field}\\s*=\\s*"([^"]+)"`));
  if (quoted) return quoted[1];
  const numeric = source.match(new RegExp(`${field}\\s*=\\s*(\\d+)`));
  return numeric ? numeric[1] : "";
}

function releaseNotesPath(versionName) {
  return path.join(defaultNotesDir, `internal-testing-v${versionName}.md`);
}

function extractLocaleBlock(markdown, locale) {
  const match = markdown.match(new RegExp(`<${escapeRegExp(locale)}>([\\s\\S]*?)</${escapeRegExp(locale)}>`, "m"));
  return match ? match[1].trim() : "";
}

function unicodeLength(value) {
  return [...value].length;
}

function includesInsensitive(haystack, needle) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

const errors = [];
const warnings = [];
const { absolute: docAbsolute, relative: docRelative } = resolveInsideWorkspace(docArg);

const buildGradleAbsolute = path.join(ROOT_DIR, buildGradlePath);
let versionCode = "";
let versionName = "";
let applicationId = "";
let notesRelative = "";

if (!fs.existsSync(buildGradleAbsolute)) {
  errors.push(`Missing Gradle app file: ${buildGradlePath}`);
} else {
  const buildGradle = fs.readFileSync(buildGradleAbsolute, "utf8");
  applicationId = extractGradleValue(buildGradle, "applicationId");
  versionCode = extractGradleValue(buildGradle, "versionCode");
  versionName = extractGradleValue(buildGradle, "versionName");
  notesRelative = releaseNotesPath(versionName);

  if (applicationId !== "com.voicedirection.glass") {
    errors.push(`Unexpected applicationId: ${applicationId || "missing"}`);
  }
  if (!versionCode) {
    errors.push("Missing versionCode in Gradle app file.");
  }
  if (!versionName) {
    errors.push("Missing versionName in Gradle app file.");
  }
}

if (!fs.existsSync(docAbsolute)) {
  errors.push(`Release notes/versioning doc does not exist: ${docRelative}`);
} else {
  const markdown = fs.readFileSync(docAbsolute, "utf8");

  if (!markdown.startsWith("# Release Notes And Versioning Readiness")) {
    errors.push("Document must start with '# Release Notes And Versioning Readiness'.");
  }

  for (const section of requiredSections) {
    if (!hasSection(markdown, section)) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  const dynamicMarkers = [
    ...requiredMarkers,
    `versionCode\` | \`${versionCode}`,
    `versionName\` | \`${versionName}`,
    `applicationId\` | \`${applicationId}`,
  ];
  for (const marker of dynamicMarkers) {
    if (!markdown.includes(marker)) {
      errors.push(`Missing required marker: ${marker}`);
    }
  }

  for (const url of requiredUrls) {
    if (!markdown.includes(url)) {
      errors.push(`Missing required official source URL: ${url}`);
    }
  }

  // The document intentionally lists unsupported claims as guardrails. The
  // actual release-note locale blocks are checked below, where the copy would
  // become tester/reviewer-facing.
}

const notesAbsolute = notesRelative ? path.join(ROOT_DIR, notesRelative) : "";
if (!notesRelative || !fs.existsSync(notesAbsolute)) {
  errors.push(`Release notes draft does not exist: ${notesRelative || "<unknown version>"}`);
} else {
  const notes = fs.readFileSync(notesAbsolute, "utf8");
  const expectedTitle = `# Internal Testing Release Notes - ${versionName} (${versionCode})`;

  if (!notes.startsWith(expectedTitle)) {
    errors.push(`Release notes title must start with '${expectedTitle}'.`);
  }
  if (!notes.includes("Release notes status: DRAFT_NOT_SUBMITTED")) {
    errors.push("Release notes must remain DRAFT_NOT_SUBMITTED until Play evidence exists.");
  }
  if (!notes.includes("Track: INTERNAL_TESTING_DRAFT")) {
    errors.push("Release notes must identify the internal testing draft track.");
  }

  const enUs = extractLocaleBlock(notes, "en-US");
  const koKr = extractLocaleBlock(notes, "ko-KR");
  if (!enUs) errors.push("Missing <en-US> release-note block.");
  if (!koKr) errors.push("Missing <ko-KR> release-note block.");

  for (const [locale, text] of [["en-US", enUs], ["ko-KR", koKr]]) {
    const length = unicodeLength(text);
    if (length > 500) {
      errors.push(`${locale} release note is ${length} Unicode characters; limit is 500.`);
    }
    if (text.includes("speaker name") || text.includes("transcript") || text.includes("raw audio")) {
      errors.push(`${locale} release note must not mention private speaker/transcript/raw-audio details.`);
    }
  }

  for (const marker of requiredEnglishLimitations) {
    if (!enUs.includes(marker)) {
      errors.push(`en-US release note missing limitation marker: ${marker}`);
    }
  }

  for (const marker of requiredKoreanLimitations) {
    if (!koKr.includes(marker)) {
      errors.push(`ko-KR release note missing limitation marker: ${marker}`);
    }
  }

  for (const claim of prohibitedPositiveClaims) {
    if (includesInsensitive(enUs, claim) || includesInsensitive(koKr, claim)) {
      errors.push(`Release notes must not claim unsupported status: ${claim}`);
    }
  }
}

if (versionCode === "1") {
  warnings.push("Current versionCode is 1; increase it before any second Play upload attempt.");
}

const result = {
  ok: errors.length === 0,
  doc: docRelative,
  gradle: {
    path: buildGradlePath,
    applicationId,
    versionCode,
    versionName,
  },
  releaseNotes: notesRelative
    ? {
        path: notesRelative,
        exists: fs.existsSync(path.join(ROOT_DIR, notesRelative)),
        enUsLength: fs.existsSync(path.join(ROOT_DIR, notesRelative)) ? unicodeLength(extractLocaleBlock(readText(notesRelative), "en-US")) : 0,
        koKrLength: fs.existsSync(path.join(ROOT_DIR, notesRelative)) ? unicodeLength(extractLocaleBlock(readText(notesRelative), "ko-KR")) : 0,
      }
    : null,
  warnings,
  errors,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Release notes/versioning validation passed for ${docRelative}.`);
  for (const warning of warnings) {
    console.log(`Warning: ${warning}`);
  }
} else {
  console.error(`Release notes/versioning validation failed for ${docRelative}.`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  for (const warning of warnings) {
    console.error(`Warning: ${warning}`);
  }
}

process.exit(result.ok ? 0 : 1);
