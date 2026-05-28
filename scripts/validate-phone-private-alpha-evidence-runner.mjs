#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SUMMARY = "data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/phone-alpha-evidence-summary.json";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const requirePhoneAlphaCandidate = args.includes("--require-phone-alpha-candidate");
const summaryArg = args.find((arg) => !arg.startsWith("--")) || DEFAULT_SUMMARY;

const forbiddenKeys = [
  "stdout",
  "stderr",
  "rawOutput",
  "output",
  "logcat",
  "deviceSerial",
  "serial",
  "bluetoothName",
  "bluetoothAddress",
  "macAddress",
  "transcript",
  "speakerName",
  "speakerLabel",
  "embedding",
  "encryptedPayload",
];

const privateTextPatterns = [
  /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,
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
];

function usage() {
  return [
    "Usage: scripts/validate-phone-private-alpha-evidence-runner.mjs [summary-json] [--json] [--require-phone-alpha-candidate]",
    "",
    "Validates the phone-private-alpha evidence runner summary shape and privacy guardrails.",
    "Default summary path:",
    `  ${DEFAULT_SUMMARY}`,
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

function readJson(absolutePath, errors) {
  if (!fs.existsSync(absolutePath)) {
    errors.push(`Summary JSON does not exist: ${path.relative(ROOT_DIR, absolutePath)}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    errors.push(`Summary JSON parse failed: ${error.message}`);
    return null;
  }
}

function checkString(value, label, errors) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label} must be a non-empty string.`);
  }
}

function checkBoolean(value, label, errors) {
  if (typeof value !== "boolean") {
    errors.push(`${label} must be a boolean.`);
  }
}

function checkNumber(value, label, errors) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${label} must be a finite number.`);
  }
}

function checkWorkspacePath(value, label, errors) {
  checkString(value, label, errors);
  if (typeof value !== "string" || value.trim() === "") return;
  try {
    resolveInsideWorkspace(value);
  } catch (error) {
    errors.push(error.message);
  }
}

function walkObject(value, visitor, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkObject(item, visitor, [...pathParts, String(index)]));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      visitor(key, nested, [...pathParts, key]);
      walkObject(nested, visitor, [...pathParts, key]);
    }
  }
}

function validateNoForbiddenKeys(summary, errors) {
  walkObject(summary, (key, value, pathParts) => {
    if (forbiddenKeys.includes(key)) {
      errors.push(`Forbidden private/raw key present: ${pathParts.join(".")}`);
    }
    if (key === "rawOutputPersisted" && value !== false) {
      errors.push(`rawOutputPersisted must be false: ${pathParts.join(".")}`);
    }
  });
}

function validatePrivateText(summary, errors) {
  const text = JSON.stringify(summary);
  for (const pattern of privateTextPatterns) {
    if (pattern.test(text)) {
      errors.push(`Summary appears to contain private structured text matching ${pattern}.`);
    }
  }
}

function runDeviceEvidenceValidator(relativePath) {
  const result = spawnSync(process.execPath, [
    path.join(ROOT_DIR, "scripts/validate-device-evidence.mjs"),
    path.join(ROOT_DIR, relativePath),
    "--json",
  ], { cwd: ROOT_DIR, encoding: "utf8" });
  return {
    ok: result.status === 0,
    output: (result.stdout || result.stderr || "").trim(),
  };
}

function validateSummary(summary, errors, warnings) {
  checkString(summary.generatedAt, "generatedAt", errors);
  checkWorkspacePath(summary.reportDir, "reportDir", errors);
  checkWorkspacePath(summary.evidenceDir, "evidenceDir", errors);
  checkWorkspacePath(summary.deviceEvidencePath, "deviceEvidencePath", errors);
  checkWorkspacePath(summary.serviceReadinessAuditPath, "serviceReadinessAuditPath", errors);
  checkBoolean(summary.ok, "ok", errors);
  checkBoolean(summary.phonePrivateAlphaCandidate, "phonePrivateAlphaCandidate", errors);

  if (!summary.adb || typeof summary.adb !== "object") {
    errors.push("adb object is required.");
  } else {
    checkBoolean(summary.adb.adbExecutable, "adb.adbExecutable", errors);
    checkNumber(summary.adb.authorizedDeviceCount, "adb.authorizedDeviceCount", errors);
    checkNumber(summary.adb.unauthorizedDeviceCount, "adb.unauthorizedDeviceCount", errors);
    checkNumber(summary.adb.offlineDeviceCount, "adb.offlineDeviceCount", errors);
    checkNumber(summary.adb.otherDeviceCount, "adb.otherDeviceCount", errors);
  }

  if (!summary.flags || typeof summary.flags !== "object") {
    errors.push("flags object is required.");
  } else {
    checkBoolean(summary.flags.skipBuild, "flags.skipBuild", errors);
    checkBoolean(summary.flags.mainOnly, "flags.mainOnly", errors);
    checkBoolean(summary.flags.allowNoDevice, "flags.allowNoDevice", errors);
  }

  if (!Array.isArray(summary.commands) || summary.commands.length === 0) {
    errors.push("commands must be a non-empty array.");
  } else {
    for (const [index, command] of summary.commands.entries()) {
      checkString(command.label, `commands.${index}.label`, errors);
      if (!["pass", "fail", "skipped"].includes(command.status)) {
        errors.push(`commands.${index}.status has invalid value: ${command.status}`);
      }
      if (command.exitCode !== null && (typeof command.exitCode !== "number" || !Number.isFinite(command.exitCode))) {
        errors.push(`commands.${index}.exitCode must be null or a finite number.`);
      }
      checkString(command.startedAt, `commands.${index}.startedAt`, errors);
      checkString(command.endedAt, `commands.${index}.endedAt`, errors);
      checkString(command.command, `commands.${index}.command`, errors);
      if (command.rawOutputPersisted !== false) {
        errors.push(`commands.${index}.rawOutputPersisted must be false.`);
      }
    }
  }

  if (!summary.deviceEvidence || typeof summary.deviceEvidence !== "object") {
    errors.push("deviceEvidence object is required.");
  } else {
    checkBoolean(summary.deviceEvidence.exists, "deviceEvidence.exists", errors);
    checkBoolean(summary.deviceEvidence.validatorOk, "deviceEvidence.validatorOk", errors);
    if (
      summary.deviceEvidence.validatorExitCode !== null &&
      (typeof summary.deviceEvidence.validatorExitCode !== "number" || !Number.isFinite(summary.deviceEvidence.validatorExitCode))
    ) {
      errors.push("deviceEvidence.validatorExitCode must be null or a finite number.");
    }
  }

  if (!summary.directionEvidence || typeof summary.directionEvidence !== "object") {
    errors.push("directionEvidence object is required.");
  } else {
    checkBoolean(summary.directionEvidence.exists, "directionEvidence.exists", errors);
    checkBoolean(summary.directionEvidence.extractorOk, "directionEvidence.extractorOk", errors);
    checkBoolean(summary.directionEvidence.validatorOk, "directionEvidence.validatorOk", errors);
    checkBoolean(summary.directionEvidence.applyDryRunOk, "directionEvidence.applyDryRunOk", errors);
    checkBoolean(summary.directionEvidence.applyReady, "directionEvidence.applyReady", errors);
    checkBoolean(summary.directionEvidence.applyWroteManifest, "directionEvidence.applyWroteManifest", errors);
    checkBoolean(summary.directionEvidence.applyWroteAggregateEvidence, "directionEvidence.applyWroteAggregateEvidence", errors);
    checkBoolean(summary.directionEvidence.productionDirectionCandidate, "directionEvidence.productionDirectionCandidate", errors);
    if (
      summary.directionEvidence.extractorExitCode !== null &&
      (typeof summary.directionEvidence.extractorExitCode !== "number" || !Number.isFinite(summary.directionEvidence.extractorExitCode))
    ) {
      errors.push("directionEvidence.extractorExitCode must be null or a finite number.");
    }
    if (
      summary.directionEvidence.validatorExitCode !== null &&
      (typeof summary.directionEvidence.validatorExitCode !== "number" || !Number.isFinite(summary.directionEvidence.validatorExitCode))
    ) {
      errors.push("directionEvidence.validatorExitCode must be null or a finite number.");
    }
    if (
      summary.directionEvidence.applyDryRunExitCode !== null &&
      (typeof summary.directionEvidence.applyDryRunExitCode !== "number" || !Number.isFinite(summary.directionEvidence.applyDryRunExitCode))
    ) {
      errors.push("directionEvidence.applyDryRunExitCode must be null or a finite number.");
    }
    if (
      summary.directionEvidence.fixtureEvidence !== null &&
      typeof summary.directionEvidence.fixtureEvidence !== "boolean"
    ) {
      errors.push("directionEvidence.fixtureEvidence must be null or a boolean.");
    }
    if (
      summary.directionEvidence.totalTrials !== null &&
      (typeof summary.directionEvidence.totalTrials !== "number" || !Number.isFinite(summary.directionEvidence.totalTrials))
    ) {
      errors.push("directionEvidence.totalTrials must be null or a finite number.");
    }
    for (const key of ["reportDir", "summaryPath", "summaryMarkdownPath", "manifestUpdateTemplatePath", "canonicalManifestPath", "aggregateEvidencePath"]) {
      checkWorkspacePath(summary.directionEvidence[key], `directionEvidence.${key}`, errors);
    }
  }

  if (!Array.isArray(summary.nextActions) || summary.nextActions.length === 0) {
    errors.push("nextActions must be a non-empty array.");
  }

  const serviceAuditPath = typeof summary.serviceReadinessAuditPath === "string"
    ? path.join(ROOT_DIR, summary.serviceReadinessAuditPath)
    : "";
  if (serviceAuditPath && !fs.existsSync(serviceAuditPath)) {
    warnings.push(`Service readiness audit does not exist yet: ${summary.serviceReadinessAuditPath}`);
  }

  if (summary.flags?.allowNoDevice && summary.adb?.authorizedDeviceCount !== 1 && summary.phonePrivateAlphaCandidate) {
    errors.push("No-device dry run must not set phonePrivateAlphaCandidate=true.");
  }
  if (summary.flags?.allowNoDevice && summary.deviceEvidence?.exists === false && summary.deviceEvidence?.validatorOk) {
    errors.push("Missing deviceEvidence cannot have validatorOk=true.");
  }
  if (summary.flags?.allowNoDevice && summary.deviceEvidence?.exists === false && summary.directionEvidence?.exists === true) {
    errors.push("No-device dry run must not create directionEvidence.exists=true.");
  }
  if (summary.flags?.allowNoDevice && summary.deviceEvidence?.exists === false && summary.directionEvidence?.applyDryRunOk === true) {
    errors.push("No-device dry run must not run direction manifest apply dry-run.");
  }
  if (summary.directionEvidence?.applyWroteManifest) {
    errors.push("Phone runner must never write the canonical direction manifest.");
  }
  if (summary.directionEvidence?.applyWroteAggregateEvidence) {
    errors.push("Phone runner must never write canonical aggregate direction evidence.");
  }
  if (summary.deviceEvidence?.exists && !summary.directionEvidence?.exists) {
    errors.push("Existing deviceEvidence requires directionEvidence.exists=true.");
  }
  if (summary.deviceEvidence?.exists && !summary.directionEvidence?.validatorOk) {
    errors.push("Existing deviceEvidence requires directionEvidence.validatorOk=true.");
  }
  if (summary.deviceEvidence?.exists && !summary.directionEvidence?.applyDryRunOk) {
    errors.push("Existing deviceEvidence requires directionEvidence.applyDryRunOk=true.");
  }
  if (summary.directionEvidence?.applyReady && !summary.directionEvidence?.productionDirectionCandidate) {
    errors.push("directionEvidence.applyReady cannot be true unless productionDirectionCandidate=true.");
  }
  if (summary.directionEvidence?.productionDirectionCandidate && summary.directionEvidence?.fixtureEvidence === true) {
    errors.push("directionEvidence.productionDirectionCandidate cannot be true for fixture evidence.");
  }
  if (summary.phonePrivateAlphaCandidate) {
    if (summary.flags?.allowNoDevice) errors.push("phonePrivateAlphaCandidate cannot be true when allowNoDevice=true.");
    if (summary.adb?.authorizedDeviceCount !== 1) errors.push("phonePrivateAlphaCandidate requires exactly one authorized ADB device.");
    if (!summary.deviceEvidence?.exists) errors.push("phonePrivateAlphaCandidate requires deviceEvidence.exists=true.");
    if (!summary.deviceEvidence?.validatorOk) errors.push("phonePrivateAlphaCandidate requires deviceEvidence.validatorOk=true.");
    if (!summary.directionEvidence?.exists) errors.push("phonePrivateAlphaCandidate requires directionEvidence.exists=true.");
    if (!summary.directionEvidence?.validatorOk) errors.push("phonePrivateAlphaCandidate requires directionEvidence.validatorOk=true.");
    if (!summary.directionEvidence?.applyDryRunOk) errors.push("phonePrivateAlphaCandidate requires directionEvidence.applyDryRunOk=true.");
    if (summary.commands?.some((command) => command.status !== "pass")) {
      errors.push("phonePrivateAlphaCandidate requires every command status to be pass.");
    }
  }
  if (requirePhoneAlphaCandidate && !summary.phonePrivateAlphaCandidate) {
    errors.push("--require-phone-alpha-candidate was set, but phonePrivateAlphaCandidate is false.");
  }

  if (summary.deviceEvidence?.exists && typeof summary.deviceEvidencePath === "string") {
    const absoluteDeviceEvidence = path.join(ROOT_DIR, summary.deviceEvidencePath);
    if (!fs.existsSync(absoluteDeviceEvidence)) {
      errors.push(`deviceEvidence.exists=true but file is missing: ${summary.deviceEvidencePath}`);
    } else {
      const validator = runDeviceEvidenceValidator(summary.deviceEvidencePath);
      if (!validator.ok) {
        errors.push(`deviceEvidence validator failed: ${validator.output}`);
      }
    }
  }

  if (summary.directionEvidence?.exists && typeof summary.directionEvidence.summaryPath === "string") {
    const absoluteSummary = path.join(ROOT_DIR, summary.directionEvidence.summaryPath);
    if (!fs.existsSync(absoluteSummary)) {
      errors.push(`directionEvidence.exists=true but summary file is missing: ${summary.directionEvidence.summaryPath}`);
    }
  }
}

const errors = [];
const warnings = [];
let summaryPath = "";
let summary = null;

try {
  const resolved = resolveInsideWorkspace(summaryArg);
  summaryPath = resolved.relative;
  summary = readJson(resolved.absolute, errors);
} catch (error) {
  errors.push(error.message);
}

if (summary) {
  validateNoForbiddenKeys(summary, errors);
  validatePrivateText(summary, errors);
  validateSummary(summary, errors, warnings);
}

const result = {
  ok: errors.length === 0,
  summaryPath,
  phonePrivateAlphaCandidate: summary?.phonePrivateAlphaCandidate === true,
  noDeviceDryRun: summary?.flags?.allowNoDevice === true && summary?.adb?.authorizedDeviceCount !== 1,
  warnings,
  errors,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Phone private alpha evidence runner summary valid: ${summaryPath}`);
  if (warnings.length > 0) {
    console.log(`Warnings: ${warnings.join("; ")}`);
  }
} else {
  console.error(`Phone private alpha evidence runner summary invalid: ${summaryPath}`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
}

process.exit(result.ok ? 0 : 1);
