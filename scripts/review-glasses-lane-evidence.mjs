#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PACK_DIR = "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack";
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review";

const args = process.argv.slice(2);
const wantsHelp = args.includes("--help") || args.includes("-h");
const wantsJson = args.includes("--json");
const wantsWriteReport = args.includes("--write-report");
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;
const packDirArg = positionalArgs()[0] || DEFAULT_PACK_DIR;

function usage() {
  return [
    "Usage: scripts/review-glasses-lane-evidence.mjs [operator-pack-dir] [--write-report] [--report-dir DIR] [--json]",
    "",
    "Reviews the glasses lane after RUN_GLASSES=1 by checking glasses runner summaries, strict glasses-alpha",
    "promotion validation, Android XR projected contract status, and evidence privacy scan state.",
    "It never runs hardware commands.",
    "",
    `Default operator pack: ${DEFAULT_PACK_DIR}`,
    `Default report dir: ${DEFAULT_REPORT_DIR}`,
  ].join("\n");
}

if (wantsHelp) {
  console.log(usage());
  process.exit(0);
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return "";
  if (index + 1 >= args.length) {
    console.error(`${flag} requires a value.`);
    process.exit(1);
  }
  return args[index + 1];
}

function positionalArgs() {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--report-dir") {
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) continue;
    values.push(arg);
  }
  return values;
}

function resolveInsideWorkspace(value) {
  const absolute = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to access outside workspace: ${absolute}`);
  }
  return { absolute, relative };
}

function readJson(relativePath, errors, label) {
  const resolved = resolveInsideWorkspace(relativePath);
  if (!fs.existsSync(resolved.absolute)) {
    errors.push(`${label} missing: ${resolved.relative}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(resolved.absolute, "utf8"));
  } catch (error) {
    errors.push(`${label} parse failed: ${error.message}`);
    return null;
  }
}

