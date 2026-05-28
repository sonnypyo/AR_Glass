#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const requireProductionDirectionReady = args.includes("--require-production-direction-ready");
const manifestDirArg = args.find((arg) => !arg.startsWith("--")) || "apps/voice-direction-glass/direction-evidence";

const docPath = "docs/22-direction-accuracy-evidence.md";
const requiredSections = [
  "Purpose",
  "Official Source Snapshot",
  "Current App State",
  "Direction Evidence Manifest",
  "Evaluation Protocol",
  "Minimum Promotion Criteria",
  "Hardware Evidence Matrix",
  "Integration Contract",
  "Validation Command",
  "Release Gate",
  "Trial/Error Notes",
];
const requiredMarkers = [
  "Direction evidence status: NOT_COLLECTED",
  "Production direction claim: BLOCKED",
  "External submission: not performed",
  "apps/voice-direction-glass/direction-evidence/manifest.json",
  "DRAFT_DIRECTION_EVIDENCE_NOT_COLLECTED",
  "LEFT_RIGHT_REFERENCE_ONLY",
  "node scripts/validate-direction-accuracy-evidence.mjs --json",
  "node scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json",
  "front-back-direction-evidence` remains `BLOCKED`",
  "raw audio, PCM, transcripts, or raw embedding vectors",
  "Bluetooth HFP",
  "projected context",
];
const requiredUrls = [
  "https://developer.android.com/reference/android/media/MicrophoneInfo",
  "https://developer.android.com/reference/android/media/AudioManager.html#getMicrophones()",
  "https://developer.android.google.cn/reference/android/media/AudioRecord#getActiveMicrophones()",
  "https://developer.android.com/develop/xr/jetpack-xr-sdk/access-hardware-projected-context",
  "https://github.com/facebook/meta-wearables-dat-android",
  "https://wearables.developer.meta.com/docs/develop",
];
const prohibitedClaims = [
  "Direction evidence status: READY",
  "Production direction claim: READY",
  "front/back direction ready",
  "guaranteed caller location",
  "guaranteed caller direction",
  "glasses direction proven",
  "external submission performed",
];

