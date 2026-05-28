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
  "meta-rayban-display-evidence.md",
  "rayban-gen1-fallback-evidence.md",
  "android-xr-projected-evidence.md",
  "haptics-fallback-evidence.md",
  "manifest-update-template.json",
  "privacy-redaction-rules.md",
];

const readmeMarkers = [
  "## Required Order",
  "meta-rayban-display-evidence.md",
  "rayban-gen1-fallback-evidence.md",
  "android-xr-projected-evidence.md",
  "haptics-fallback-evidence.md",
  "manifest-update-template.json",
  "Strict glasses hardware validation is expected to fail",
];

const commandMarkers = [
  "./gradlew --no-daemon test assembleDebug",
  "node scripts/validate-glasses-setup-readiness.mjs --json",
  "node scripts/validate-glasses-hardware-evidence.mjs --json",
  "node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json",
  "scripts/glasses-integration-preflight.sh --write-evidence",
  "node scripts/validate-glasses-hardware-session.mjs",
  "node scripts/audit-service-readiness.mjs --write-report",
];

const metaMarkers = [
  "## Setup",
  "## Adapter Proof",
  "## Display Cue Proof",
  "## Evidence Summary",
  "MetaDatDisplayStubAdapter",
  "cueRenderedOnDisplay",
  "directionVisible",
  "displayLabelPrivacyReviewed",
];

const gen1Markers = [
  "## Setup",
  "## Route Proof",
  "## Fallback Output Proof",
  "## Evidence Summary",
  "bluetoothInputCandidateVisible",
  "routeSelectClearTested",
  "privateRouteNamesRedacted",
];

const xrMarkers = [
  "## Setup",
  "## Projected Runtime Proof",
  "## Audio And Fallback Proof",
  "## Evidence Summary",
  "projectedActivityLaunched",
  "projectedContextUsed",
  "cueVisibleOnProjectedDisplay",
  "emptyStateVisible",
];

const hapticsMarkers = [
  "## Official API Check",
  "## Fallback Proof",
  "## Evidence Summary",
  "perSideHapticsVerified",
  "phoneVibrationFallbackRemainsMvp",
  "phoneVibrationSideSpecific=false",
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

function usage() {
  return [
    "Usage: scripts/validate-glasses-hardware-session.mjs <session-dir> [--json]",
    "",
    "Validates a generated glasses hardware evidence session folder before or after hardware evidence collection.",
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

function expectEvidencePath(manifest, section, key, suffix, errors) {
  const value = String(manifest?.[section]?.[key] ?? "");
  if (!value.endsWith(suffix)) {
    errors.push(`manifest-update-template.json ${section}.${key} must point to ${suffix}.`);
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
      errors.push(`Missing required session file: ${file}`);
    }
  }

  if (errors.length === 0) {
    const readme = readRelative(sessionDir, "README.md");
    const commands = readRelative(sessionDir, "commands.sh");
    const meta = readRelative(sessionDir, "meta-rayban-display-evidence.md");
    const gen1 = readRelative(sessionDir, "rayban-gen1-fallback-evidence.md");
    const xr = readRelative(sessionDir, "android-xr-projected-evidence.md");
    const haptics = readRelative(sessionDir, "haptics-fallback-evidence.md");
    const privacyRules = readRelative(sessionDir, "privacy-redaction-rules.md");

    if (firstMarkdownHeading(readme) !== "Glasses Hardware Session Summary") {
      errors.push("README.md must start with '# Glasses Hardware Session Summary'.");
    }

    hasAllMarkers(readme, readmeMarkers, "README.md", errors);
    hasAllMarkers(commands, commandMarkers, "commands.sh", errors);
    hasAllMarkers(meta, metaMarkers, "meta-rayban-display-evidence.md", errors);
    hasAllMarkers(gen1, gen1Markers, "rayban-gen1-fallback-evidence.md", errors);
    hasAllMarkers(xr, xrMarkers, "android-xr-projected-evidence.md", errors);
    hasAllMarkers(haptics, hapticsMarkers, "haptics-fallback-evidence.md", errors);
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
      if (manifestTemplate.externalSubmission !== "not_performed") {
        errors.push("manifest-update-template.json externalSubmission must be not_performed.");
      }
      expectEvidencePath(manifestTemplate, "metaRayBanDisplay", "evidencePath", "meta-rayban-display-evidence.md", errors);
      expectEvidencePath(manifestTemplate, "rayBanGen1BluetoothFallback", "evidencePath", "rayban-gen1-fallback-evidence.md", errors);
      expectEvidencePath(manifestTemplate, "androidXrProjected", "evidencePath", "android-xr-projected-evidence.md", errors);
      expectEvidencePath(manifestTemplate, "haptics", "evidencePath", "haptics-fallback-evidence.md", errors);
      if (manifestTemplate.privacy?.rawAudioSaved !== false || manifestTemplate.privacy?.transcriptsIncluded !== false) {
        errors.push("manifest-update-template.json privacy guardrails must default to false.");
      }
      if (manifestTemplate.privacy?.speakerNamesIncluded !== false || manifestTemplate.privacy?.bluetoothProductNamesIncluded !== false) {
        errors.push("manifest-update-template.json speaker/Bluetooth privacy guardrails must default to false.");
      }
      if (manifestTemplate.serviceReadinessAuditRegenerated !== false) {
        errors.push("manifest-update-template.json serviceReadinessAuditRegenerated must default to false.");
      }
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
      if (!audit.includes("Glasses hardware evidence")) {
        errors.push("service-readiness-audit/service-readiness-audit.md is missing Glasses hardware evidence artifact row.");
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
  console.log(`Glasses hardware session validation passed: ${sessionRelative}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Glasses hardware session validation failed: ${sessionRelative}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