function kstTimestamp() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date()).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+09:00`;
}

function commandPart(value) {
  if (value === process.execPath) return "node";
  const absoluteCandidate = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, absoluteCandidate);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) return relative;
  return value;
}

function runJsonCheck(label, command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT_DIR,
    encoding: "utf8",
    env: {
      ...process.env,
      JAVA_HOME: process.env.JAVA_HOME || "/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home",
      ANDROID_HOME: process.env.ANDROID_HOME || "/Users/sonjunpyo/Library/Android/sdk",
    },
  });
  const exitCode = typeof result.status === "number" ? result.status : 1;
  let parsedJson = null;
  let parseOk = false;
  try {
    parsedJson = result.stdout ? JSON.parse(result.stdout) : null;
    parseOk = parsedJson !== null;
  } catch {
    parsedJson = null;
  }
  return {
    label,
    ok: exitCode === 0,
    exitCode,
    parseOk,
    command: [command, ...commandArgs].map(commandPart).join(" "),
    rawOutputPersisted: false,
    parsedJson,
  };
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function deriveNextActions(summary) {
  const next = [];
  if (!summary.glassesEvidence.summaryExists) {
    next.push("Run `RUN_GLASSES=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` only after real glasses evidence can be collected.");
  }
  if (!summary.glassesEvidence.metaRayBanDisplayReady) {
    next.push("Collect reviewed Meta Ray-Ban Display cue proof through the glasses hardware evidence session.");
  }
  if (!summary.glassesEvidence.rayBanGen1FallbackReady) {
    next.push("Collect or document Ray-Ban Gen 1 Bluetooth/TTS/phone-vibration fallback evidence without device names.");
  }
  if (!summary.glassesEvidence.androidXrProjectedReady) {
    next.push("Collect Android XR projected runtime proof and keep strict Android XR contract blocked until ProjectedContext/Glimmer evidence exists.");
  }
  if (!summary.glassesEvidence.hapticsReadyOrFallbackDocumented) {
    next.push("Record official glasses haptics proof or keep phone vibration as the documented MVP fallback.");
  }
  if (!summary.promotion.glassesAlphaProfileOk) {
    next.push("Keep glasses alpha blocked until strict glasses-alpha promotion profile passes.");
  }
  if (!summary.privacy.privacyScanOk) {
    next.push("Run and pass evidence privacy scan before sharing or promoting glasses evidence.");
  }
  if (summary.glassesAlphaReady) {
    next.push("Review the generated evidence manually, then update release readiness only if physical observations also pass.");
  }
  return next;
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# Glasses Lane Post-Run Review");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Operator pack: ${summary.packDir}`);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("This report reviews the glasses evidence lane after `RUN_GLASSES=1`. It does not collect hardware evidence; it checks whether the latest generated glasses-lane artifacts are sufficient for glasses-alpha review.");
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  lines.push(`- Status: ${summary.status}`);
  lines.push(`- Glasses alpha ready: ${summary.glassesAlphaReady}`);
  lines.push(`- Glasses summary exists: ${summary.glassesEvidence.summaryExists}`);
  lines.push(`- Meta Ray-Ban Display ready: ${summary.glassesEvidence.metaRayBanDisplayReady}`);
  lines.push(`- Ray-Ban Gen 1 fallback ready: ${summary.glassesEvidence.rayBanGen1FallbackReady}`);
  lines.push(`- Android XR projected ready: ${summary.glassesEvidence.androidXrProjectedReady}`);
  lines.push(`- Haptics ready or fallback documented: ${summary.glassesEvidence.hapticsReadyOrFallbackDocumented}`);
  lines.push(`- Glasses hardware evidence candidate: ${summary.glassesEvidence.glassesHardwareEvidenceCandidate}`);
  lines.push(`- Glasses private alpha candidate: ${summary.glassesEvidence.glassesPrivateAlphaCandidate}`);
  lines.push(`- Workflow promotion profile: ${summary.promotion.workflowProfileOk ? "pass" : "fail"}`);
  lines.push(`- Glasses alpha promotion profile: ${summary.promotion.glassesAlphaProfileOk ? "pass" : "fail"}`);
  lines.push(`- Evidence privacy scan: ${summary.privacy.privacyScanOk ? "pass" : "fail"}`);
  lines.push("");
  lines.push("## Checks");
  lines.push("");
  lines.push("| Check | Result | Exit Code | Parsed JSON | Raw Output Persisted |");
  lines.push("| --- | --- | ---: | --- | --- |");
  for (const check of summary.checks) {
    lines.push(`| ${escapeCell(check.label)} | ${check.ok ? "pass" : "fail"} | ${check.exitCode} | ${check.parseOk ? "yes" : "no"} | ${check.rawOutputPersisted ? "yes" : "no"} |`);
  }
  lines.push("");
  lines.push("## Evidence Paths");
  lines.push("");
  lines.push(`- Glasses summary: \`${summary.paths.glassesSummary}\``);
  lines.push(`- Promotion validation: \`${summary.paths.promotionValidation}\``);
  lines.push(`- Privacy scan: \`${summary.paths.privacyScan}\``);
  lines.push(`- Android XR contract: \`${summary.paths.androidXrContract}\``);
  lines.push("");
  lines.push("## Next Actions");
  lines.push("");
  for (const action of summary.nextActions) lines.push(`- ${action}`);
  lines.push("");
  lines.push("## Privacy Guardrail");
  lines.push("");
  lines.push(summary.privacyGuardrail);
  if (summary.errors.length > 0) {
    lines.push("");
    lines.push("## Errors");
    lines.push("");
    for (const error of summary.errors) lines.push(`- ${error}`);
  }
  return `${lines.join("\n")}\n`;
}

const errors = [];
let packDir = null;
let reportDir = null;
try {
  packDir = resolveInsideWorkspace(packDirArg);
  reportDir = resolveInsideWorkspace(reportDirArg);
} catch (error) {
  errors.push(error.message);
}

const glassesSummaryPath = packDir ? path.join(packDir.relative, "glasses-alpha-runner/glasses-alpha-evidence-summary.json") : "";
const promotionPath = packDir ? path.join(packDir.relative, "promotion-validation/promotion-validation.json") : "";
const privacyPath = packDir ? path.join(packDir.relative, "evidence-privacy-scan/evidence-privacy-scan.json") : "";
const androidXrContractPath = "data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract/android-xr-projected-contract.json";
const glassesSummary = glassesSummaryPath ? readJson(glassesSummaryPath, errors, "Glasses runner summary") : null;

