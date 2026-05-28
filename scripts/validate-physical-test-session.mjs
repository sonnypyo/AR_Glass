#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const sessionArg = args.find((arg) => !arg.startsWith("--"));

const requiredFiles = [
  "README.md",
  "commands.sh",
  "phone-manual-checklist.md",
  "meta-rayban-checklist.md",
  "android-xr-checklist.md",
  "direction-accuracy-checklist.md",
  "privacy-redaction-rules.md",
];

const commandMarkers = [
  "./gradlew --no-daemon test assembleDebug",
  "scripts/android-device-smoke-test.sh --skip-build --write-evidence",
  "scripts/glasses-integration-preflight.sh --write-evidence",
  "node scripts/validate-device-evidence.mjs",
  "node scripts/validate-direction-accuracy-evidence.mjs --json",
  "node scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json",
  "scripts/create-controlled-direction-trial-session.mjs",
  "scripts/validate-controlled-direction-trial-session.mjs",
  "scripts/audit-service-readiness.mjs --write-report",
];

const phoneChecklistMarkers = [
  "## Setup",
  "## Core Runtime",
  "## Speaker And Consent",
  "## Direction And Alerts",
  "## False Positive And Storage",
  "Microphone disclosure",
  "`latestDeliverySource=TEST_CUE`",
  "`latestCuePresent=true`",
  "Debug glasses cue seed broadcast",
  "Debug Bluetooth route evidence broadcast",
  "Debug local delete self-check broadcast",
  "Debug direction sample broadcast",
  "record-direction-validation-trial.sh",
  "direction-accuracy-checklist.md",
  "30-minute false-positive test session",
];

const metaChecklistMarkers = [
  "## Preflight",
  "## Ray-Ban Display",
  "## Ray-Ban Meta Gen 1 Fallback",
  "Meta Wearables application id",
  "GitHub Packages token",
];

const xrChecklistMarkers = [
  "## Preflight",
  "## Projected Cue",
  "## Audio And Fallback",
  "Projected-context microphone access",
  "`AndroidXrDisplayStubAdapter` replacement plan",
];

const directionAccuracyChecklistMarkers = [
  "## Validation Commands",
  "## Phone Baseline",
  "## Controlled Direction Trials",
  "## Wearable Routes",
  "Strict direction validation status",
  "UNKNOWN outcomes preserved as UNKNOWN",
  "record-direction-validation-trial.sh",
];

const privacyMarkers = [
  "Raw audio files or PCM samples",
  "Speech transcripts from real people",
  "Speaker names",
  "Voice embedding values",
  "Encrypted payload values",
  "Bluetooth owner/device names",
  "Private alert message text",
];

const privateFieldPatterns = [
  /\btranscript\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b)/i,
  /\bspeaker(?:Name|Label|Text)?\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b)/i,
  /\bcaller(?:Name|Label)\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b)/i,
  /\bprofile(?:Name|Label)\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b)/i,
  /\bphrase\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b)/i,
  /\bembedding\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b)/i,
  /\benc:v\d+:/i,
  /\bpcm\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b)/i,
  /\braw(?:Audio|Pcm)\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b)/i,
  /\baudioBytes\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b)/i,
];

function usage() {
  return [
    "Usage: scripts/validate-physical-test-session.mjs <session-dir> [--json]",
    "",
    "Validates a generated physical-device test session folder before or after hardware evidence collection.",
  ].join("\n");
}

if (showHelp || !sessionArg) {
  console.log(usage());
  process.exit(showHelp ? 0 : 1);
}

