#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PACK = "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const packArg = args.find((arg) => !arg.startsWith("--")) || DEFAULT_PACK;

const requiredFiles = [
  "README.md",
  "commands.sh",
  "operator-checklist.md",
  "privacy-redaction-rules.md",
  "session-links.json",
];
const requiredReadmeMarkers = [
  "## Default No-Hardware Run",
  "## Hardware Opt-In Runs",
  "RUN_PHONE=1",
  "RUN_GLASSES=1",
  "RUN_SUPPORT=1",
  "Phone private alpha requires",
  "Glasses private alpha requires",
];
const requiredCommandMarkers = [
  "scripts/check-private-alpha-hardware-readiness.mjs",
  "scripts/assert-service-gates.mjs --profile current-safe",
  "scripts/run-phone-private-alpha-evidence.mjs --skip-build --allow-no-device --evidence-dir",
  "scripts/validate-phone-private-alpha-evidence-runner.mjs",
  "scripts/run-glasses-private-alpha-evidence.mjs",
  "scripts/validate-glasses-private-alpha-evidence-runner.mjs",
  "RUN_PHONE",
  "RUN_GLASSES",
  "RUN_SUPPORT",
  "scripts/audit-service-readiness.mjs --write-report",
  "scripts/scan-evidence-privacy.mjs \"$PACK_DIR\" --write-report --report-dir \"$PACK_DIR/evidence-privacy-scan\" --json",
  "scripts/validate-hardware-test-promotion.mjs",
  "--write-report --report-dir \"$PACK_DIR/promotion-validation\"",
];
const privatePatterns = [
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
    "Usage: scripts/validate-hardware-test-operator-pack.mjs [operator-pack-dir] [--json]",
    "",
    "Validates the non-PII hardware test operator pack structure and command safety.",
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
      } else if (entry.isFile() && /\.(md|txt|json|sh)$/i.test(entry.name)) {
        files.push(absolute);
      }
    }
  }
  return files;
}

const errors = [];
const warnings = [];
const pack = resolveInsideWorkspace(packArg);

if (!fs.existsSync(pack.absolute) || !fs.statSync(pack.absolute).isDirectory()) {
  errors.push(`Operator pack directory does not exist: ${pack.relative}`);
} else {
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(pack.absolute, file))) {
      errors.push(`Missing required operator pack file: ${file}`);
    }
  }

  if (errors.length === 0) {
    const readme = fs.readFileSync(path.join(pack.absolute, "README.md"), "utf8");
    const commands = fs.readFileSync(path.join(pack.absolute, "commands.sh"), "utf8");
    const checklist = fs.readFileSync(path.join(pack.absolute, "operator-checklist.md"), "utf8");
    const privacy = fs.readFileSync(path.join(pack.absolute, "privacy-redaction-rules.md"), "utf8");

    if (!readme.startsWith("# Hardware Test Operator Pack")) {
      errors.push("README.md must start with '# Hardware Test Operator Pack'.");
    }
    if (!checklist.startsWith("# Hardware Test Operator Checklist")) {
      errors.push("operator-checklist.md must start with '# Hardware Test Operator Checklist'.");
    }
    hasAllMarkers(readme, requiredReadmeMarkers, "README.md", errors);
    hasAllMarkers(commands, requiredCommandMarkers, "commands.sh", errors);
    hasAllMarkers(privacy, ["audio recordings", "speech transcripts", "Bluetooth owner/device/product names", "MAC addresses"], "privacy-redaction-rules.md", errors);

    const commandPath = path.join(pack.absolute, "commands.sh");
    try {
      fs.accessSync(commandPath, fs.constants.X_OK);
    } catch {
      errors.push("commands.sh must be executable.");
    }
    const bashCheck = spawnSync("bash", ["-n", commandPath], { encoding: "utf8" });
    if (bashCheck.status !== 0) {
      errors.push(`commands.sh has shell syntax errors: ${bashCheck.stderr.trim()}`);
    }

    let links = null;
    try {
      links = JSON.parse(fs.readFileSync(path.join(pack.absolute, "session-links.json"), "utf8"));
    } catch (error) {
      errors.push(`session-links.json parse failed: ${error.message}`);
    }
    if (links) {
      if (links.schemaVersion !== 1) errors.push("session-links.json schemaVersion must be 1.");
      for (const key of ["physicalSession", "supportSession", "glassesSession", "rehearsalSession"]) {
        const value = links[key];
        if (!value || path.isAbsolute(value) || value.includes("..")) {
          errors.push(`session-links.json ${key} must be workspace-relative without '..'.`);
          continue;
        }
        const target = path.join(ROOT_DIR, value);
        if (!fs.existsSync(target)) {
          warnings.push(`Linked session does not exist yet: ${value}`);
        }
      }
      for (const value of Object.values(links.privacy ?? {})) {
        if (value !== false) errors.push("session-links.json privacy guardrails must all be false.");
      }
    }

    for (const file of listTextFiles(pack.absolute)) {
      const text = fs.readFileSync(file, "utf8");
      const relativeFile = path.relative(ROOT_DIR, file);
      for (const pattern of privatePatterns) {
        if (pattern.test(text)) {
          errors.push(`Potential private structured field in ${relativeFile}: ${pattern}`);
        }
      }
    }
  }
}

const result = {
  packDir: pack.relative,
  ok: errors.length === 0,
  errors,
  warnings,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Hardware test operator pack validation passed: ${pack.relative}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Hardware test operator pack validation failed: ${pack.relative}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
