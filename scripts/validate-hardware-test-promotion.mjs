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
const wantsWrite = args.includes("--write-report");
const profile = valueAfter("--profile") || "workflow";
const reportDirArg = valueAfter("--report-dir") || "";
const packArg = positionalArgs()[0] || DEFAULT_PACK;

const profileConfig = {
  workflow: {
    description: "Validate operator-pack workflow evidence without making a promotion claim.",
    phoneStrict: false,
    glassesStrict: false,
    supportStrict: false,
    serviceProfile: "",
  },
  "current-safe": {
    description: "Assert the current repository is safe: internal prototype only, hardware promotions not ready.",
    phoneStrict: false,
    glassesStrict: false,
    supportStrict: false,
    serviceProfile: "current-safe",
  },
  "phone-alpha": {
    description: "Require phone-private-alpha evidence and service gate readiness.",
    phoneStrict: true,
    glassesStrict: false,
    supportStrict: false,
    serviceProfile: "phone-alpha",
  },
  "glasses-alpha": {
    description: "Require phone and glasses private-alpha evidence and service gate readiness.",
    phoneStrict: true,
    glassesStrict: true,
    supportStrict: false,
    serviceProfile: "glasses-alpha",
  },
  "support-ready": {
    description: "Require support deletion and mistaken-alert drill evidence.",
    phoneStrict: false,
    glassesStrict: false,
    supportStrict: true,
    serviceProfile: "",
  },
  "private-alpha": {
    description: "Require phone, glasses, and support evidence before any broad private-alpha claim.",
    phoneStrict: true,
    glassesStrict: true,
    supportStrict: true,
    serviceProfile: "glasses-alpha",
  },
};

function usage() {
  return [
    "Usage: scripts/validate-hardware-test-promotion.mjs [operator-pack-dir] [--profile workflow|current-safe|phone-alpha|glasses-alpha|support-ready|private-alpha] [--write-report --report-dir DIR] [--json]",
    "",
    "Validates whether a generated hardware test operator pack is workflow evidence only,",
    "or whether its summaries are sufficient for a stricter promotion claim.",
    "",
    `Default pack: ${DEFAULT_PACK}`,
    "Default profile: workflow",
  ].join("\n");
}

if (showHelp) {
  console.log(usage());
  process.exit(0);
}

if (!profileConfig[profile]) {
  console.error(`Unknown profile: ${profile}`);
  console.error(usage());
  process.exit(1);
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
    if (arg === "--profile") {
      index += 1;
      continue;
    }
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
    throw new Error(`Refusing to read outside workspace: ${absolute}`);
  }
  return { absolute, relative };
}

