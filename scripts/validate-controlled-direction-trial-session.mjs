#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const sessionArg = args.find((arg) => !arg.startsWith("--"));
const DIRECTIONS = ["FRONT", "BACK", "LEFT", "RIGHT"];
const ALLOWED_SOURCES = new Set([
  "controlled-phone",
  "bluetooth-route",
  "rayban-display",
  "rayban-gen1-fallback",
  "android-xr-projected",
  "manual-adb-direction-validation",
]);

const requiredFiles = [
  "README.md",
  "commands.sh",
  "adb-command-templates.md",
  "trial-run-sheet.md",
  "trial-plan.csv",
  "aggregate-summary-template.json",
  "privacy-redaction-rules.md",
];

const commandMarkers = [
  "scripts/record-direction-validation-trial.sh",
  "validate-direction-accuracy-evidence.mjs",
  "validate-controlled-direction-trial-session.mjs",
  "audit-service-readiness.mjs",
  "RUN_ADB_CLEAR",
];

const readmeMarkers = [
  "## Required Order",
  "trial-run-sheet.md",
  "trial-plan.csv",
  "aggregate-summary-template.json",
  "strict production validation blocked",
];

const templateMarkers = [
  "--expected FRONT",
  "--expected BACK",
  "--expected LEFT",
  "--expected RIGHT",
  "--observed OBSERVED",
  "--status STATUS",
  "--confidence CONFIDENCE",
];

const privacyMarkers = [
  "Raw audio files or PCM samples",
  "Speech text from real people",
  "Person names or speaker labels",
  "Voice embedding values",
  "Bluetooth owner/device names",
  "Private alert message text",
];

const privateFieldPatterns = [
  /\btranscript\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|todo\b|$)/i,
  /\bspeaker(?:Name|Label|Text)?\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|todo\b|$)/i,
  /\bcaller(?:Name|Label)\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|todo\b|$)/i,
  /\bprofile(?:Name|Label)\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|todo\b|$)/i,
  /\bphrase\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|todo\b|$)/i,
  /\bembedding\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|todo\b|$)/i,
  /\benc:v\d+:/i,
  /\bpcm\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|todo\b|$)/i,
  /\braw(?:Audio|Pcm)\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|todo\b|$)/i,
  /\baudioBytes\s*[:=]\s*(?!\[redacted\]|no\b|none\b|not\b|false\b|todo\b|$)/i,
  /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,
];

function usage() {
  return [
    "Usage: scripts/validate-controlled-direction-trial-session.mjs <session-dir> [--json]",
    "",
    "Validates a generated controlled direction-trial session folder.",
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
    if (!text.includes(marker)) errors.push(`${label} is missing marker: ${marker}`);
  }
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines.shift()?.split(",") ?? [];
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""]));
  });
}

function scanPrivateFields(sessionAbsolute, errors) {
  for (const file of requiredFiles) {
    if (file === "privacy-redaction-rules.md") continue;
    const absolute = path.join(sessionAbsolute, file);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
    const text = fs.readFileSync(absolute, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const pattern of privateFieldPatterns) {
        if (pattern.test(line)) {
          errors.push(`${file}:${index + 1} appears to contain a private structured field.`);
          break;
        }
      }
    });
  }
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] ?? 0) + 1;
    return acc;
  }, {});
}

const errors = [];
const warnings = [];
const { absolute: sessionDir, relative: sessionRelative } = resolveInsideWorkspace(sessionArg);

