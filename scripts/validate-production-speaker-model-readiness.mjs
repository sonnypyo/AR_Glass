#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const requireModelReady = args.includes("--require-model-ready");
const packageArg = args.find((arg) => !arg.startsWith("--")) || "apps/voice-direction-glass/model-assets/speaker-verifier";

const docPath = "docs/21-production-speaker-model-evaluation.md";
const requiredSections = [
  "Purpose",
  "Official Source Snapshot",
  "Current App State",
  "Candidate Model Manifest",
  "Evaluation Protocol",
  "Minimum Promotion Criteria",
  "Integration Contract",
  "Validation Command",
  "Release Gate",
  "Trial/Error Notes",
];
const requiredMarkers = [
  "Model status: MODEL_NOT_SELECTED",
  "Evaluation status: NOT_RUN",
  "External submission: not performed",
  "apps/voice-direction-glass/model-assets/speaker-verifier/manifest.json",
  "DRAFT_MODEL_NOT_SELECTED",
  "node scripts/validate-production-speaker-model-readiness.mjs --json",
  "node scripts/validate-production-speaker-model-readiness.mjs --require-model-ready --json",
  "false accept rate",
  "false reject rate",
  "equal error rate",
  "p95 inference latency",
  "Replay/synthetic/voice-conversion risk",
  "production-speaker-model` remains `BLOCKED`",
  "prototype `embedding:v1:` refs",
];
const requiredUrls = [
  "https://www.nist.gov/programs-projects/speaker-and-language-recognition",
  "https://sre.nist.gov/",
  "https://www.nist.gov/system/files/documents/2024/06/11/NIST_2024_Speaker_Recognition_Evaluation_Plan.pdf",
  "https://www.asvspoof.org/",
  "https://android.googlesource.com/platform/external/tensorflow/+/main/tensorflow/lite/g3doc/android/index.md",
  "https://android.googlesource.com/platform/external/tensorflow/+/HEAD/tensorflow/lite/g3doc/inference_with_metadata/overview.md",
  "https://android.googlesource.com/platform/external/tensorflow/+/HEAD/tensorflow/lite/g3doc/android/tutorials/audio_classification.md",
];
const prohibitedClaims = [
  "Model status: READY",
  "Evaluation status: PASSED",
  "production speaker verification ready",
  "guaranteed speaker identity",
  "spoof-proof",
  "biometric approval complete",
  "external submission performed",
];

function usage() {
  return [
    "Usage: scripts/validate-production-speaker-model-readiness.mjs [model-dir] [--json] [--require-model-ready]",
    "",
    "Validates the production speaker model evaluation plan and model manifest.",
    "Default mode validates the draft and may pass while no model is selected.",
    "--require-model-ready fails until a model file, hash, thresholds, metrics, latency, and anti-spoofing decision exist.",
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

function sha256File(absolutePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(absolutePath));
  return hash.digest("hex");
}

function numberOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const errors = [];
const warnings = [];
const { absolute: modelDirAbsolute, relative: modelDirRelative } = resolveInsideWorkspace(packageArg);
const docAbsolute = path.join(ROOT_DIR, docPath);

if (!fs.existsSync(docAbsolute)) {
  errors.push(`Missing production speaker model doc: ${docPath}`);
} else {
  const markdown = fs.readFileSync(docAbsolute, "utf8");
  if (!markdown.startsWith("# Production Speaker Model Evaluation")) {
    errors.push("Document must start with '# Production Speaker Model Evaluation'.");
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
      errors.push(`Document must not claim completed model readiness: ${claim}`);
    }
  }
}

const manifestPath = path.join(modelDirAbsolute, "manifest.json");
let manifest = null;
if (!fs.existsSync(manifestPath)) {
  errors.push(`Missing model manifest: ${path.join(modelDirRelative, "manifest.json")}`);
} else {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    errors.push(`Manifest JSON parse failed: ${error.message}`);
  }
}

