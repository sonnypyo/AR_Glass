#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SUMMARY = "data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json";
const CANONICAL_DIR = "apps/voice-direction-glass/direction-evidence";
const CANONICAL_MANIFEST = `${CANONICAL_DIR}/manifest.json`;
const AGGREGATE_EVIDENCE_FILE = `${CANONICAL_DIR}/aggregate-direction-evidence-summary.json`;
const SUMMARY_VALIDATOR = "scripts/validate-direction-evidence-summary.mjs";
const ACCURACY_VALIDATOR = "scripts/validate-direction-accuracy-evidence.mjs";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const wantsWrite = args.includes("--write");
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

function usage() {
  return [
    "Usage: scripts/apply-direction-evidence-summary.mjs [summary-json] [--write] [--json]",
    "",
    "Dry-runs or applies a strict direction evidence summary to the canonical direction evidence manifest.",
    "",
    "Default mode is dry-run only and can report applyReady=false without failing.",
    "--write updates apps/voice-direction-glass/direction-evidence/manifest.json only after strict validation passes.",
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
    throw new Error(`Refusing to access outside workspace: ${absolute}`);
  }
  return { absolute, relative };
}

function runNodeScript(scriptRelative, scriptArgs) {
  return spawnSync(process.execPath, [path.join(ROOT_DIR, scriptRelative), ...scriptArgs], {
    cwd: ROOT_DIR,
    encoding: "utf8",
  });
}

function validatorResult(result) {
  let parsed = null;
  const text = (result.stdout || result.stderr || "").trim();
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  return {
    ok: result.status === 0,
    exitCode: result.status,
    parsed,
  };
}

function readJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
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

