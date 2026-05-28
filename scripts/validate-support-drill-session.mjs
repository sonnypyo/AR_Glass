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
  "deletion-verification-drill.md",
  "mistaken-alert-incident-drill.md",
  "manifest-update-template.json",
  "privacy-redaction-rules.md",
];

const commandMarkers = [
  "node scripts/validate-support-incident-process.mjs --json",
  "node scripts/validate-support-drill-evidence.mjs --json",
  "node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json",
  "node scripts/validate-support-drill-session.mjs",
  "node scripts/audit-service-readiness.mjs --write-report",
];

const readmeMarkers = [
  "## Required Order",
  "deletion-verification-drill.md",
  "mistaken-alert-incident-drill.md",
  "manifest-update-template.json",
  "Strict support drill validation is expected to fail",
];

const deletionMarkers = [
  "## Setup",
  "## Execution",
  "## Evidence Summary",
  "postDeleteProfileCount",
  "postDeleteEventCount",
  "postDeleteFeedbackCount",
  "postDeleteDirectionValidationCount",
  "postDeleteLatestCuePresent",
  "postDeleteLatestDeliveryPresent",
  "postDeleteSettingsReset",
];

const incidentMarkers = [
  "## Setup",
  "## Classification",
  "## Evidence Summary",
  "Severity reviewed",
  "Primary type selected",
  "Expected direction enum",
  "Observed direction enum",
  "confidenceBucket",
  "privateDataRedacted",
];

const privacyMarkers = [
  "Audio recordings or sample buffers",
  "Speech text from real people",
  "Person names",
  "Model vectors",
  "Encrypted payload values",
  "Bluetooth owner/device names",
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

function usage() {
  return [
    "Usage: scripts/validate-support-drill-session.mjs <session-dir> [--json]",
    "",
    "Validates a generated support drill evidence session folder before or after operational drill collection.",
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
      } else if (entry.isFile() && /\.(md|txt|log|out|json)$/i.test(entry.name)) {
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
    const deletionDrill = readRelative(sessionDir, "deletion-verification-drill.md");
    const mistakenAlertDrill = readRelative(sessionDir, "mistaken-alert-incident-drill.md");
    const privacyRules = readRelative(sessionDir, "privacy-redaction-rules.md");

    if (firstMarkdownHeading(readme) !== "Support Drill Session Summary") {
      errors.push("README.md must start with '# Support Drill Session Summary'.");
    }

    hasAllMarkers(readme, readmeMarkers, "README.md", errors);
    hasAllMarkers(commands, commandMarkers, "commands.sh", errors);
    hasAllMarkers(deletionDrill, deletionMarkers, "deletion-verification-drill.md", errors);
    hasAllMarkers(mistakenAlertDrill, incidentMarkers, "mistaken-alert-incident-drill.md", errors);
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

    const manifestTemplatePath = path.join(sessionDir, "manifest-update-template.json");
    let manifestTemplate = null;
    try {
      manifestTemplate = JSON.parse(fs.readFileSync(manifestTemplatePath, "utf8"));
    } catch (error) {
      errors.push(`manifest-update-template.json parse failed: ${error.message}`);
    }
    if (manifestTemplate) {
      if (manifestTemplate.packageName !== "com.voicedirection.glass") {
        errors.push("manifest-update-template.json has unexpected packageName.");
      }
      if (!String(manifestTemplate.deletionDrill?.evidencePath ?? "").endsWith("deletion-verification-drill.md")) {
        errors.push("manifest-update-template.json deletion evidencePath must point to deletion-verification-drill.md.");
      }
      if (!String(manifestTemplate.mistakenAlertDrill?.evidencePath ?? "").endsWith("mistaken-alert-incident-drill.md")) {
        errors.push("manifest-update-template.json mistaken alert evidencePath must point to mistaken-alert-incident-drill.md.");
      }
      if (manifestTemplate.privacy?.rawAudioSaved !== false || manifestTemplate.privacy?.transcriptsIncluded !== false) {
        errors.push("manifest-update-template.json privacy guardrails must default to false.");
      }
    }

    const auditPath = path.join(sessionDir, "service-readiness-audit", "service-readiness-audit.md");
    if (fs.existsSync(auditPath)) {
      const audit = fs.readFileSync(auditPath, "utf8");
      if (!audit.includes("Support drill evidence")) {
        errors.push("service-readiness-audit/service-readiness-audit.md is missing Support drill evidence artifact row.");
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
  console.log(`Support drill session validation passed: ${sessionRelative}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Support drill session validation failed: ${sessionRelative}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
