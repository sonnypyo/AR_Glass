#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PACK_DIR = "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack";
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review";

const args = process.argv.slice(2);
const wantsHelp = args.includes("--help") || args.includes("-h");
const wantsJson = args.includes("--json");
const wantsWriteReport = args.includes("--write-report");
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;
const packDirArg = positionalArgs()[0] || DEFAULT_PACK_DIR;

function usage() {
  return [
    "Usage: scripts/review-phone-lane-evidence.mjs [operator-pack-dir] [--write-report] [--report-dir DIR] [--json]",
    "",
    "Reviews the phone lane after RUN_PHONE=1 by checking phone summary shape, strict phone-alpha readiness,",
    "promotion validators, and evidence privacy scan state. It never runs hardware commands.",
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
  if (!summary.phoneEvidence.deviceEvidenceExists) {
    next.push("Run `scripts/run-phone-lane-hardware.mjs --execute --write-report --json` after exactly one authorized phone is attached.");
  }
  if (summary.phoneEvidence.deviceEvidenceExists && !summary.phoneEvidence.deviceEvidenceValidatorOk) {
    next.push("Fill and validate the generated `device-evidence.md` manual rows before any phone-alpha claim.");
  }
  if (!summary.phoneEvidence.directionSummaryExists) {
    next.push("Generate the direction evidence summary from the real phone `device-evidence.md`.");
  }
  if (summary.phoneEvidence.directionSummaryExists && !summary.phoneEvidence.directionSummaryValidatorOk) {
    next.push("Validate the direction summary before reviewing promotion.");
  }
  if (!summary.phoneEvidence.directionManifestApplyDryRunOk) {
    next.push("Run direction manifest apply dry-run after direction summary validation.");
  }
  if (!summary.promotion.phoneAlphaProfileOk) {
    next.push("Keep phone alpha blocked until the strict phone-alpha promotion profile passes.");
  }
  if (!summary.privacy.privacyScanOk) {
    next.push("Run and pass evidence privacy scan before sharing or promoting phone evidence.");
  }
  if (summary.phoneAlphaReady) {
    next.push("Review the generated evidence manually, then update release readiness only if manual observations also pass.");
  }
  return next;
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# Phone Lane Post-Run Review");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Operator pack: ${summary.packDir}`);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("This report reviews the Android phone evidence lane after `RUN_PHONE=1`. It does not collect hardware evidence; it checks whether the latest generated phone-lane artifacts are sufficient for phone-alpha review.");
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  lines.push(`- Status: ${summary.status}`);
  lines.push(`- Phone alpha ready: ${summary.phoneAlphaReady}`);
  lines.push(`- Device evidence exists: ${summary.phoneEvidence.deviceEvidenceExists}`);
  lines.push(`- Device evidence validator: ${summary.phoneEvidence.deviceEvidenceValidatorOk ? "pass" : "not ready"}`);
  lines.push(`- Direction summary exists: ${summary.phoneEvidence.directionSummaryExists}`);
  lines.push(`- Direction summary validator: ${summary.phoneEvidence.directionSummaryValidatorOk ? "pass" : "not ready"}`);
  lines.push(`- Direction manifest apply dry-run: ${summary.phoneEvidence.directionManifestApplyDryRunOk ? "pass" : "not ready"}`);
  lines.push(`- Phone private alpha candidate: ${summary.phoneEvidence.phonePrivateAlphaCandidate}`);
  lines.push(`- Workflow promotion profile: ${summary.promotion.workflowProfileOk ? "pass" : "fail"}`);
  lines.push(`- Phone alpha promotion profile: ${summary.promotion.phoneAlphaProfileOk ? "pass" : "fail"}`);
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
  lines.push(`- Phone summary: \`${summary.paths.phoneSummary}\``);
  lines.push(`- Device evidence: \`${summary.paths.deviceEvidence}\``);
  lines.push(`- Direction summary: \`${summary.paths.directionSummary}\``);
  lines.push(`- Promotion validation: \`${summary.paths.promotionValidation}\``);
  lines.push(`- Privacy scan: \`${summary.paths.privacyScan}\``);
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

const phoneSummaryPath = packDir ? path.join(packDir.relative, "phone-alpha-runner/phone-alpha-evidence-summary.json") : "";
const promotionPath = packDir ? path.join(packDir.relative, "promotion-validation/promotion-validation.json") : "";
const privacyPath = packDir ? path.join(packDir.relative, "evidence-privacy-scan/evidence-privacy-scan.json") : "";
const phoneSummary = phoneSummaryPath ? readJson(phoneSummaryPath, errors, "Phone runner summary") : null;

const checks = [];
if (phoneSummaryPath) {
  checks.push(runJsonCheck("Validate phone summary", process.execPath, [
    "scripts/validate-phone-private-alpha-evidence-runner.mjs",
    phoneSummaryPath,
    "--json",
  ]));
  checks.push(runJsonCheck("Validate strict phone summary", process.execPath, [
    "scripts/validate-phone-private-alpha-evidence-runner.mjs",
    phoneSummaryPath,
    "--require-phone-alpha-candidate",
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
  checks.push(runJsonCheck("Validate phone-alpha promotion", process.execPath, [
    "scripts/validate-hardware-test-promotion.mjs",
    packDir.relative,
    "--profile",
    "phone-alpha",
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
const phoneAlphaPromotionCheck = checkByLabel("Validate phone-alpha promotion");
const strictPhoneSummaryCheck = checkByLabel("Validate strict phone summary");
const defaultPhoneSummaryCheck = checkByLabel("Validate phone summary");

const phoneEvidence = {
  deviceEvidenceExists: phoneSummary?.deviceEvidence?.exists === true,
  deviceEvidenceValidatorOk: phoneSummary?.deviceEvidence?.validatorOk === true,
  directionSummaryExists: phoneSummary?.directionEvidence?.exists === true,
  directionSummaryValidatorOk: phoneSummary?.directionEvidence?.validatorOk === true,
  directionManifestApplyDryRunOk: phoneSummary?.directionEvidence?.applyDryRunOk === true,
  directionManifestApplyReady: phoneSummary?.directionEvidence?.applyReady === true,
  directionProductionCandidate: phoneSummary?.directionEvidence?.productionDirectionCandidate === true,
  phonePrivateAlphaCandidate: phoneSummary?.phonePrivateAlphaCandidate === true,
  authorizedAdbDevices: phoneSummary?.adb?.authorizedDeviceCount ?? 0,
  allowNoDevice: phoneSummary?.flags?.allowNoDevice === true,
};

const promotion = {
  workflowProfileOk: workflowPromotionCheck?.ok === true,
  phoneAlphaProfileOk: phoneAlphaPromotionCheck?.ok === true,
  strictPhoneSummaryOk: strictPhoneSummaryCheck?.ok === true,
  defaultPhoneSummaryOk: defaultPhoneSummaryCheck?.ok === true,
};

const privacy = {
  privacyScanOk: privacyCheck?.ok === true && privacyCheck?.parsedJson?.ok === true,
  filesScanned: privacyCheck?.parsedJson?.filesScanned ?? 0,
  violationCount: Array.isArray(privacyCheck?.parsedJson?.violations) ? privacyCheck.parsedJson.violations.length : null,
  warningCount: Array.isArray(privacyCheck?.parsedJson?.warnings) ? privacyCheck.parsedJson.warnings.length : null,
};

const phoneAlphaReady = phoneEvidence.deviceEvidenceExists &&
  phoneEvidence.deviceEvidenceValidatorOk &&
  phoneEvidence.directionSummaryExists &&
  phoneEvidence.directionSummaryValidatorOk &&
  phoneEvidence.directionManifestApplyDryRunOk &&
  phoneEvidence.phonePrivateAlphaCandidate &&
  phoneEvidence.authorizedAdbDevices === 1 &&
  !phoneEvidence.allowNoDevice &&
  promotion.strictPhoneSummaryOk &&
  promotion.phoneAlphaProfileOk &&
  privacy.privacyScanOk;

if (!phoneEvidence.deviceEvidenceExists) errors.push("Real phone device-evidence.md has not been collected.");
if (!phoneEvidence.directionSummaryExists) errors.push("Direction evidence summary has not been generated from real phone evidence.");
if (!promotion.phoneAlphaProfileOk) errors.push("Strict phone-alpha promotion profile is not passing.");
if (!privacy.privacyScanOk) errors.push("Operator-pack evidence privacy scan is not passing.");

const summary = {
  ok: phoneAlphaReady,
  generatedAt: kstTimestamp(),
  packDir: packDir?.relative ?? packDirArg,
  reportDir: reportDir?.relative ?? reportDirArg,
  reportPath: reportDir ? path.join(reportDir.relative, "phone-lane-post-run-review.md") : null,
  summaryJsonPath: reportDir ? path.join(reportDir.relative, "phone-lane-post-run-review.json") : null,
  status: phoneAlphaReady ? "phone-alpha-review-ready" : "blocked",
  phoneAlphaReady,
  phoneEvidence,
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
    phoneSummary: phoneSummaryPath,
    deviceEvidence: phoneSummary?.deviceEvidencePath ?? "",
    directionSummary: phoneSummary?.directionEvidence?.summaryPath ?? "",
    promotionValidation: promotionPath,
    privacyScan: privacyPath,
  },
  errors,
  nextActions: [],
  rawOutputPersisted: false,
  privacyGuardrail: "This report stores only aggregate statuses, exit codes, booleans, counts, command labels, and workspace-relative paths. It must not store raw child command output, ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, encrypted payload values, private alert text, exact locations, or matched privacy-scan text.",
};
summary.nextActions = deriveNextActions(summary);

if (wantsWriteReport && reportDir) {
  fs.mkdirSync(reportDir.absolute, { recursive: true });
  fs.writeFileSync(path.join(reportDir.absolute, "phone-lane-post-run-review.md"), renderMarkdown(summary));
  fs.writeFileSync(path.join(reportDir.absolute, "phone-lane-post-run-review.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

if (wantsJson) {
  console.log(JSON.stringify(summary, null, 2));
} else if (summary.ok) {
  process.stdout.write(renderMarkdown(summary));
} else {
  console.error("Phone lane post-run review is blocked.");
  for (const error of summary.errors) console.error(`error: ${error}`);
}

process.exit(summary.ok ? 0 : 1);