let modelFile = null;
let modelSha256 = null;
if (manifest) {
  if (manifest.packageName !== "com.voicedirection.glass") errors.push(`Unexpected packageName: ${manifest.packageName}`);
  if (manifest.status !== "DRAFT_MODEL_NOT_SELECTED" && !requireModelReady) {
    warnings.push(`Manifest status is ${manifest.status}; default validation expects a draft unless strict mode is used.`);
  }
  if (manifest.externalSubmission !== "not_performed") errors.push("Manifest externalSubmission must be not_performed.");
  if (manifest.privacy?.rawAudioPersisted !== false) errors.push("Manifest must keep rawAudioPersisted=false.");
  if (manifest.privacy?.pcmPersisted !== false) errors.push("Manifest must keep pcmPersisted=false.");
  if (manifest.privacy?.transcriptsInEvidence !== false) errors.push("Manifest must keep transcriptsInEvidence=false.");
  if (manifest.privacy?.rawEmbeddingValuesInEvidence !== false) errors.push("Manifest must keep rawEmbeddingValuesInEvidence=false.");
  if (manifest.privacy?.localOnly !== true) errors.push("Manifest must keep localOnly=true until a backend is explicitly designed.");

  const modelFileName = manifest.candidate?.modelFile ?? "";
  if (String(modelFileName).includes("..") || path.isAbsolute(String(modelFileName))) {
    errors.push("Model file path must be relative to the model manifest directory.");
  } else if (modelFileName) {
    modelFile = path.join(modelDirAbsolute, modelFileName);
    if (fs.existsSync(modelFile)) {
      modelSha256 = sha256File(modelFile);
    }
  }

  if (requireModelReady) {
    if (manifest.status !== "MODEL_CANDIDATE_EVALUATED") errors.push("Strict mode requires status MODEL_CANDIDATE_EVALUATED.");
    if (!modelFile || !fs.existsSync(modelFile)) errors.push("Strict mode requires the model file to exist.");
    if (!String(manifest.candidate?.modelFile ?? "").endsWith(".tflite")) warnings.push("Strict mode expected a .tflite model file unless an equivalent local runtime is documented.");
    if (!manifest.candidate?.sha256 || manifest.candidate.sha256 !== modelSha256) errors.push("Strict mode requires candidate.sha256 to match the model file.");
    if (!manifest.candidate?.modelVersion) errors.push("Strict mode requires candidate.modelVersion.");
    if (numberOrNull(manifest.candidate?.inputContract?.sampleRateHz) === null) errors.push("Strict mode requires sampleRateHz.");
    if (numberOrNull(manifest.candidate?.inputContract?.channelCount) === null) errors.push("Strict mode requires channelCount.");
    if (numberOrNull(manifest.candidate?.inputContract?.windowMillis) === null) errors.push("Strict mode requires windowMillis.");
    if (numberOrNull(manifest.candidate?.inputContract?.embeddingDimensions) === null) errors.push("Strict mode requires embeddingDimensions.");
    if (numberOrNull(manifest.thresholds?.acceptAtOrAbove) === null) errors.push("Strict mode requires acceptAtOrAbove threshold.");
    if (numberOrNull(manifest.thresholds?.rejectBelow) === null) errors.push("Strict mode requires rejectBelow threshold.");
    if (manifest.thresholds?.operatingPointStatus !== "calibrated") errors.push("Strict mode requires calibrated operating point.");

    const evaluation = manifest.evaluation ?? {};
    if (evaluation.status !== "passed_local_evaluation") errors.push("Strict mode requires evaluation.status passed_local_evaluation.");
    if ((numberOrNull(evaluation.sameSpeakerTrials) ?? 0) < 100) errors.push("Strict mode requires at least 100 same-speaker trials.");
    if ((numberOrNull(evaluation.differentSpeakerTrials) ?? 0) < 300) errors.push("Strict mode requires at least 300 different-speaker trials.");
    if ((numberOrNull(evaluation.replayOrSpoofTrials) ?? 0) < 20) errors.push("Strict mode requires replay/spoof trial evidence or documented mitigation.");
    if ((numberOrNull(evaluation.falseAcceptRate) ?? 1) > 0.01) errors.push("Strict mode requires falseAcceptRate <= 0.01.");
    if ((numberOrNull(evaluation.falseRejectRate) ?? 1) > 0.10) errors.push("Strict mode requires falseRejectRate <= 0.10.");
    if (numberOrNull(evaluation.equalErrorRate) === null) errors.push("Strict mode requires equalErrorRate.");
    if ((numberOrNull(evaluation.p95LatencyMillis) ?? Number.POSITIVE_INFINITY) > 500) errors.push("Strict mode requires p95LatencyMillis <= 500.");
    if (!evaluation.lowestTargetDevice) errors.push("Strict mode requires lowestTargetDevice.");
    if (manifest.antiSpoofing?.status !== "evaluated_or_mitigated") errors.push("Strict mode requires antiSpoofing.status evaluated_or_mitigated.");
    if (!manifest.antiSpoofing?.decision || manifest.antiSpoofing.decision === "not_selected") errors.push("Strict mode requires anti-spoofing decision.");
  }
}

const result = {
  ok: errors.length === 0,
  modelDir: modelDirRelative,
  requireModelReady,
  modelFile: modelFile ? path.relative(ROOT_DIR, modelFile) : null,
  modelFileExists: Boolean(modelFile && fs.existsSync(modelFile)),
  modelSha256,
  warnings,
  errors,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Production speaker model readiness validation passed: ${modelDirRelative}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Production speaker model readiness validation failed: ${modelDirRelative}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