function validateApplyShape(summary, errors) {
  if (!summary || typeof summary !== "object") {
    errors.push("Summary JSON object is required.");
    return;
  }
  if (summary.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
  if (summary.fixtureEvidence !== false) errors.push("Summary fixtureEvidence must be false before applying to the canonical manifest.");
  if (summary.productionDirectionCandidate !== true) errors.push("Summary productionDirectionCandidate must be true before applying to the canonical manifest.");
  if (!summary.manifestUpdateTemplate || typeof summary.manifestUpdateTemplate !== "object") {
    errors.push("manifestUpdateTemplate object is required.");
    return;
  }

  const template = summary.manifestUpdateTemplate;
  if (template.packageName !== "com.voicedirection.glass") errors.push("manifestUpdateTemplate.packageName must be com.voicedirection.glass.");
  if (template.status !== "DIRECTION_EVIDENCE_EVALUATED") errors.push("manifestUpdateTemplate.status must be DIRECTION_EVIDENCE_EVALUATED.");
  if (template.externalSubmission !== "not_performed") errors.push("manifestUpdateTemplate.externalSubmission must be not_performed.");
  if (template.currentAlgorithm?.claimLevel !== "FOUR_DIRECTION_CONTROLLED_EVIDENCE") {
    errors.push("manifestUpdateTemplate.currentAlgorithm.claimLevel must be FOUR_DIRECTION_CONTROLLED_EVIDENCE.");
  }
  if (template.currentAlgorithm?.frontBackClaim !== "supported_by_controlled_evidence") {
    errors.push("manifestUpdateTemplate.currentAlgorithm.frontBackClaim must be supported_by_controlled_evidence.");
  }
  if (template.aggregateEvaluation?.evidenceFile !== "aggregate-direction-evidence-summary.json") {
    errors.push("manifestUpdateTemplate.aggregateEvaluation.evidenceFile must be aggregate-direction-evidence-summary.json.");
  }
  if (JSON.stringify(summary.targetProgress) !== JSON.stringify(template.aggregateEvaluation?.targetProgress)) {
    errors.push("manifestUpdateTemplate.aggregateEvaluation.targetProgress must mirror summary.targetProgress.");
  }
  if (summary.targetProgress?.controlledTrialTargetComplete !== true) {
    errors.push("summary.targetProgress.controlledTrialTargetComplete must be true before applying.");
  }
  if (summary.targetProgress?.missingTotalTrials !== 0) {
    errors.push("summary.targetProgress.missingTotalTrials must be 0 before applying.");
  }
  for (const key of ["rawAudioPersisted", "pcmPersisted", "transcriptsInEvidence", "rawEmbeddingValuesInEvidence", "speakerNamesInEvidence"]) {
    if (template.privacy?.[key] !== false) errors.push(`manifestUpdateTemplate.privacy.${key} must be false.`);
  }
  if (template.privacy?.localOnly !== true) errors.push("manifestUpdateTemplate.privacy.localOnly must be true.");

  walkObject(summary, (key, _value, pathParts) => {
    if (forbiddenKeys.includes(key)) {
      errors.push(`Forbidden private/raw key present: ${pathParts.join(".")}`);
    }
  });
}

function writeJson(absolutePath, value) {
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

const errors = [];
const warnings = [];
let summaryPath = null;
let summary = null;
let proposedManifest = null;
let wroteManifest = false;
let wroteAggregateEvidence = false;

try {
  summaryPath = resolveInsideWorkspace(summaryArg);
  if (!fs.existsSync(summaryPath.absolute)) {
    errors.push(`Summary JSON does not exist: ${summaryPath.relative}`);
  } else {
    summary = readJson(summaryPath.absolute);
  }
} catch (error) {
  errors.push(error.message);
}

const defaultValidation = summaryPath
  ? validatorResult(runNodeScript(SUMMARY_VALIDATOR, [summaryPath.relative, "--json"]))
  : { ok: false, exitCode: null, parsed: null };
const strictValidation = summaryPath
  ? validatorResult(runNodeScript(SUMMARY_VALIDATOR, [summaryPath.relative, "--require-production-direction-candidate", "--json"]))
  : { ok: false, exitCode: null, parsed: null };

if (!defaultValidation.ok) {
  errors.push("Default direction summary validation failed.");
}

const shapeErrors = [];
if (summary) {
  validateApplyShape(summary, shapeErrors);
  proposedManifest = summary.manifestUpdateTemplate ?? null;
}

const applyReady = defaultValidation.ok && strictValidation.ok && shapeErrors.length === 0;
const applyBlockers = shapeErrors.concat(strictValidation.parsed?.errors ?? []);

if (!applyReady) {
  warnings.push("Direction summary is not apply-ready; dry-run only. Canonical direction manifest was not changed.");
}

if (wantsWrite && !applyReady) {
  errors.push(`Refusing to write canonical direction manifest: ${applyBlockers.join(" | ") || "strict validation did not pass"}`);
}

if (wantsWrite && applyReady && proposedManifest) {
  const manifestPath = resolveInsideWorkspace(CANONICAL_MANIFEST);
  const aggregatePath = resolveInsideWorkspace(AGGREGATE_EVIDENCE_FILE);
  const previousManifest = fs.readFileSync(manifestPath.absolute, "utf8");
  const previousAggregateExists = fs.existsSync(aggregatePath.absolute);
  const previousAggregate = previousAggregateExists ? fs.readFileSync(aggregatePath.absolute, "utf8") : "";
  try {
    writeJson(aggregatePath.absolute, summary);
    wroteAggregateEvidence = true;
    writeJson(manifestPath.absolute, proposedManifest);
    wroteManifest = true;

    const accuracyDefault = runNodeScript(ACCURACY_VALIDATOR, [CANONICAL_DIR, "--json"]);
    if (accuracyDefault.status !== 0) {
      throw new Error("Default direction accuracy validation failed after write.");
    }
    const accuracyStrict = runNodeScript(ACCURACY_VALIDATOR, [CANONICAL_DIR, "--require-production-direction-ready", "--json"]);
    if (accuracyStrict.status !== 0) {
      throw new Error("Strict direction accuracy validation failed after write.");
    }
  } catch (error) {
    fs.writeFileSync(manifestPath.absolute, previousManifest);
    if (previousAggregateExists) {
      fs.writeFileSync(aggregatePath.absolute, previousAggregate);
    } else if (fs.existsSync(aggregatePath.absolute)) {
      fs.unlinkSync(aggregatePath.absolute);
    }
    wroteManifest = false;
    wroteAggregateEvidence = false;
    errors.push(`${error.message} Canonical direction evidence files restored.`);
  }
}

const result = {
  ok: errors.length === 0,
  summaryPath: summaryPath?.relative ?? summaryArg,
  canonicalManifest: CANONICAL_MANIFEST,
  aggregateEvidenceFile: AGGREGATE_EVIDENCE_FILE,
  mode: wantsWrite ? "write" : "dry-run",
  defaultValidationOk: defaultValidation.ok,
  strictValidationOk: strictValidation.ok,
  applyReady,
  applyBlockers,
  productionDirectionCandidate: summary?.productionDirectionCandidate === true,
  fixtureEvidence: summary?.fixtureEvidence === true,
  targetProgress: summary?.targetProgress ?? null,
  proposedStatus: proposedManifest?.status ?? null,
  wroteManifest,
  wroteAggregateEvidence,
  warnings,
  errors,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Direction evidence summary apply ${wantsWrite ? "write" : "dry-run"} passed: ${result.summaryPath}`);
  if (!applyReady) console.log("warning: summary is not apply-ready; canonical direction manifest was not changed.");
} else {
  console.error(`Direction evidence summary apply ${wantsWrite ? "write" : "dry-run"} failed: ${result.summaryPath}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
