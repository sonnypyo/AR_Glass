#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const requireDrillsReady = args.includes("--require-drills-ready");
const manifestDirArg = args.find((arg) => !arg.startsWith("--")) || "apps/voice-direction-glass/support-drills";

const docPath = "docs/23-support-drill-evidence.md";
const requiredSections = [
  "Purpose",
  "Current App State",
  "Drill Evidence Manifest",
  "Allowed Evidence Fields",
  "Privacy Guardrails",
  "Deletion Verification Drill",
  "Mistaken-Alert Incident Drill",
  "Strict Validation",
  "Release Gate",
  "Trial/Error Notes",
];
const requiredMarkers = [
  "Support drill evidence status: DRAFT_DRILLS_NOT_RUN",
  "apps/voice-direction-glass/support-drills/manifest.json",
  "DRAFT_SUPPORT_DRILLS_NOT_RUN",
  "support-incident-process` release item remains `MANUAL_REQUIRED`",
  "node scripts/validate-support-drill-evidence.mjs --json",
  "node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json",
  "deletion verification drill",
  "mistaken-alert incident drill",
  "raw audio",
  "transcripts",
  "speaker names",
  "Voice embedding values",
  "Bluetooth product names",
];
const prohibitedClaims = [
  "Support drill evidence status: READY",
  "production support ready",
  "deletion drill passed",
  "mistaken-alert drill passed",
  "external submission performed",
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
const allowedDeletionStatuses = new Set(["not_run", "passed", "failed"]);
const allowedIncidentStatuses = new Set(["not_run", "passed", "failed"]);
const allowedSupportChannelStatuses = new Set(["not_configured", "configured"]);
const allowedSeverities = new Set(["S0", "S1", "S2", "S3"]);
const allowedIncidentTypes = new Set(["false_positive", "wrong_speaker", "wrong_direction", "missed_alert", "output_failure", "unsafe_distraction"]);
const allowedDirections = new Set(["", "left", "right", "front", "back", "unknown"]);
const allowedConfidenceBuckets = new Set(["", "high", "medium", "low", "unknown"]);

function usage() {
  return [
    "Usage: scripts/validate-support-drill-evidence.mjs [manifest-dir] [--json] [--require-drills-ready]",
    "",
    "Validates support drill runbook and manifest evidence.",
    "Default mode validates the draft and may pass while drills are not run.",
    "--require-drills-ready fails until support channel, deletion drill, mistaken-alert drill, and evidence paths are complete.",
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

function booleanValue(value) {
  return typeof value === "boolean" ? value : null;
}

function numberOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function evidencePathToAbsolute(manifestDirAbsolute, evidencePath) {
  if (!evidencePath) return null;
  if (path.isAbsolute(evidencePath) || String(evidencePath).includes("..")) {
    return { error: "Evidence paths must be workspace-relative or manifest-directory-relative without '..'." };
  }
  const workspaceRelative = path.join(ROOT_DIR, evidencePath);
  if (fs.existsSync(workspaceRelative)) return { absolute: workspaceRelative };
  return { absolute: path.join(manifestDirAbsolute, evidencePath) };
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

function checkEvidenceFile(relativeOrAbsolutePath, label, errors, warnings) {
  if (!relativeOrAbsolutePath) {
    errors.push(`${label} evidencePath is required in strict mode.`);
    return;
  }
  const absolute = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(ROOT_DIR, relativeOrAbsolutePath);
  const relative = path.relative(ROOT_DIR, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    errors.push(`${label} evidencePath must stay inside the workspace.`);
    return;
  }
  if (!fs.existsSync(absolute)) {
    errors.push(`${label} evidence file does not exist: ${relative}`);
    return;
  }
  const text = fs.readFileSync(absolute, "utf8");
  const privatePatterns = [
    /embedding:v1:/i,
    /enc:v\d+:/i,
    /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,
    /\braw\s*audio\b/i,
    /\bpcm\s*buffer\b/i,
    /\btranscript\s*:/i,
    /\bspeaker\s*name\s*:/i,
    /\bcontact\s*name\s*:/i,
    /\bprivate\s*location\s*:/i,
  ];
  for (const pattern of privatePatterns) {
    if (pattern.test(text)) {
      errors.push(`${label} evidence file appears to contain private or raw evidence matching ${pattern}.`);
    }
  }
  if (!/pass|passed|fail|failed|status/i.test(text)) {
    warnings.push(`${label} evidence file should record pass/fail/status fields.`);
  }
}

const errors = [];
const warnings = [];
const { absolute: manifestDirAbsolute, relative: manifestDirRelative } = resolveInsideWorkspace(manifestDirArg);
const docAbsolute = path.join(ROOT_DIR, docPath);

if (!fs.existsSync(docAbsolute)) {
  errors.push(`Missing support drill evidence doc: ${docPath}`);
} else {
  const markdown = fs.readFileSync(docAbsolute, "utf8");
  if (!markdown.startsWith("# Support Drill Evidence")) {
    errors.push("Document must start with '# Support Drill Evidence'.");
  }
  for (const section of requiredSections) {
    if (!hasSection(markdown, section)) errors.push(`Missing required section: ${section}`);
  }
  for (const marker of requiredMarkers) {
    if (!markdown.includes(marker)) errors.push(`Missing required marker: ${marker}`);
  }
  for (const claim of prohibitedClaims) {
    if (markdown.toLowerCase().includes(claim.toLowerCase())) {
      errors.push(`Document must not claim completed support drill readiness: ${claim}`);
    }
  }
}

const manifestPath = path.join(manifestDirAbsolute, "manifest.json");
let manifest = null;
if (!fs.existsSync(manifestPath)) {
  errors.push(`Missing support drill manifest: ${path.join(manifestDirRelative, "manifest.json")}`);
} else {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    errors.push(`Manifest JSON parse failed: ${error.message}`);
  }
}

if (manifest) {
  if (manifest.schemaVersion !== 1) errors.push(`Unexpected schemaVersion: ${manifest.schemaVersion}`);
  if (manifest.packageName !== "com.voicedirection.glass") errors.push(`Unexpected packageName: ${manifest.packageName}`);
  if (manifest.externalSubmission !== "not_performed") errors.push("Manifest externalSubmission must be not_performed.");
  if (manifest.status !== "DRAFT_SUPPORT_DRILLS_NOT_RUN" && !requireDrillsReady) {
    warnings.push(`Manifest status is ${manifest.status}; default validation expects a draft unless strict mode is used.`);
  }
  if (!allowedSupportChannelStatuses.has(manifest.supportChannel?.status)) {
    errors.push(`Unexpected supportChannel.status: ${manifest.supportChannel?.status}`);
  }
  if (!allowedDeletionStatuses.has(manifest.deletionDrill?.status)) {
    errors.push(`Unexpected deletionDrill.status: ${manifest.deletionDrill?.status}`);
  }
  if (!allowedIncidentStatuses.has(manifest.mistakenAlertDrill?.status)) {
    errors.push(`Unexpected mistakenAlertDrill.status: ${manifest.mistakenAlertDrill?.status}`);
  }
  if (!allowedDirections.has(manifest.mistakenAlertDrill?.expectedDirection ?? "")) {
    errors.push(`Unexpected mistakenAlertDrill.expectedDirection: ${manifest.mistakenAlertDrill?.expectedDirection}`);
  }
  if (!allowedDirections.has(manifest.mistakenAlertDrill?.observedDirection ?? "")) {
    errors.push(`Unexpected mistakenAlertDrill.observedDirection: ${manifest.mistakenAlertDrill?.observedDirection}`);
  }
  if (!allowedConfidenceBuckets.has(manifest.mistakenAlertDrill?.confidenceBucket ?? "")) {
    errors.push(`Unexpected mistakenAlertDrill.confidenceBucket: ${manifest.mistakenAlertDrill?.confidenceBucket}`);
  }
  for (const field of privacyFalseFields) {
    if (manifest.privacy?.[field] !== false) {
      errors.push(`Manifest privacy.${field} must be false.`);
    }
  }

  const stringValues = collectStringValues(manifest);
  const privateValuePatterns = [
    /embedding:v1:/i,
    /enc:v\d+:/i,
    /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,
  ];
  for (const value of stringValues) {
    for (const pattern of privateValuePatterns) {
      if (pattern.test(value)) {
        errors.push(`Manifest contains private structured value matching ${pattern}.`);
      }
    }
  }

  const deletionPathResult = evidencePathToAbsolute(manifestDirAbsolute, manifest.deletionDrill?.evidencePath ?? "");
  const incidentPathResult = evidencePathToAbsolute(manifestDirAbsolute, manifest.mistakenAlertDrill?.evidencePath ?? "");
  if (deletionPathResult?.error) errors.push(`deletionDrill: ${deletionPathResult.error}`);
  if (incidentPathResult?.error) errors.push(`mistakenAlertDrill: ${incidentPathResult.error}`);

  if (requireDrillsReady) {
    if (manifest.status !== "SUPPORT_DRILLS_PASSED") errors.push("Strict mode requires status SUPPORT_DRILLS_PASSED.");
    if (manifest.supportChannel?.status !== "configured") errors.push("Strict mode requires supportChannel.status configured.");
    if (booleanValue(manifest.supportChannel?.publicContactConfigured) !== true) errors.push("Strict mode requires publicContactConfigured=true.");
    if (booleanValue(manifest.supportChannel?.privacyPolicyContactConfigured) !== true) errors.push("Strict mode requires privacyPolicyContactConfigured=true.");

    const deletion = manifest.deletionDrill ?? {};
    if (deletion.status !== "passed") errors.push("Strict mode requires deletionDrill.status passed.");
    if (!deletion.executedAt) errors.push("Strict mode requires deletionDrill.executedAt.");
    if (booleanValue(deletion.verifiedLocalDelete) !== true) errors.push("Strict mode requires verifiedLocalDelete=true.");
    if (booleanValue(deletion.appRestartVerified) !== true) errors.push("Strict mode requires appRestartVerified=true.");
    if (numberOrNull(deletion.postDeleteProfileCount) !== 0) errors.push("Strict mode requires postDeleteProfileCount=0.");
    if (numberOrNull(deletion.postDeleteEventCount) !== 0) errors.push("Strict mode requires postDeleteEventCount=0.");
    if (numberOrNull(deletion.postDeleteFeedbackCount) !== 0) errors.push("Strict mode requires postDeleteFeedbackCount=0.");
    if (numberOrNull(deletion.postDeleteDirectionValidationCount) !== 0) errors.push("Strict mode requires postDeleteDirectionValidationCount=0.");
    if (booleanValue(deletion.postDeleteLatestCuePresent) !== false) errors.push("Strict mode requires postDeleteLatestCuePresent=false.");
    if (booleanValue(deletion.postDeleteLatestDeliveryPresent) !== false) errors.push("Strict mode requires postDeleteLatestDeliveryPresent=false.");
    if (booleanValue(deletion.postDeleteSettingsReset) !== true) errors.push("Strict mode requires postDeleteSettingsReset=true.");

    const incident = manifest.mistakenAlertDrill ?? {};
    if (incident.status !== "passed") errors.push("Strict mode requires mistakenAlertDrill.status passed.");
    if (!incident.executedAt) errors.push("Strict mode requires mistakenAlertDrill.executedAt.");
    if (!allowedSeverities.has(incident.severity)) errors.push("Strict mode requires mistakenAlertDrill.severity S0/S1/S2/S3.");
    if (!allowedIncidentTypes.has(incident.primaryType)) errors.push("Strict mode requires a valid mistakenAlertDrill.primaryType.");
    if (booleanValue(incident.severityReviewed) !== true) errors.push("Strict mode requires severityReviewed=true.");
    if (booleanValue(incident.feedbackRecorded) !== true) errors.push("Strict mode requires feedbackRecorded=true.");
    if (booleanValue(incident.followUpActionRecorded) !== true) errors.push("Strict mode requires followUpActionRecorded=true.");
    if (booleanValue(incident.retestRequirementRecorded) !== true) errors.push("Strict mode requires retestRequirementRecorded=true.");
    if (booleanValue(incident.privateDataRedacted) !== true) errors.push("Strict mode requires privateDataRedacted=true.");
    if (booleanValue(manifest.serviceReadinessAuditRegenerated) !== true) errors.push("Strict mode requires serviceReadinessAuditRegenerated=true.");

    checkEvidenceFile(manifest.deletionDrill?.evidencePath ?? "", "Deletion drill", errors, warnings);
    checkEvidenceFile(manifest.mistakenAlertDrill?.evidencePath ?? "", "Mistaken-alert drill", errors, warnings);
  } else {
    if (manifest.deletionDrill?.status === "not_run") warnings.push("Deletion verification drill has not been run.");
    if (manifest.mistakenAlertDrill?.status === "not_run") warnings.push("Mistaken-alert incident drill has not been run.");
  }
}

const result = {
  ok: errors.length === 0,
  manifestDir: manifestDirRelative,
  requireDrillsReady,
  warnings,
  errors,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Support drill evidence validation passed: ${manifestDirRelative}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Support drill evidence validation failed: ${manifestDirRelative}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