if (!fs.existsSync(sessionDir) || !fs.statSync(sessionDir).isDirectory()) {
  errors.push(`Missing session directory: ${sessionRelative}`);
} else {
  for (const file of requiredFiles) {
    const absolute = path.join(sessionDir, file);
    if (!fs.existsSync(absolute)) errors.push(`Missing required session file: ${file}`);
  }

  if (errors.length === 0) {
    const readme = readRelative(sessionDir, "README.md");
    const commands = readRelative(sessionDir, "commands.sh");
    const templates = readRelative(sessionDir, "adb-command-templates.md");
    const privacy = readRelative(sessionDir, "privacy-redaction-rules.md");
    const csvText = readRelative(sessionDir, "trial-plan.csv");
    const aggregate = JSON.parse(readRelative(sessionDir, "aggregate-summary-template.json"));
    const rows = parseCsv(csvText);

    hasAllMarkers(readme, readmeMarkers, "README.md", errors);
    hasAllMarkers(commands, commandMarkers, "commands.sh", errors);
    hasAllMarkers(templates, templateMarkers, "adb-command-templates.md", errors);
    hasAllMarkers(privacy, privacyMarkers, "privacy-redaction-rules.md", errors);

    if (!commands.startsWith("#!/usr/bin/env bash")) errors.push("commands.sh must be a bash script.");
    if ((fs.statSync(path.join(sessionDir, "commands.sh")).mode & 0o111) === 0) errors.push("commands.sh must be executable.");

    if (aggregate.packageName !== "com.voicedirection.glass") errors.push("aggregate-summary-template.json packageName must be com.voicedirection.glass.");
    if (aggregate.status !== "CONTROLLED_DIRECTION_TRIALS_NOT_RUN") warnings.push(`Aggregate status is ${aggregate.status}; review before treating the session as pre-run.`);
    if (!ALLOWED_SOURCES.has(aggregate.source)) errors.push(`Invalid aggregate source: ${aggregate.source}`);
    if (aggregate.productionDirectionCandidate !== false) errors.push("Generated session must not start as a production direction candidate.");

    for (const key of [
      "rawAudioPersisted",
      "pcmPersisted",
      "transcriptsInEvidence",
      "rawEmbeddingValuesInEvidence",
      "speakerNamesInEvidence",
      "bluetoothNamesInEvidence",
      "privateAlertTextInEvidence",
    ]) {
      if (aggregate.privacy?.[key] !== false) errors.push(`aggregate privacy.${key} must be false.`);
    }

    const expectedTrialsPerDirection = aggregate.expected?.trialsPerDirection;
    const expectedTotal = aggregate.expected?.totalTrials;
    if (!Number.isInteger(expectedTrialsPerDirection) || expectedTrialsPerDirection <= 0) {
      errors.push("aggregate expected.trialsPerDirection must be a positive integer.");
    }
    if (!Number.isInteger(expectedTotal) || expectedTotal <= 0) {
      errors.push("aggregate expected.totalTrials must be a positive integer.");
    }
    if (rows.length !== expectedTotal) errors.push(`trial-plan.csv row count ${rows.length} must equal expected total ${expectedTotal}.`);

    const counts = countBy(rows, "expectedDirection");
    for (const direction of DIRECTIONS) {
      if (counts[direction] !== expectedTrialsPerDirection) {
        errors.push(`trial-plan.csv must contain ${expectedTrialsPerDirection} ${direction} rows; found ${counts[direction] ?? 0}.`);
      }
    }

    for (const [index, row] of rows.entries()) {
      if (!row.trialId) errors.push(`trial-plan.csv row ${index + 2} missing trialId.`);
      if (!DIRECTIONS.includes(row.expectedDirection)) errors.push(`trial-plan.csv row ${index + 2} invalid expectedDirection: ${row.expectedDirection}`);
      if (row.observedDirection !== "TODO" && ![...DIRECTIONS, "UNKNOWN"].includes(row.observedDirection)) {
        errors.push(`trial-plan.csv row ${index + 2} invalid observedDirection: ${row.observedDirection}`);
      }
      if (!ALLOWED_SOURCES.has(row.source)) errors.push(`trial-plan.csv row ${index + 2} invalid source: ${row.source}`);
      if (row.recorderCommandRan !== "no" && row.recorderCommandRan !== "yes") {
        errors.push(`trial-plan.csv row ${index + 2} recorderCommandRan must be yes or no.`);
      }
    }

    scanPrivateFields(sessionDir, errors);
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
  console.log(`Controlled direction trial session validation passed: ${sessionRelative}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Controlled direction trial session validation failed: ${sessionRelative}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