function readJsonIfExists(relativePath, errors, label) {
  const absolute = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(absolute)) {
    errors.push(`${label} JSON is missing: ${relativePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch (error) {
    errors.push(`${label} JSON parse failed: ${error.message}`);
    return null;
  }
}

function runCommand(label, commandArgs) {
  const result = spawnSync(process.execPath, commandArgs, {
    cwd: ROOT_DIR,
    encoding: "utf8",
  });
  let parsed = null;
  const output = (result.stdout || result.stderr || "").trim();
  if (output.startsWith("{")) {
    try {
      parsed = JSON.parse(output);
    } catch {
      parsed = null;
    }
  }
  return {
    label,
    ok: result.status === 0,
    exitCode: result.status,
    parsed,
  };
}

function runScript(label, script, scriptArgs = []) {
  return runCommand(label, [path.join(ROOT_DIR, script), ...scriptArgs]);
}

const config = profileConfig[profile];
const errors = [];
const warnings = [];
const pack = resolveInsideWorkspace(packArg);

const checks = [];
let phoneSummary = null;
let glassesSummary = null;
let readinessSummary = null;

if (!fs.existsSync(pack.absolute) || !fs.statSync(pack.absolute).isDirectory()) {
  errors.push(`Operator pack directory does not exist: ${pack.relative}`);
} else {
  const phoneSummaryPath = path.join(pack.relative, "phone-alpha-runner/phone-alpha-evidence-summary.json");
  const glassesSummaryPath = path.join(pack.relative, "glasses-alpha-runner/glasses-alpha-evidence-summary.json");
  const readinessSummaryPath = path.join(pack.relative, "hardware-readiness/hardware-readiness-preflight.json");
  const serviceAuditPath = path.join(pack.relative, "service-readiness-audit/service-readiness-audit.md");

  const packCheck = runScript("Validate operator pack", "scripts/validate-hardware-test-operator-pack.mjs", [pack.relative, "--json"]);
  checks.push(packCheck);
  if (!packCheck.ok) errors.push("Operator pack validator failed.");

  phoneSummary = readJsonIfExists(phoneSummaryPath, errors, "Phone runner summary");
  glassesSummary = readJsonIfExists(glassesSummaryPath, errors, "Glasses runner summary");
  readinessSummary = readJsonIfExists(readinessSummaryPath, errors, "Hardware readiness summary");
  if (!fs.existsSync(path.join(ROOT_DIR, serviceAuditPath))) {
    errors.push(`Pack service readiness audit is missing: ${serviceAuditPath}`);
  }

  if (phoneSummary) {
    const argsForPhone = [phoneSummaryPath, "--json"];
    if (config.phoneStrict) argsForPhone.push("--require-phone-alpha-candidate");
    const phoneCheck = runScript("Validate phone-private-alpha summary", "scripts/validate-phone-private-alpha-evidence-runner.mjs", argsForPhone);
    checks.push(phoneCheck);
    if (!phoneCheck.ok) errors.push(`Phone-private-alpha summary did not satisfy ${profile} profile.`);
  }

  if (glassesSummary) {
    const argsForGlasses = [glassesSummaryPath, "--json"];
    if (config.glassesStrict) argsForGlasses.push("--require-glasses-alpha-candidate");
    const glassesCheck = runScript("Validate glasses-private-alpha summary", "scripts/validate-glasses-private-alpha-evidence-runner.mjs", argsForGlasses);
    checks.push(glassesCheck);
    if (!glassesCheck.ok) errors.push(`Glasses-private-alpha summary did not satisfy ${profile} profile.`);
  }

  if (config.serviceProfile) {
    const serviceCheck = runScript(`Assert service gate ${config.serviceProfile}`, "scripts/assert-service-gates.mjs", ["--profile", config.serviceProfile, "--json"]);
    checks.push(serviceCheck);
    if (!serviceCheck.ok) errors.push(`Service gate profile failed: ${config.serviceProfile}`);
  }

  const supportDefaultCheck = runScript("Validate support drill draft", "scripts/validate-support-drill-evidence.mjs", ["--json"]);
  checks.push(supportDefaultCheck);
  if (!supportDefaultCheck.ok) errors.push("Support drill default validation failed.");

  if (config.supportStrict) {
    const supportStrictCheck = runScript("Validate strict support drill readiness", "scripts/validate-support-drill-evidence.mjs", ["--require-drills-ready", "--json"]);
    checks.push(supportStrictCheck);
    if (!supportStrictCheck.ok) errors.push(`Support drill evidence did not satisfy ${profile} profile.`);
  }

  if (profile === "workflow") {
    if (phoneSummary?.phonePrivateAlphaCandidate === true) {
      warnings.push("Phone summary is already a phone-private-alpha candidate; run --profile phone-alpha for strict promotion validation.");
    }
    if (glassesSummary?.glassesPrivateAlphaCandidate === true) {
      warnings.push("Glasses summary is already a glasses-private-alpha candidate; run --profile glasses-alpha for strict promotion validation.");
    }
    if (phoneSummary?.phonePrivateAlphaCandidate !== true && glassesSummary?.glassesPrivateAlphaCandidate !== true) {
      warnings.push("Workflow evidence only: phone/glasses private alpha candidates are false.");
    }
  }
}

const result = {
  ok: errors.length === 0,
  profile,
  description: config.description,
  packDir: pack.relative,
  generatedAt: new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date()).replace(" ", "T") + "+09:00",
  candidates: {
    phonePrivateAlphaCandidate: phoneSummary?.phonePrivateAlphaCandidate === true,
    phoneDirectionSummaryValidated: phoneSummary?.directionEvidence?.validatorOk === true,
    phoneDirectionManifestApplyDryRunOk: phoneSummary?.directionEvidence?.applyDryRunOk === true,
    phoneDirectionManifestApplyReady: phoneSummary?.directionEvidence?.applyReady === true,
    phoneDirectionProductionCandidate: phoneSummary?.directionEvidence?.productionDirectionCandidate === true,
    glassesHardwareEvidenceCandidate: glassesSummary?.glassesHardwareEvidenceCandidate === true,
    glassesPrivateAlphaCandidate: glassesSummary?.glassesPrivateAlphaCandidate === true,
    supportStrictRequested: config.supportStrict,
  },
  hardwareReadiness: readinessSummary ? {
    authorizedDeviceCount: readinessSummary.adb?.attachedDeviceCount ?? readinessSummary.adb?.authorizedDeviceCount ?? 0,
    canRunPhoneSession: readinessSummary.canRunPhoneSession === true,
    hasMetaApplicationId: readinessSummary.glassesSetup?.hasMetaApplicationId === true,
    hasGithubToken: readinessSummary.glassesSetup?.hasGithubToken === true,
    latestDeviceEvidencePath: readinessSummary.latestDeviceEvidence?.path ?? "",
  } : null,
  checks: checks.map((check) => ({
    label: check.label,
    ok: check.ok,
    exitCode: check.exitCode,
  })),
  errors,
  warnings,
};

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# Hardware Test Promotion Validation");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Profile: ${summary.profile}`);
  lines.push(`Result: ${summary.ok ? "pass" : "fail"}`);
  lines.push(`Pack: ${summary.packDir}`);
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  if (summary.profile === "workflow") {
    lines.push("This is workflow evidence only. It does not approve phone private alpha, glasses private alpha, support readiness, beta, or production.");
  } else if (summary.ok) {
    lines.push(`The ${summary.profile} profile passed against the current operator pack outputs.`);
  } else {
    lines.push(`The ${summary.profile} profile failed and must not be used for a promotion claim.`);
  }
  lines.push("");
  lines.push("## Candidates");
  lines.push("");
  lines.push(`- Phone private alpha candidate: ${summary.candidates.phonePrivateAlphaCandidate}`);
  lines.push(`- Phone direction summary validated: ${summary.candidates.phoneDirectionSummaryValidated}`);
  lines.push(`- Phone direction manifest apply dry-run: ${summary.candidates.phoneDirectionManifestApplyDryRunOk}`);
  lines.push(`- Phone direction manifest apply ready: ${summary.candidates.phoneDirectionManifestApplyReady}`);
  lines.push(`- Phone direction production candidate: ${summary.candidates.phoneDirectionProductionCandidate}`);
  lines.push(`- Glasses hardware evidence candidate: ${summary.candidates.glassesHardwareEvidenceCandidate}`);
  lines.push(`- Glasses private alpha candidate: ${summary.candidates.glassesPrivateAlphaCandidate}`);
  lines.push(`- Support strict requested: ${summary.candidates.supportStrictRequested}`);
  lines.push("");
  lines.push("## Hardware Readiness");
  lines.push("");
  if (summary.hardwareReadiness) {
    lines.push(`- Authorized/attached ADB device count: ${summary.hardwareReadiness.authorizedDeviceCount}`);
    lines.push(`- Can run phone session: ${summary.hardwareReadiness.canRunPhoneSession}`);
    lines.push(`- Meta application id present: ${summary.hardwareReadiness.hasMetaApplicationId}`);
    lines.push(`- GitHub token present: ${summary.hardwareReadiness.hasGithubToken}`);
    lines.push(`- Latest device evidence path: ${summary.hardwareReadiness.latestDeviceEvidencePath || "missing"}`);
  } else {
    lines.push("- Hardware readiness summary missing.");
  }
  lines.push("");
  lines.push("## Checks");
  lines.push("");
  lines.push("| Check | Status | Exit |");
  lines.push("| --- | --- | --- |");
  for (const check of summary.checks) {
    lines.push(`| ${check.label} | ${check.ok ? "pass" : "fail"} | ${check.exitCode ?? "null"} |`);
  }
  lines.push("");
  lines.push("## Errors");
  lines.push("");
  if (summary.errors.length === 0) {
    lines.push("- None.");
  } else {
    for (const error of summary.errors) lines.push(`- ${error}`);
  }
  lines.push("");
  lines.push("## Warnings");
  lines.push("");
  if (summary.warnings.length === 0) {
    lines.push("- None.");
  } else {
    for (const warning of summary.warnings) lines.push(`- ${warning}`);
  }
  lines.push("");
  lines.push("## Privacy Guardrail");
  lines.push("");
  lines.push("This validation report stores only candidate booleans, command labels, pass/fail statuses, exit codes, aggregate readiness counts, and workspace-relative paths. It must not include raw command output, raw audio, transcripts, speaker names, Bluetooth device names, MAC addresses, private alert text, embeddings, or encrypted payload values.");
  return `${lines.join("\n")}\n`;
}

if (wantsWrite) {
  let reportDir = reportDirArg || path.join(pack.relative, "promotion-validation");
  if (!path.isAbsolute(reportDir)) reportDir = path.join(ROOT_DIR, reportDir);
  const relativeReportDir = path.relative(ROOT_DIR, reportDir);
  if (relativeReportDir.startsWith("..") || path.isAbsolute(relativeReportDir)) {
    console.error(`Refusing to write outside workspace: ${reportDir}`);
    process.exit(1);
  }
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, "promotion-validation.json"), `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(path.join(reportDir, "promotion-validation.md"), renderMarkdown(result));
}

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Hardware test promotion validation passed: ${profile}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Hardware test promotion validation failed: ${profile}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
