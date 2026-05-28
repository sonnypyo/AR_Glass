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
  "private-alpha-rehearsal-checklist.md",
  "rehearsal-manifest.json",
  "privacy-redaction-rules.md",
];

const readmeMarkers = [
  "## Required Order",
  "Physical device session",
  "Support drill session",
  "Glasses hardware session",
  "Phone private alpha remains not ready",
  "Glasses private alpha remains blocked",
];

const commandMarkers = [
  "./gradlew --no-daemon test assembleDebug",
  "node scripts/validate-physical-test-session.mjs",
  "node scripts/validate-support-drill-session.mjs",
  "node scripts/validate-glasses-hardware-session.mjs",
  "node scripts/apply-glasses-hardware-session.mjs",
  "node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json",
  "node scripts/validate-glasses-setup-readiness.mjs --require-credentials --json",
  "node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json",
  "node scripts/audit-service-readiness.mjs --write-report",
  "node scripts/validate-private-alpha-rehearsal.mjs",
];

const checklistMarkers = [
  "## Phone Private Alpha",
  "## Glasses Private Alpha",
  "## Support And External Beta",
  "device-evidence.md",
  "latestCuePresent=true",
  "latestDeliverySource=TEST_CUE",
  "Strict glasses hardware validator",
  "Strict support drill validator",
];

const privacyMarkers = [
  "Audio recordings or PCM samples",
  "Speech transcripts from real people",
  "Speaker names",
  "Voice embedding values",
  "Encrypted payload values",
  "Bluetooth owner/device names",
  "MAC addresses",
  "Private alert message text",
];

const privateFieldPatterns = [
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

const privacyFalseFields = [
  "rawAudioSaved",
  "pcmSaved",
  "transcriptsIncluded",
  "speakerNamesIncluded",
  "contactNamesIncluded",
  "voiceEmbeddingsIncluded",
  "encryptedPayloadsIncluded",
  "bluetoothOwnerNamesIncluded",
  "bluetoothProductNamesIncluded",
  "macAddressesIncluded",
  "privateAlertTextIncluded",
  "privateLocationsIncluded",
];

function usage() {
  return [
    "Usage: scripts/validate-private-alpha-rehearsal.mjs <session-dir> [--json]",
    "",
    "Validates a generated private-alpha rehearsal folder that links phone, support, and glasses evidence sessions.",
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
    throw new Error(`Refusing to access outside workspace: ${absolute}`);
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

function firstMarkdownHeading(text) {
  return text.match(/^#\s+(.+)$/m)?.[1] ?? "";
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
      } else if (entry.isFile() && /\.(md|txt|log|out|json)$/i.test(entry.name)) {
        files.push(absolute);
      }
    }
  }
  return files;
}

function runNodeScript(scriptRelative, scriptArgs) {
  return spawnSync(process.execPath, [path.join(ROOT_DIR, scriptRelative), ...scriptArgs], {
    cwd: ROOT_DIR,
    encoding: "utf8",
  });
}

function validatorOutput(result) {
  return (result.stdout || result.stderr || "").trim();
}

function validateLinkedSession(scriptRelative, sessionRelative, label, errors) {
  const { absolute, relative } = resolveInsideWorkspace(sessionRelative);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) {
    errors.push(`${label} session directory does not exist: ${relative}`);
    return;
  }
  const validation = runNodeScript(scriptRelative, [relative, "--json"]);
  if (validation.status !== 0) {
    errors.push(`${label} session validator failed: ${validatorOutput(validation)}`);
  }
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
      errors.push(`Missing required rehearsal file: ${file}`);
    }
  }

  if (errors.length === 0) {
    const readme = readRelative(sessionDir, "README.md");
    const commands = readRelative(sessionDir, "commands.sh");
    const checklist = readRelative(sessionDir, "private-alpha-rehearsal-checklist.md");
    const privacyRules = readRelative(sessionDir, "privacy-redaction-rules.md");

    if (firstMarkdownHeading(readme) !== "Private Alpha Rehearsal Summary") {
      errors.push("README.md must start with '# Private Alpha Rehearsal Summary'.");
    }

    hasAllMarkers(readme, readmeMarkers, "README.md", errors);
    hasAllMarkers(commands, commandMarkers, "commands.sh", errors);
    hasAllMarkers(checklist, checklistMarkers, "private-alpha-rehearsal-checklist.md", errors);
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

    const manifestPath = path.join(sessionDir, "rehearsal-manifest.json");
    let manifest = null;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (error) {
      errors.push(`rehearsal-manifest.json parse failed: ${error.message}`);
    }

    if (manifest) {
      if (manifest.schemaVersion !== 1) errors.push(`Unexpected schemaVersion: ${manifest.schemaVersion}`);
      if (manifest.packageName !== "com.voicedirection.glass") errors.push(`Unexpected packageName: ${manifest.packageName}`);
      if (manifest.externalSubmission !== "not_performed") errors.push("externalSubmission must remain not_performed.");
      for (const field of privacyFalseFields) {
        if (manifest.privacy?.[field] !== false) {
          errors.push(`rehearsal-manifest.json privacy.${field} must be false.`);
        }
      }
      validateLinkedSession("scripts/validate-physical-test-session.mjs", manifest.sessions?.physicalSession ?? "", "physical", errors);
      validateLinkedSession("scripts/validate-support-drill-session.mjs", manifest.sessions?.supportDrillSession ?? "", "support drill", errors);
      validateLinkedSession("scripts/validate-glasses-hardware-session.mjs", manifest.sessions?.glassesHardwareSession ?? "", "glasses hardware", errors);
      const expectedStrictFailures = manifest.expectedStrictFailuresUntilEvidence ?? [];
      for (const marker of ["support_drills_ready", "glasses_setup_credentials", "glasses_hardware_alpha_ready"]) {
        if (!expectedStrictFailures.includes(marker)) {
          errors.push(`rehearsal-manifest.json expectedStrictFailuresUntilEvidence is missing ${marker}.`);
        }
      }
    }

    const auditPath = path.join(sessionDir, "service-readiness-audit", "service-readiness-audit.md");
    if (fs.existsSync(auditPath)) {
      const audit = fs.readFileSync(auditPath, "utf8");
      if (!audit.includes("## Target Summary")) {
        errors.push("service-readiness-audit/service-readiness-audit.md is missing Target Summary.");
      }
      if (!audit.includes("Glasses hardware session apply")) {
        errors.push("service-readiness-audit/service-readiness-audit.md is missing Glasses hardware session apply artifact row.");
      }
    } else {
      warnings.push("No service-readiness-audit/service-readiness-audit.md exists yet.");
    }

    for (const file of listTextFiles(sessionDir)) {
      if (path.basename(file) === "privacy-redaction-rules.md") continue;
      const relativeFile = path.relative(ROOT_DIR, file);
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
  console.log(`Private alpha rehearsal validation passed: ${sessionRelative}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Private alpha rehearsal validation failed: ${sessionRelative}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