const checks = [];
if (glassesSummaryPath) {
  checks.push(runJsonCheck("Validate glasses summary", process.execPath, [
    "scripts/validate-glasses-private-alpha-evidence-runner.mjs",
    glassesSummaryPath,
    "--json",
  ]));
  checks.push(runJsonCheck("Validate strict glasses summary", process.execPath, [
    "scripts/validate-glasses-private-alpha-evidence-runner.mjs",
    glassesSummaryPath,
    "--require-glasses-alpha-candidate",
    "--json",
  ]));
}
if (packDir) {
  checks.push(runJsonCheck("Validate workflow promotion", process.execPath, [
    "scripts/validate-hardware-test-promotion.mjs",
    packDir.relative,
    "--profile",
    "workflow",
    "--json",
  ]));
  checks.push(runJsonCheck("Validate glasses-alpha promotion", process.execPath, [
    "scripts/validate-hardware-test-promotion.mjs",
    packDir.relative,
    "--profile",
    "glasses-alpha",
    "--json",
  ]));
  checks.push(runJsonCheck("Validate Android XR projected contract", process.execPath, [
    "scripts/validate-android-xr-projected-contract.mjs",
    "--json",
  ]));
  checks.push(runJsonCheck("Validate strict Android XR projected contract", process.execPath, [
    "scripts/validate-android-xr-projected-contract.mjs",
    "--require-real-android-xr",
    "--json",
  ]));
  checks.push(runJsonCheck("Scan operator pack privacy", process.execPath, [
    "scripts/scan-evidence-privacy.mjs",
    packDir.relative,
    "--json",
  ]));
}

const checkByLabel = (label) => checks.find((check) => check.label === label);
const privacyCheck = checkByLabel("Scan operator pack privacy");
const workflowPromotionCheck = checkByLabel("Validate workflow promotion");
const glassesAlphaPromotionCheck = checkByLabel("Validate glasses-alpha promotion");
const strictGlassesSummaryCheck = checkByLabel("Validate strict glasses summary");
const defaultGlassesSummaryCheck = checkByLabel("Validate glasses summary");
const androidXrDefaultCheck = checkByLabel("Validate Android XR projected contract");
const androidXrStrictCheck = checkByLabel("Validate strict Android XR projected contract");

const glassesEvidence = {
  summaryExists: glassesSummary !== null,
  metaRayBanDisplayReady: glassesSummary?.manifest?.metaRayBanDisplayReady === true,
  rayBanGen1FallbackReady: glassesSummary?.manifest?.rayBanGen1FallbackReady === true,
  androidXrProjectedReady: glassesSummary?.manifest?.androidXrProjectedReady === true,
  hapticsReadyOrFallbackDocumented: glassesSummary?.manifest?.hapticsReadyOrFallbackDocumented === true,
  privacyGuardrailsClear: glassesSummary?.manifest?.privacyGuardrailsClear === true,
  strictHardwareValidationOk: glassesSummary?.strictHardwareValidationOk === true,
  strictServiceGateOk: glassesSummary?.strictServiceGateOk === true,
  glassesHardwareEvidenceCandidate: glassesSummary?.glassesHardwareEvidenceCandidate === true,
  glassesPrivateAlphaCandidate: glassesSummary?.glassesPrivateAlphaCandidate === true,
  runSession: glassesSummary?.flags?.runSession === true,
  rawOutputPersisted: glassesSummary?.rawOutputPersisted === true,
};

const promotion = {
  workflowProfileOk: workflowPromotionCheck?.ok === true,
  glassesAlphaProfileOk: glassesAlphaPromotionCheck?.ok === true,
  strictGlassesSummaryOk: strictGlassesSummaryCheck?.ok === true,
  defaultGlassesSummaryOk: defaultGlassesSummaryCheck?.ok === true,
  androidXrDefaultOk: androidXrDefaultCheck?.ok === true,
  androidXrStrictOk: androidXrStrictCheck?.ok === true,
};