function resolveInsideWorkspace(value) {
  const absolute = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to read outside workspace: ${absolute}`);
  }
  return { absolute, relative };
}

function readRelative(sessionAbsolute, relativePath) {
  return fs.readFileSync(path.join(sessionAbsolute, relativePath), "utf8");
}

function hasAllMarkers(text, markers, label, errors) {
  for (const marker of markers) {
    if (!text.includes(marker)) {
      errors.push(`${label} is missing marker: ${marker}`);
    }
  }
}

function listTextFiles(startDir) {
  const files = [];
  const stack = [startDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
      } else if (entry.isFile() && /\.(md|txt|log|out)$/i.test(entry.name)) {
        files.push(absolute);
      }
    }
  }
  return files;
}

function firstMarkdownHeading(text) {
  return text.match(/^#\s+(.+)$/m)?.[1] ?? "";
}

const { absolute: sessionDir, relative: sessionRelative } = resolveInsideWorkspace(sessionArg);
const errors = [];
const warnings = [];

if (!fs.existsSync(sessionDir) || !fs.statSync(sessionDir).isDirectory()) {
  errors.push(`Session directory does not exist: ${sessionRelative}`);
} else {
  for (const file of requiredFiles) {
    const absoluteFile = path.join(sessionDir, file);
    if (!fs.existsSync(absoluteFile)) {
      errors.push(`Missing required session file: ${file}`);
    }
  }

  if (errors.length === 0) {
    const readme = readRelative(sessionDir, "README.md");
    const commands = readRelative(sessionDir, "commands.sh");
    const phoneChecklist = readRelative(sessionDir, "phone-manual-checklist.md");
    const metaChecklist = readRelative(sessionDir, "meta-rayban-checklist.md");
    const xrChecklist = readRelative(sessionDir, "android-xr-checklist.md");
    const directionAccuracyChecklist = readRelative(sessionDir, "direction-accuracy-checklist.md");
    const privacyRules = readRelative(sessionDir, "privacy-redaction-rules.md");

    if (firstMarkdownHeading(readme) !== "Physical Test Session Summary") {
      errors.push("README.md must start with '# Physical Test Session Summary'.");
    }

    hasAllMarkers(commands, commandMarkers, "commands.sh", errors);
    hasAllMarkers(phoneChecklist, phoneChecklistMarkers, "phone-manual-checklist.md", errors);
    hasAllMarkers(metaChecklist, metaChecklistMarkers, "meta-rayban-checklist.md", errors);
    hasAllMarkers(xrChecklist, xrChecklistMarkers, "android-xr-checklist.md", errors);
    hasAllMarkers(directionAccuracyChecklist, directionAccuracyChecklistMarkers, "direction-accuracy-checklist.md", errors);
    hasAllMarkers(privacyRules, privacyMarkers, "privacy-redaction-rules.md", errors);

    const commandPath = path.join(sessionDir, "commands.sh");
    try {
      fs.accessSync(commandPath, fs.constants.X_OK);
    } catch {
      errors.push("commands.sh must be executable.");
    }

    const bashCheck = spawnSync("bash", ["-n", commandPath], { encoding: "utf8" });
    if (bashCheck.status !== 0) {
      errors.push(`commands.sh has shell syntax errors: ${bashCheck.stderr.trim()}`);
    }

    const deviceEvidencePath = path.join(sessionDir, "android-phone-smoke", "device-evidence.md");
    if (fs.existsSync(deviceEvidencePath)) {
      const validator = spawnSync(process.execPath, [
        path.join(ROOT_DIR, "scripts/validate-device-evidence.mjs"),
        deviceEvidencePath,
        "--json",
      ], { encoding: "utf8" });
      if (validator.status !== 0) {
        errors.push(`Generated phone evidence failed validator: ${validator.stdout.trim() || validator.stderr.trim()}`);
      }
    } else {
      warnings.push("No android-phone-smoke/device-evidence.md exists yet; run commands.sh with an attached phone.");
    }

    const preflightPath = path.join(sessionDir, "glasses-preflight", "glasses-preflight.md");
    if (fs.existsSync(preflightPath)) {
      const preflight = fs.readFileSync(preflightPath, "utf8");
      if (!/-\s*Overall status:/i.test(preflight)) {
        errors.push("glasses-preflight/glasses-preflight.md is missing an overall status line.");
      }
    } else {
      warnings.push("No glasses-preflight/glasses-preflight.md exists yet.");
    }

    const auditPath = path.join(sessionDir, "service-readiness-audit", "service-readiness-audit.md");
    if (fs.existsSync(auditPath)) {
      const audit = fs.readFileSync(auditPath, "utf8");
      if (!audit.includes("## Target Summary")) {
        errors.push("service-readiness-audit/service-readiness-audit.md is missing Target Summary.");
      }
    } else {
      warnings.push("No service-readiness-audit/service-readiness-audit.md exists yet.");
    }

    for (const file of listTextFiles(sessionDir)) {
      const relativeFile = path.relative(ROOT_DIR, file);
      if (path.basename(file) === "privacy-redaction-rules.md") {
        continue;
      }
      const text = fs.readFileSync(file, "utf8");
      for (const pattern of privateFieldPatterns) {
        if (pattern.test(text)) {
          errors.push(`Potential private structured field in ${relativeFile}: ${pattern}`);
        }
      }
    }
  }
}

const result = {
  sessionDir: sessionRelative,
  ok: errors.length === 0,
  errors,
  warnings,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Physical test session validation passed: ${sessionRelative}`);
  for (const warning of warnings) {
    console.log(`warning: ${warning}`);
  }
} else {
  console.error(`Physical test session validation failed: ${sessionRelative}`);
  for (const error of errors) {
    console.error(`error: ${error}`);
  }
  for (const warning of warnings) {
    console.error(`warning: ${warning}`);
  }
}

process.exit(result.ok ? 0 : 1);
