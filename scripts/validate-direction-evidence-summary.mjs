#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SUMMARY = "data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const requireProductionDirectionCandidate = args.includes("--require-production-direction-candidate");
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
  "callerName",
  "callerLabel",
  "profileName",
  "profileLabel",
  "embedding",
  "encryptedPayload",
  "audioBytes",
  "pcmBytes",
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
    "Usage: scripts/validate-direction-evidence-summary.mjs [summary-json] [--json] [--require-production-direction-candidate]",
    "",
    "Validates the extracted non-PII direction evidence summary.",
    "Default mode allows fixture/workflow evidence but rejects private data and accidental production claims.",
    "Strict mode fails until productionDirectionCandidate=true and all controlled evidence thresholds pass.",
    "",
    `Default summary: ${DEFAULT_SUMMARY}`,
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

function checkNumberOrNull(value, label, errors) {
  if (value !== null && (typeof value !== "number" || !Number.isFinite(value))) {
    errors.push(`${label} must be null or a finite number.`);
  }
}

function checkWorkspacePath(value, label, errors, mustExist = false) {
  checkString(value, label, errors);
  if (typeof value !== "string" || value.trim() === "") return;
  try {
    const resolved = resolveInsideWorkspace(value);
    if (mustExist && !fs.existsSync(resolved.absolute)) {
      errors.push(`${label} does not exist: ${resolved.relative}`);
    }
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

function rate(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return Number((numerator / denominator).toFixed(4));
}

function equalRates(actual, expected) {
  if (actual === null && expected === null) return true;
  if (typeof actual !== "number" || typeof expected !== "number") return false;
  return Math.abs(actual - expected) < 0.0001;
}

function validateCounts(summary, errors) {
  if (!summary.directionTrialCounts || typeof summary.directionTrialCounts !== "object") {
    errors.push("directionTrialCounts object is required.");
    return;
  }
  for (const direction of ["front", "back", "left", "right"]) {
    const counts = summary.directionTrialCounts[direction];
    if (!counts || typeof counts !== "object") {
      errors.push(`directionTrialCounts.${direction} is required.`);
      continue;
    }
    for (const key of ["trials", "matched", "mismatched", "unknownOrUnusable"]) {
      checkNumber(counts[key], `directionTrialCounts.${direction}.${key}`, errors);
      if (typeof counts[key] === "number" && counts[key] < 0) {
        errors.push(`directionTrialCounts.${direction}.${key} must be >= 0.`);
      }
    }
    const componentTotal = counts.matched + counts.mismatched + counts.unknownOrUnusable;
    if (counts.trials !== componentTotal) {
      errors.push(`directionTrialCounts.${direction}.trials must equal matched + mismatched + unknownOrUnusable.`);
    }
  }
}

function validateAggregate(summary, errors) {
  const aggregate = summary.aggregateEvaluation;
  if (!aggregate || typeof aggregate !== "object") {
    errors.push("aggregateEvaluation object is required.");
    return;
  }
  for (const key of [
    "totalTrials",
    "matched",
    "mismatched",
    "unknownOrUnusable",
    "frontTrials",
    "backTrials",
    "leftTrials",
    "rightTrials",
  ]) {
    checkNumber(aggregate[key], `aggregateEvaluation.${key}`, errors);
  }
  for (const key of [
    "allDirectionMatchRate",
    "frontBackMatchRate",
    "leftRightMatchRate",
    "falseDirectionRate",
    "unknownOrUnusableRate",
    "p95DirectionLatencyMillis",
    "latestProcessingLatencyMillis",
    "averageProcessingLatencyMillis",
  ]) {
    checkNumberOrNull(aggregate[key], `aggregateEvaluation.${key}`, errors);
  }
  checkBoolean(aggregate.confidenceBucketed, "aggregateEvaluation.confidenceBucketed", errors);
  if (!aggregate.targetProgress || typeof aggregate.targetProgress !== "object") {
    errors.push("aggregateEvaluation.targetProgress object is required.");
  }

  const counts = summary.directionTrialCounts ?? {};
  const totalTrials = ["front", "back", "left", "right"].reduce((sum, direction) => sum + (counts[direction]?.trials ?? 0), 0);
  const matched = ["front", "back", "left", "right"].reduce((sum, direction) => sum + (counts[direction]?.matched ?? 0), 0);
  const mismatched = ["front", "back", "left", "right"].reduce((sum, direction) => sum + (counts[direction]?.mismatched ?? 0), 0);
  const unknownOrUnusable = ["front", "back", "left", "right"].reduce((sum, direction) => sum + (counts[direction]?.unknownOrUnusable ?? 0), 0);

  if (aggregate.totalTrials !== totalTrials) errors.push("aggregateEvaluation.totalTrials must equal summed per-direction trials.");
  if (aggregate.matched !== matched) errors.push("aggregateEvaluation.matched must equal summed per-direction matched counts.");
  if (aggregate.mismatched !== mismatched) errors.push("aggregateEvaluation.mismatched must equal summed per-direction mismatched counts.");
  if (aggregate.unknownOrUnusable !== unknownOrUnusable) errors.push("aggregateEvaluation.unknownOrUnusable must equal summed per-direction unknown/unusable counts.");

  const frontBackTrials = (counts.front?.trials ?? 0) + (counts.back?.trials ?? 0);
  const frontBackMatched = (counts.front?.matched ?? 0) + (counts.back?.matched ?? 0);
  const leftRightTrials = (counts.left?.trials ?? 0) + (counts.right?.trials ?? 0);
  const leftRightMatched = (counts.left?.matched ?? 0) + (counts.right?.matched ?? 0);

  const expectedRates = {
    allDirectionMatchRate: rate(matched, totalTrials),
    frontBackMatchRate: rate(frontBackMatched, frontBackTrials),
    leftRightMatchRate: rate(leftRightMatched, leftRightTrials),
    falseDirectionRate: rate(mismatched, totalTrials),
    unknownOrUnusableRate: rate(unknownOrUnusable, totalTrials),
  };
  for (const [key, expected] of Object.entries(expectedRates)) {
    if (!equalRates(aggregate[key], expected)) {
      errors.push(`aggregateEvaluation.${key} must equal ${expected}.`);
    }
  }
}

function validateTargetProgress(summary, errors) {
  const target = summary.targetProgress;
  if (!target || typeof target !== "object") {
    errors.push("targetProgress object is required.");
    return;
  }
  for (const key of ["requiredTrialsPerDirection", "requiredTotalTrials", "missingTotalTrials"]) {
    checkNumber(target[key], `targetProgress.${key}`, errors);
    if (typeof target[key] === "number" && target[key] < 0) {
      errors.push(`targetProgress.${key} must be >= 0.`);
    }
  }
  checkBoolean(target.controlledTrialTargetComplete, "targetProgress.controlledTrialTargetComplete", errors);
  if (target.requiredTotalTrials !== target.requiredTrialsPerDirection * 4) {
    errors.push("targetProgress.requiredTotalTrials must equal requiredTrialsPerDirection * 4.");
  }
  if (!target.missingByDirection || typeof target.missingByDirection !== "object") {
    errors.push("targetProgress.missingByDirection object is required.");
    return;
  }
  const counts = summary.directionTrialCounts ?? {};
  let computedMissingTotal = 0;
  for (const direction of ["front", "back", "left", "right"]) {
    const value = target.missingByDirection[direction];
    checkNumber(value, `targetProgress.missingByDirection.${direction}`, errors);
    if (typeof value === "number" && value < 0) {
      errors.push(`targetProgress.missingByDirection.${direction} must be >= 0.`);
    }
    const expectedMissing = Math.max(target.requiredTrialsPerDirection - (counts[direction]?.trials ?? 0), 0);
    if (value !== expectedMissing) {
      errors.push(`targetProgress.missingByDirection.${direction} must equal ${expectedMissing}.`);
    }
    computedMissingTotal += expectedMissing;
  }
  if (target.missingTotalTrials !== computedMissingTotal) {
    errors.push(`targetProgress.missingTotalTrials must equal ${computedMissingTotal}.`);
  }
  const expectedComplete = computedMissingTotal === 0;
  if (target.controlledTrialTargetComplete !== expectedComplete) {
    errors.push(`targetProgress.controlledTrialTargetComplete must equal ${expectedComplete}.`);
  }
  if (summary.aggregateEvaluation?.targetProgress) {
    const aggregateTarget = JSON.stringify(summary.aggregateEvaluation.targetProgress);
    const summaryTarget = JSON.stringify(target);
    if (aggregateTarget !== summaryTarget) {
      errors.push("aggregateEvaluation.targetProgress must mirror targetProgress.");
    }
  }
}

function validateThresholds(summary, errors) {
  const thresholds = summary.thresholds;
  if (!thresholds || typeof thresholds !== "object") {
    errors.push("thresholds object is required.");
    return;
  }
  for (const key of [
    "totalTrialsMet",
    "frontTrialsMet",
    "backTrialsMet",
    "leftTrialsMet",
    "rightTrialsMet",
    "controlledTargetProgressMet",
    "allDirectionMatchRateMet",
    "frontBackMatchRateMet",
    "leftRightMatchRateMet",
    "falseDirectionRateMet",
    "unknownOrUnusableRateMet",
    "p95LatencyMet",
    "confidenceBucketed",
    "microphoneMetadataMet",
    "phoneControlledEvidence",
    "wearableRouteWithControlledEvidence",
    "privacyMet",
  ]) {
    checkBoolean(thresholds[key], `thresholds.${key}`, errors);
  }
}

function validateManifestTemplate(summary, errors) {
  const template = summary.manifestUpdateTemplate;
  if (!template || typeof template !== "object") {
    errors.push("manifestUpdateTemplate object is required.");
    return;
  }
  if (template.packageName !== "com.voicedirection.glass") errors.push("manifestUpdateTemplate.packageName must be com.voicedirection.glass.");
  if (template.externalSubmission !== "not_performed") errors.push("manifestUpdateTemplate.externalSubmission must be not_performed.");
  if (!summary.productionDirectionCandidate) {
    if (template.status !== "DRAFT_DIRECTION_EVIDENCE_NOT_COLLECTED") {
      errors.push("Non-candidate manifest template must stay in DRAFT_DIRECTION_EVIDENCE_NOT_COLLECTED.");
    }
    if (template.currentAlgorithm?.claimLevel !== "LEFT_RIGHT_REFERENCE_ONLY") {
      errors.push("Non-candidate manifest template must keep LEFT_RIGHT_REFERENCE_ONLY.");
    }
    if (template.currentAlgorithm?.frontBackClaim !== "blocked") {
      errors.push("Non-candidate manifest template must keep frontBackClaim blocked.");
    }
    if (template.aggregateEvaluation?.evidenceFile !== null) {
      errors.push("Non-candidate manifest template must keep aggregateEvaluation.evidenceFile=null.");
    }
  }
  for (const key of ["rawAudioPersisted", "pcmPersisted", "transcriptsInEvidence", "rawEmbeddingValuesInEvidence", "speakerNamesInEvidence"]) {
    if (template.privacy?.[key] !== false) {
      errors.push(`manifestUpdateTemplate.privacy.${key} must be false.`);
    }
  }
  if (template.privacy?.localOnly !== true) errors.push("manifestUpdateTemplate.privacy.localOnly must be true.");
}

function validateSummary(summary, errors, warnings) {
  if (summary.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
  checkString(summary.generatedAt, "generatedAt", errors);
  checkWorkspacePath(summary.reportDir, "reportDir", errors, true);
  checkWorkspacePath(summary.sourceEvidencePath, "sourceEvidencePath", errors, true);
  checkString(summary.sourceEvidenceSha256, "sourceEvidenceSha256", errors);
  checkBoolean(summary.fixtureEvidence, "fixtureEvidence", errors);
  checkBoolean(summary.productionDirectionCandidate, "productionDirectionCandidate", errors);

  if (!summary.directionSample || typeof summary.directionSample !== "object") {
    errors.push("directionSample object is required.");
  } else {
    checkBoolean(summary.directionSample.present, "directionSample.present", errors);
    checkNumber(summary.directionSample.availableMicrophoneCount, "directionSample.availableMicrophoneCount", errors);
    checkNumber(summary.directionSample.availablePositionKnownCount, "directionSample.availablePositionKnownCount", errors);
    checkNumber(summary.directionSample.availableOrientationKnownCount, "directionSample.availableOrientationKnownCount", errors);
    checkBoolean(summary.directionSample.microphoneInventoryCaptured, "directionSample.microphoneInventoryCaptured", errors);
    checkBoolean(summary.directionSample.activeMicrophoneCaptured, "directionSample.activeMicrophoneCaptured", errors);
    checkNumber(summary.directionSample.activeMicrophoneCount, "directionSample.activeMicrophoneCount", errors);
    checkNumber(summary.directionSample.activeChannelMappingCount, "directionSample.activeChannelMappingCount", errors);
  }

  if (!summary.microphoneMetadata || typeof summary.microphoneMetadata !== "object") {
    errors.push("microphoneMetadata object is required.");
  } else {
    for (const key of ["inventoryCaptured", "activeMicrophonesCaptured", "channelMappingCaptured", "hardwarePoseOrMountingDocumented"]) {
      checkBoolean(summary.microphoneMetadata[key], `microphoneMetadata.${key}`, errors);
    }
  }

  if (!summary.privacy || typeof summary.privacy !== "object") {
    errors.push("privacy object is required.");
  } else {
    for (const key of ["rawAudioPersisted", "pcmPersisted", "transcriptsInEvidence", "rawEmbeddingValuesInEvidence", "speakerNamesInEvidence", "rawOutputPersisted"]) {
      if (summary.privacy[key] !== false) errors.push(`privacy.${key} must be false.`);
    }
    if (summary.privacy.localOnly !== true) errors.push("privacy.localOnly must be true.");
  }

  validateCounts(summary, errors);
  validateAggregate(summary, errors);
  validateTargetProgress(summary, errors);
  validateThresholds(summary, errors);
  validateManifestTemplate(summary, errors);
  validateNoForbiddenKeys(summary, errors);
  validatePrivateText(summary, errors);

  if (summary.fixtureEvidence && summary.productionDirectionCandidate) {
    errors.push("Fixture evidence must not set productionDirectionCandidate=true.");
  }
  if (summary.productionDirectionCandidate) {
    if (summary.fixtureEvidence) errors.push("productionDirectionCandidate requires non-fixture evidence.");
    if (!summary.thresholds || Object.values(summary.thresholds).some((value) => value !== true)) {
      errors.push("productionDirectionCandidate requires all thresholds to be true.");
    }
    if (summary.manifestUpdateTemplate?.status !== "DIRECTION_EVIDENCE_EVALUATED") {
      errors.push("Candidate manifest template must set DIRECTION_EVIDENCE_EVALUATED.");
    }
    if (summary.manifestUpdateTemplate?.currentAlgorithm?.claimLevel !== "FOUR_DIRECTION_CONTROLLED_EVIDENCE") {
      errors.push("Candidate manifest template must set FOUR_DIRECTION_CONTROLLED_EVIDENCE.");
    }
  } else {
    warnings.push("Summary is workflow evidence only; productionDirectionCandidate=false.");
  }

  if (requireProductionDirectionCandidate && !summary.productionDirectionCandidate) {
    errors.push("--require-production-direction-candidate was set, but productionDirectionCandidate is false.");
  }
}

const errors = [];
const warnings = [];
let summaryPath = null;
let summary = null;

try {
  summaryPath = resolveInsideWorkspace(summaryArg);
  summary = readJson(summaryPath.absolute, errors);
  if (summary) validateSummary(summary, errors, warnings);
} catch (error) {
  errors.push(error.message);
}

const result = {
  ok: errors.length === 0,
  summaryPath: summaryPath?.relative ?? summaryArg,
  requireProductionDirectionCandidate,
  productionDirectionCandidate: summary?.productionDirectionCandidate === true,
  fixtureEvidence: summary?.fixtureEvidence === true,
  totalTrials: summary?.aggregateEvaluation?.totalTrials ?? null,
  warnings,
  errors,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Direction evidence summary validation passed: ${result.summaryPath}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Direction evidence summary validation failed: ${result.summaryPath}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