const privacy = {
  privacyScanOk: privacyCheck?.ok === true && privacyCheck?.parsedJson?.ok === true,
  filesScanned: privacyCheck?.parsedJson?.filesScanned ?? 0,
  violationCount: Array.isArray(privacyCheck?.parsedJson?.violations) ? privacyCheck.parsedJson.violations.length : null,
  warningCount: Array.isArray(privacyCheck?.parsedJson?.warnings) ? privacyCheck.parsedJson.warnings.length : null,
};

const glassesAlphaReady = glassesEvidence.summaryExists &&
  glassesEvidence.metaRayBanDisplayReady &&
  glassesEvidence.rayBanGen1FallbackReady &&
  glassesEvidence.androidXrProjectedReady &&
  glassesEvidence.hapticsReadyOrFallbackDocumented &&
  glassesEvidence.privacyGuardrailsClear &&
  glassesEvidence.strictHardwareValidationOk &&
  glassesEvidence.glassesHardwareEvidenceCandidate &&
  glassesEvidence.glassesPrivateAlphaCandidate &&
  promotion.strictGlassesSummaryOk &&
  promotion.glassesAlphaProfileOk &&
  promotion.androidXrStrictOk &&
  privacy.privacyScanOk;

if (!glassesEvidence.summaryExists) errors.push("Glasses runner summary has not been generated.");
if (!glassesEvidence.metaRayBanDisplayReady) errors.push("Meta Ray-Ban Display evidence is not ready.");
if (!glassesEvidence.rayBanGen1FallbackReady) errors.push("Ray-Ban Gen 1 fallback evidence is not ready.");
if (!glassesEvidence.androidXrProjectedReady) errors.push("Android XR projected evidence is not ready.");
if (!promotion.androidXrStrictOk) errors.push("Strict Android XR projected contract is not passing.");
if (!promotion.glassesAlphaProfileOk) errors.push("Strict glasses-alpha promotion profile is not passing.");
if (!privacy.privacyScanOk) errors.push("Operator-pack evidence privacy scan is not passing.");

const summary = {
  ok: glassesAlphaReady,
  generatedAt: kstTimestamp(),
  packDir: packDir?.relative ?? packDirArg,
  reportDir: reportDir?.relative ?? reportDirArg,
  reportPath: reportDir ? path.join(reportDir.relative, "glasses-lane-post-run-review.md") : null,
  summaryJsonPath: reportDir ? path.join(reportDir.relative, "glasses-lane-post-run-review.json") : null,
  status: glassesAlphaReady ? "glasses-alpha-review-ready" : "blocked",
  glassesAlphaReady,
  glassesEvidence,
  promotion,
  privacy,
  checks: checks.map((check) => ({
    label: check.label,
    ok: check.ok,
    exitCode: check.exitCode,
    parseOk: check.parseOk,
    command: check.command,
    rawOutputPersisted: false,
  })),
  paths: {
    glassesSummary: glassesSummaryPath,
    promotionValidation: promotionPath,
    privacyScan: privacyPath,
    androidXrContract: androidXrContractPath,
  },
  errors,
  nextActions: [],
  rawOutputPersisted: false,
  privacyGuardrail: "This report stores only aggregate statuses, exit codes, booleans, counts, command labels, and workspace-relative paths. It must not store raw child command output, ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, encrypted payload values, private alert text, exact locations, or matched privacy-scan text.",
};
summary.nextActions = deriveNextActions(summary);

if (wantsWriteReport && reportDir) {
  fs.mkdirSync(reportDir.absolute, { recursive: true });
  fs.writeFileSync(path.join(reportDir.absolute, "glasses-lane-post-run-review.md"), renderMarkdown(summary));
  fs.writeFileSync(path.join(reportDir.absolute, "glasses-lane-post-run-review.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

if (wantsJson) {
  console.log(JSON.stringify(summary, null, 2));
} else if (summary.ok) {
  console.log(renderMarkdown(summary));
} else {
  console.error("Glasses lane post-run review is not ready.");
  for (const error of errors) console.error(`error: ${error}`);
}

process.exit(summary.ok ? 0 : 1);
