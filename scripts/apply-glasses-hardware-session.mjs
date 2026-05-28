#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL_MANIFEST = "apps/voice-direction-glass/glasses-evidence/manifest.json";
const SESSION_VALIDATOR = "scripts/validate-glasses-hardware-session.mjs";
const HARDWARE_VALIDATOR = "scripts/validate-glasses-hardware-evidence.mjs";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const wantsWrite = args.includes("--write");
const allowDraftWrite = args.includes("--allow-draft");
const sessionArg = args.find((arg) => !arg.startsWith("--"));

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

const expectedEvidenceFiles = [
  ["metaRayBanDisplay", "evidencePath", "meta-rayban-display-evidence.md"],
  ["rayBanGen1BluetoothFallback", "evidencePath", "rayban-gen1-fallback-evidence.md"],
  ["androidXrProjected", "evidencePath", "android-xr-projected-evidence.md"],
  ["haptics", "evidencePath", "haptics-fallback-evidence.md"],
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
    "Usage: scripts/apply-glasses-hardware-session.mjs <session-dir> [--write] [--allow-draft] [--json]",
    "",
    "Dry-runs or applies a reviewed glasses hardware session manifest-update-template.json to the canonical glasses manifest.",
    "",
    "Default mode is dry-run only.",
    "--write updates apps/voice-direction-glass/glasses-evidence/manifest.json only after validation.",
    "--allow-draft permits writing a draft/not_collected manifest; without it, --write requires collected hardware evidence status.",
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

function collectStringValues(value, values = []) {
  if (typeof value === "string") {
    values.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStringValues(item, values);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStringValues(item, values);
  }
  return values;
}

function validateTemplateShape(template, sessionRelative, errors, warnings) {
  if (template.schemaVersion !== 1) errors.push(`Unexpected schemaVersion: ${template.schemaVersion}`);
  if (template.packageName !== "com.voicedirection.glass") errors.push(`Unexpected packageName: ${template.packageName}`);
  if (template.externalSubmission !== "not_performed") errors.push("externalSubmission must remain not_performed.");

  for (const field of privacyFalseFields) {
    if (template.privacy?.[field] !== false) {
      errors.push(`privacy.${field} must be false before applying a session manifest.`);
    }
  }

  for (const [section, key, suffix] of expectedEvidenceFiles) {
    const value = String(template?.[section]?.[key] ?? "");
    if (!value.endsWith(suffix)) {
      errors.push(`${section}.${key} must point to ${suffix}.`);
      continue;
    }
    if (path.isAbsolute(value) || value.includes("..")) {
      errors.push(`${section}.${key} must be workspace-relative without '..'.`);
      continue;
    }
    if (!value.startsWith(`${sessionRelative}/`)) {
      warnings.push(`${section}.${key} points outside the selected session folder: ${value}`);
    }
    const { absolute } = resolveInsideWorkspace(value);
    if (!fs.existsSync(absolute)) {
      errors.push(`${section}.${key} evidence file does not exist: ${value}`);
    }
  }

  for (const value of collectStringValues(template)) {
    for (const pattern of privateFieldPatterns) {
      if (pattern.test(value)) errors.push(`manifest-update-template.json contains private structured value matching ${pattern}.`);
    }
  }
}

function scanSessionPrivateFields(sessionAbsolute, errors) {
  for (const file of listTextFiles(sessionAbsolute)) {
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

function normalizeManifest(template) {
  return {
    schemaVersion: template.schemaVersion,
    packageName: template.packageName,
    status: template.status,
    externalSubmission: template.externalSubmission,
    metaRayBanDisplay: template.metaRayBanDisplay,
    rayBanGen1BluetoothFallback: template.rayBanGen1BluetoothFallback,
    androidXrProjected: template.androidXrProjected,
    haptics: template.haptics,
    privacy: template.privacy,
    serviceReadinessAuditRegenerated: template.serviceReadinessAuditRegenerated,
  };
}

function validatorOutput(result) {
  return (result.stdout || result.stderr || "").trim();
}

const errors = [];
const warnings = [];
const { absolute: sessionDir, relative: sessionRelative } = resolveInsideWorkspace(sessionArg);
const manifestTemplatePath = path.join(sessionDir, "manifest-update-template.json");
const canonicalPath = path.join(ROOT_DIR, CANONICAL_MANIFEST);
let template = null;
let proposedManifest = null;
let wroteManifest = false;

if (!fs.existsSync(sessionDir) || !fs.statSync(sessionDir).isDirectory()) {
  errors.push(`Session directory does not exist: ${sessionRelative}`);
} else {
  const sessionValidation = runNodeScript(SESSION_VALIDATOR, [sessionRelative, "--json"]);
  if (sessionValidation.status !== 0) {
    errors.push(`Session validator failed: ${validatorOutput(sessionValidation)}`);
  }

  if (!fs.existsSync(manifestTemplatePath)) {
    errors.push(`Missing manifest-update-template.json in ${sessionRelative}`);
  } else {
    try {
      template = JSON.parse(fs.readFileSync(manifestTemplatePath, "utf8"));
    } catch (error) {
      errors.push(`manifest-update-template.json parse failed: ${error.message}`);
    }
  }

  if (template) {
    validateTemplateShape(template, sessionRelative, errors, warnings);
    scanSessionPrivateFields(sessionDir, errors);
    proposedManifest = normalizeManifest(template);
  }
}

const readyStatus = proposedManifest?.status === "GLASSES_HARDWARE_EVIDENCE_COLLECTED";
const draftStatus = proposedManifest?.status === "DRAFT_GLASSES_HARDWARE_EVIDENCE_NOT_COLLECTED";
const writeReady = errors.length === 0 && (!draftStatus || allowDraftWrite);

if (wantsWrite && errors.length === 0 && draftStatus && !allowDraftWrite) {
  errors.push("Refusing to write draft glasses hardware evidence without --allow-draft.");
}

if (wantsWrite && errors.length === 0 && proposedManifest) {
  const previous = fs.readFileSync(canonicalPath, "utf8");
  try {
    fs.writeFileSync(canonicalPath, `${JSON.stringify(proposedManifest, null, 2)}\n`);
    wroteManifest = true;

    const defaultValidation = runNodeScript(HARDWARE_VALIDATOR, ["--json"]);
    if (defaultValidation.status !== 0) {
      throw new Error(`Default hardware validator failed: ${validatorOutput(defaultValidation)}`);
    }

    if (readyStatus) {
      const strictValidation = runNodeScript(HARDWARE_VALIDATOR, ["--require-glasses-alpha-ready", "--json"]);
      if (strictValidation.status !== 0) {
        throw new Error(`Strict hardware validator failed: ${validatorOutput(strictValidation)}`);
      }
    } else {
      warnings.push("Canonical manifest was written in draft mode; strict glasses alpha validation remains blocked.");
    }
  } catch (error) {
    fs.writeFileSync(canonicalPath, previous);
    wroteManifest = false;
    errors.push(`${error.message}. Canonical manifest restored.`);
  }
}

const result = {
  ok: errors.length === 0,
  sessionDir: sessionRelative,
  canonicalManifest: CANONICAL_MANIFEST,
  mode: wantsWrite ? "write" : "dry-run",
  allowDraftWrite,
  proposedStatus: proposedManifest?.status ?? "",
  readyStatus,
  writeReady,
  wroteManifest,
  errors,
  warnings,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Glasses hardware session apply ${wantsWrite ? "write" : "dry-run"} passed: ${sessionRelative}`);
  console.log(`proposed status: ${result.proposedStatus}`);
  if (!wantsWrite) {
    console.log("No files were changed. Re-run with --write after reviewing the session evidence.");
  }
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Glasses hardware session apply ${wantsWrite ? "write" : "dry-run"} failed: ${sessionRelative}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