function usage() {
  return [
    "Usage: scripts/validate-direction-accuracy-evidence.mjs [manifest-dir] [--json] [--require-production-direction-ready]",
    "",
    "Validates the direction accuracy evidence plan and manifest.",
    "Default mode validates the draft and may pass while no controlled hardware evidence exists.",
    "--require-production-direction-ready fails until controlled four-direction trials, microphone metadata, route proof, latency, and privacy evidence exist.",
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

function numberOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanValue(value) {
  return typeof value === "boolean" ? value : null;
}

const errors = [];
const warnings = [];
const { absolute: manifestDirAbsolute, relative: manifestDirRelative } = resolveInsideWorkspace(manifestDirArg);
const docAbsolute = path.join(ROOT_DIR, docPath);

if (!fs.existsSync(docAbsolute)) {
  errors.push(`Missing direction accuracy evidence doc: ${docPath}`);
} else {
  const markdown = fs.readFileSync(docAbsolute, "utf8");
  if (!markdown.startsWith("# Direction Accuracy Evidence")) {
    errors.push("Document must start with '# Direction Accuracy Evidence'.");
  }
  for (const section of requiredSections) {
    if (!hasSection(markdown, section)) errors.push(`Missing required section: ${section}`);
  }
  for (const marker of requiredMarkers) {
    if (!markdown.includes(marker)) errors.push(`Missing required marker: ${marker}`);
  }
  for (const url of requiredUrls) {
    if (!markdown.includes(url)) errors.push(`Missing official source URL: ${url}`);
  }
  for (const claim of prohibitedClaims) {
    if (markdown.toLowerCase().includes(claim.toLowerCase())) {
      errors.push(`Document must not claim completed direction readiness: ${claim}`);
    }
  }
}

const manifestPath = path.join(manifestDirAbsolute, "manifest.json");
let manifest = null;
if (!fs.existsSync(manifestPath)) {
  errors.push(`Missing direction evidence manifest: ${path.join(manifestDirRelative, "manifest.json")}`);
} else {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    errors.push(`Manifest JSON parse failed: ${error.message}`);
  }
}

let aggregateEvidenceFile = null;
if (manifest) {
  if (manifest.packageName !== "com.voicedirection.glass") errors.push(`Unexpected packageName: ${manifest.packageName}`);
  if (manifest.status !== "DRAFT_DIRECTION_EVIDENCE_NOT_COLLECTED" && !requireProductionDirectionReady) {
    warnings.push(`Manifest status is ${manifest.status}; default validation expects a draft unless strict mode is used.`);
  }
  if (manifest.externalSubmission !== "not_performed") errors.push("Manifest externalSubmission must be not_performed.");
  if (manifest.privacy?.rawAudioPersisted !== false) errors.push("Manifest must keep rawAudioPersisted=false.");
  if (manifest.privacy?.pcmPersisted !== false) errors.push("Manifest must keep pcmPersisted=false.");
  if (manifest.privacy?.transcriptsInEvidence !== false) errors.push("Manifest must keep transcriptsInEvidence=false.");
  if (manifest.privacy?.rawEmbeddingValuesInEvidence !== false) errors.push("Manifest must keep rawEmbeddingValuesInEvidence=false.");
  if (manifest.privacy?.speakerNamesInEvidence !== false) errors.push("Manifest must keep speakerNamesInEvidence=false.");
  if (manifest.privacy?.localOnly !== true) errors.push("Manifest must keep localOnly=true until a backend is explicitly designed.");

  if (!manifest.currentAlgorithm?.id) errors.push("Manifest currentAlgorithm.id is required.");
  if (manifest.currentAlgorithm?.claimLevel === "FOUR_DIRECTION_PRODUCTION_READY" && !requireProductionDirectionReady) {
    errors.push("Default manifest must not claim production four-direction readiness.");
  }

  const evidenceFile = manifest.aggregateEvaluation?.evidenceFile;
  if (evidenceFile) {
    if (String(evidenceFile).includes("..") || path.isAbsolute(String(evidenceFile))) {
      errors.push("Aggregate evidence file path must be relative to the direction evidence manifest directory.");
    } else {
      aggregateEvidenceFile = path.join(manifestDirAbsolute, evidenceFile);
    }
  }

  if (requireProductionDirectionReady) {
    if (manifest.status !== "DIRECTION_EVIDENCE_EVALUATED") errors.push("Strict mode requires status DIRECTION_EVIDENCE_EVALUATED.");
    if (manifest.currentAlgorithm?.claimLevel !== "FOUR_DIRECTION_CONTROLLED_EVIDENCE") errors.push("Strict mode requires currentAlgorithm.claimLevel FOUR_DIRECTION_CONTROLLED_EVIDENCE.");
    if (manifest.currentAlgorithm?.frontBackClaim !== "supported_by_controlled_evidence") errors.push("Strict mode requires frontBackClaim supported_by_controlled_evidence.");
    if (manifest.microphoneMetadata?.inventoryCaptured !== true) errors.push("Strict mode requires microphone inventory capture.");
    if (manifest.microphoneMetadata?.activeMicrophonesCaptured !== true) errors.push("Strict mode requires active microphone metadata capture.");
    if (manifest.microphoneMetadata?.channelMappingCaptured !== true) errors.push("Strict mode requires channel mapping capture.");
    if (manifest.microphoneMetadata?.hardwarePoseOrMountingDocumented !== true) errors.push("Strict mode requires hardware pose or mounting notes.");
    if (manifest.targetHardware?.androidPhone?.status !== "passed_controlled_evidence") errors.push("Strict mode requires Android phone controlled evidence.");

    const wearableStatuses = [
      manifest.targetHardware?.metaRayBanDisplay?.status,
      manifest.targetHardware?.metaRayBanGen1BluetoothHfp?.status,
      manifest.targetHardware?.androidXrProjected?.status,
    ];
    if (!wearableStatuses.includes("passed_controlled_evidence")) {
      errors.push("Strict mode requires at least one wearable route with controlled evidence.");
    }
    if (manifest.claimedPlatforms?.metaRayBanDisplay === true && manifest.targetHardware?.metaRayBanDisplay?.status !== "passed_controlled_evidence") {
      errors.push("Strict mode cannot claim Meta Ray-Ban Display without controlled evidence.");
    }
    if (manifest.claimedPlatforms?.androidXrProjected === true && manifest.targetHardware?.androidXrProjected?.status !== "passed_controlled_evidence") {
      errors.push("Strict mode cannot claim Android XR without projected-context controlled evidence.");
    }
    if (manifest.claimedPlatforms?.metaRayBanGen1BluetoothHfp === true && manifest.targetHardware?.metaRayBanGen1BluetoothHfp?.status !== "passed_controlled_evidence") {
      errors.push("Strict mode cannot claim Ray-Ban Gen 1 Bluetooth fallback without route evidence.");
    }

    const evaluation = manifest.aggregateEvaluation ?? {};
    if (evaluation.status !== "passed_controlled_evaluation") errors.push("Strict mode requires aggregateEvaluation.status passed_controlled_evaluation.");
    if ((numberOrNull(evaluation.totalTrials) ?? 0) < 80) errors.push("Strict mode requires at least 80 total controlled direction trials.");
    if ((numberOrNull(evaluation.frontTrials) ?? 0) < 20) errors.push("Strict mode requires at least 20 front trials.");
    if ((numberOrNull(evaluation.backTrials) ?? 0) < 20) errors.push("Strict mode requires at least 20 back trials.");
    if ((numberOrNull(evaluation.leftTrials) ?? 0) < 20) errors.push("Strict mode requires at least 20 left trials.");
    if ((numberOrNull(evaluation.rightTrials) ?? 0) < 20) errors.push("Strict mode requires at least 20 right trials.");
    if ((numberOrNull(evaluation.allDirectionMatchRate) ?? 0) < 0.85) errors.push("Strict mode requires allDirectionMatchRate >= 0.85.");
    if ((numberOrNull(evaluation.frontBackMatchRate) ?? 0) < 0.80) errors.push("Strict mode requires frontBackMatchRate >= 0.80.");
    if ((numberOrNull(evaluation.leftRightMatchRate) ?? 0) < 0.90) errors.push("Strict mode requires leftRightMatchRate >= 0.90.");
    if ((numberOrNull(evaluation.falseDirectionRate) ?? 1) > 0.10) errors.push("Strict mode requires falseDirectionRate <= 0.10.");
    if ((numberOrNull(evaluation.unknownOrUnusableRate) ?? 1) > 0.15) errors.push("Strict mode requires unknownOrUnusableRate <= 0.15.");
    if ((numberOrNull(evaluation.p95DirectionLatencyMillis) ?? Number.POSITIVE_INFINITY) > 500) errors.push("Strict mode requires p95DirectionLatencyMillis <= 500.");
    if (booleanValue(evaluation.confidenceBucketed) !== true) errors.push("Strict mode requires confidenceBucketed=true.");
    if (!evaluation.lowestTargetDevice) errors.push("Strict mode requires lowestTargetDevice.");
    if (!evaluation.wearableRouteWithControlledEvidence) errors.push("Strict mode requires wearableRouteWithControlledEvidence.");
    if (!aggregateEvidenceFile || !fs.existsSync(aggregateEvidenceFile)) errors.push("Strict mode requires aggregate evidence file to exist.");
  }
}

const result = {
  ok: errors.length === 0,
  manifestDir: manifestDirRelative,
  requireProductionDirectionReady,
  aggregateEvidenceFile: aggregateEvidenceFile ? path.relative(ROOT_DIR, aggregateEvidenceFile) : null,
  aggregateEvidenceFileExists: Boolean(aggregateEvidenceFile && fs.existsSync(aggregateEvidenceFile)),
  warnings,
  errors,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Direction accuracy evidence validation passed: ${manifestDirRelative}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Direction accuracy evidence validation failed: ${manifestDirRelative}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
