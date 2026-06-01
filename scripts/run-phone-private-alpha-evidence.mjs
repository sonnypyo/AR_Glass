#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_JAVA_HOME = path.join(ROOT_DIR, ".toolchains/jdk-17.0.19+10/Contents/Home");
const APP_DIR = "apps/voice-direction-glass";
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner";
const DEFAULT_EVIDENCE_DIR = `${DEFAULT_REPORT_DIR}/android-phone-smoke`;
const PACKAGE_LABEL = "Voice Direction Glass";

const args = process.argv.slice(2);
const showHelp = args.includes("--help") || args.includes("-h");
const wantsJson = args.includes("--json");
const skipBuild = args.includes("--skip-build");
const mainOnly = args.includes("--main-only");
const allowNoDevice = args.includes("--allow-no-device");
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;
const evidenceDirArg = valueAfter("--evidence-dir") || DEFAULT_EVIDENCE_DIR;

function usage() {
  return [
    "Usage: scripts/run-phone-private-alpha-evidence.mjs [options]",
    "",
    "Runs the phone-private-alpha evidence path and writes a non-PII summary.",
    "",
    "Options:",
    "  --skip-build          Skip Gradle test/assembleDebug and run the smoke script with the existing APK.",
    "  --main-only           Do not launch the projected cue Activity during the smoke script.",
    "  --evidence-dir DIR    Where android-device-smoke-test.sh writes device-evidence.md.",
    "  --report-dir DIR      Where this runner writes phone-alpha-evidence-summary.md/json.",
    "  --allow-no-device     Treat missing/invalid ADB phone as a documented local dry run instead of command failure.",
    "  --json                Print the summary JSON.",
    "",
    "The report stores only aggregate statuses, exit codes, counts, and workspace-relative paths.",
  ].join("\n");
}

if (showHelp) {
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

function resolveInsideWorkspace(value) {
  const absolute = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to access outside workspace: ${absolute}`);
  }
  return { absolute, relative };
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

function adbStatus() {
  const androidHome = process.env.ANDROID_HOME || "/Users/sonjunpyo/Library/Android/sdk";
  const adbPath = process.env.ADB || path.join(androidHome, "platform-tools", "adb");
  const counts = { device: 0, unauthorized: 0, offline: 0, other: 0 };
  if (!fs.existsSync(adbPath)) {
    return {
      adbExecutable: false,
      authorizedDeviceCount: 0,
      unauthorizedDeviceCount: 0,
      offlineDeviceCount: 0,
      otherDeviceCount: 0,
    };
  }

  const result = spawnSync(adbPath, ["devices"], { cwd: ROOT_DIR, encoding: "utf8" });
  if (result.status !== 0) {
    return {
      adbExecutable: true,
      authorizedDeviceCount: 0,
      unauthorizedDeviceCount: 0,
      offlineDeviceCount: 0,
      otherDeviceCount: 0,
    };
  }

  for (const line of result.stdout.split(/\r?\n/).slice(1)) {
    const columns = line.trim().split(/\s+/);
    if (columns.length < 2) continue;
    if (columns[1] === "device") counts.device += 1;
    else if (columns[1] === "unauthorized") counts.unauthorized += 1;
    else if (columns[1] === "offline") counts.offline += 1;
    else counts.other += 1;
  }

  return {
    adbExecutable: true,
    authorizedDeviceCount: counts.device,
    unauthorizedDeviceCount: counts.unauthorized,
    offlineDeviceCount: counts.offline,
    otherDeviceCount: counts.other,
  };
}

function shellStatus(result) {
  if (typeof result.status === "number") return result.status;
  return result.error ? 1 : 1;
}

function runStep(label, command, commandArgs, options = {}) {
  const startedAt = kstTimestamp();
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT_DIR,
    encoding: "utf8",
    env: {
      ...process.env,
      JAVA_HOME: process.env.JAVA_HOME || DEFAULT_JAVA_HOME,
      ANDROID_HOME: process.env.ANDROID_HOME || "/Users/sonjunpyo/Library/Android/sdk",
    },
  });
  const exitCode = shellStatus(result);
  return {
    label,
    status: exitCode === 0 ? "pass" : "fail",
    exitCode,
    startedAt,
    endedAt: kstTimestamp(),
    command: options.commandSummary ?? [command, ...commandArgs].map(commandPart).join(" "),
    rawOutputPersisted: false,
  };
}

function runJsonStep(label, command, commandArgs, options = {}) {
  const startedAt = kstTimestamp();
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT_DIR,
    encoding: "utf8",
    env: {
      ...process.env,
      JAVA_HOME: process.env.JAVA_HOME || DEFAULT_JAVA_HOME,
      ANDROID_HOME: process.env.ANDROID_HOME || "/Users/sonjunpyo/Library/Android/sdk",
    },
  });
  const exitCode = shellStatus(result);
  let parsedJson = null;
  try {
    parsedJson = result.stdout ? JSON.parse(result.stdout) : null;
  } catch {
    parsedJson = null;
  }
  return {
    step: {
      label,
      status: exitCode === 0 ? "pass" : "fail",
      exitCode,
      startedAt,
      endedAt: kstTimestamp(),
      command: options.commandSummary ?? [command, ...commandArgs].map(commandPart).join(" "),
      rawOutputPersisted: false,
    },
    parsedJson,
  };
}

function commandPart(value) {
  const absoluteCandidate = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, absoluteCandidate);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) return relative;
  if (value === process.execPath) return "node";
  return value;
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# Phone Private Alpha Evidence Runner Summary");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push(`This report summarizes the phone-private-alpha evidence run for ${PACKAGE_LABEL}. It coordinates debug build/test, Android phone smoke evidence, device-evidence validation, and service-readiness audit generation without storing raw command output.`);
  lines.push("");
  lines.push("## Inputs");
  lines.push("");
  lines.push(`- Evidence dir: \`${summary.evidenceDir}\``);
  lines.push(`- Report dir: \`${summary.reportDir}\``);
  lines.push(`- Device evidence path: \`${summary.deviceEvidencePath}\``);
  lines.push("");
  lines.push("## ADB Counts");
  lines.push("");
  lines.push(`- ADB executable: ${summary.adb.adbExecutable ? "yes" : "no"}`);
  lines.push(`- Authorized devices: ${summary.adb.authorizedDeviceCount}`);
  lines.push(`- Unauthorized devices: ${summary.adb.unauthorizedDeviceCount}`);
  lines.push(`- Offline devices: ${summary.adb.offlineDeviceCount}`);
  lines.push(`- Other device rows: ${summary.adb.otherDeviceCount}`);
  lines.push("");
  lines.push("## Command Results");
  lines.push("");
  lines.push("| Step | Result | Exit Code | Raw Output Persisted |");
  lines.push("| --- | --- | ---: | --- |");
  for (const command of summary.commands) {
    lines.push(`| ${escapeCell(command.label)} | ${command.status} | ${command.exitCode} | ${command.rawOutputPersisted ? "yes" : "no"} |`);
  }
  lines.push("");
  lines.push("## Evidence Result");
  lines.push("");
  lines.push(`- Device evidence exists: ${summary.deviceEvidence.exists ? "yes" : "no"}`);
  lines.push(`- Device evidence validator: ${summary.deviceEvidence.validatorOk ? "pass" : "not ready"}`);
  lines.push(`- Direction evidence summary exists: ${summary.directionEvidence.exists ? "yes" : "no"}`);
  lines.push(`- Direction evidence summary validator: ${summary.directionEvidence.validatorOk ? "pass" : "not ready"}`);
  lines.push(`- Direction manifest apply dry-run: ${summary.directionEvidence.applyDryRunOk ? "pass" : "not ready"}`);
  lines.push(`- Direction manifest apply ready: ${summary.directionEvidence.applyReady ? "yes" : "no"}`);
  lines.push(`- Direction production candidate: ${summary.directionEvidence.productionDirectionCandidate ? "yes" : "no"}`);
  lines.push(`- Direction summary path: \`${summary.directionEvidence.summaryPath}\``);
  lines.push(`- Direction canonical manifest path: \`${summary.directionEvidence.canonicalManifestPath}\``);
  lines.push(`- Service readiness audit path: \`${summary.serviceReadinessAuditPath}\``);
  lines.push(`- Phone private alpha candidate: ${summary.phonePrivateAlphaCandidate ? "yes" : "no"}`);
  lines.push("");
  lines.push("## Next Actions");
  lines.push("");
  for (const action of summary.nextActions) {
    lines.push(`- ${action}`);
  }
  lines.push("");
  lines.push("## Privacy Guardrail");
  lines.push("");
  lines.push("This report stores only aggregate statuses, exit codes, booleans, counts, timestamps, and workspace-relative paths. It must not store ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, encrypted payload values, private alert text, or exact locations.");
  return `${lines.join("\n")}\n`;
}

function deriveNextActions(summary) {
  const actions = [];
  if (summary.adb.authorizedDeviceCount !== 1) {
    actions.push("Keep this runner for the real phone hardware step; it will need exactly one authorized Android phone and no `--allow-no-device`.");
  }
  if (!summary.deviceEvidence.exists) {
    actions.push("Create phone `device-evidence.md` only during a real phone hardware step with this runner or `scripts/android-device-smoke-test.sh --write-evidence`.");
  }
  if (summary.deviceEvidence.exists && !summary.deviceEvidence.validatorOk) {
    actions.push("Open the generated device evidence report, fill required manual rows, then rerun `scripts/validate-device-evidence.mjs <device-evidence.md> --json`.");
  }
  if (!summary.directionEvidence.exists) {
    actions.push("Extract direction evidence with `scripts/extract-direction-evidence-summary.mjs <device-evidence.md> --json` after a real phone report exists.");
  }
  if (summary.directionEvidence.exists && !summary.directionEvidence.validatorOk) {
    actions.push("Validate the generated direction evidence summary with `scripts/validate-direction-evidence-summary.mjs <summary.json> --json`.");
  }
  if (summary.directionEvidence.exists && summary.directionEvidence.validatorOk && !summary.directionEvidence.applyDryRunOk) {
    actions.push("Run `scripts/apply-direction-evidence-summary.mjs <summary.json> --json` to check whether the canonical direction manifest can be promoted.");
  }
  if (summary.directionEvidence.applyDryRunOk && !summary.directionEvidence.applyReady) {
    actions.push("Keep the canonical direction manifest in draft state; apply dry-run says strict direction evidence is not ready.");
  }
  if (!summary.directionEvidence.productionDirectionCandidate) {
    actions.push("Keep front/back and production direction claims blocked until strict direction summary and direction accuracy validation pass.");
  }
  actions.push("Observe the app's `릴리스 준비` card on the phone and confirm phone/glasses/beta/production stay not-ready or blocked until matching evidence exists.");
  actions.push("Run 30-minute false-positive testing and controlled direction trials before any tester-facing alpha claim.");
  actions.push("Regenerate the service-readiness audit after every phone evidence update.");
  return actions;
}

const generatedAt = kstTimestamp();
const reportDir = resolveInsideWorkspace(reportDirArg);
const evidenceDir = resolveInsideWorkspace(evidenceDirArg);
fs.mkdirSync(reportDir.absolute, { recursive: true });
fs.mkdirSync(evidenceDir.absolute, { recursive: true });

const deviceEvidencePath = path.join(evidenceDir.relative, "device-evidence.md");
const serviceReadinessAuditPath = path.join(reportDir.relative, "service-readiness-audit", "service-readiness-audit.md");
const adb = adbStatus();
const commands = [];

if (!skipBuild) {
  commands.push(runStep("Gradle test and debug APK build", path.join(ROOT_DIR, APP_DIR, "gradlew"), [
    "--no-daemon",
    "test",
    "assembleDebug",
  ], {
    commandSummary: "cd apps/voice-direction-glass && ./gradlew --no-daemon test assembleDebug",
  }));
}

const smokeArgs = [
  path.join(ROOT_DIR, "scripts/android-device-smoke-test.sh"),
  "--skip-build",
  "--write-evidence",
  "--evidence-dir",
  evidenceDir.absolute,
];
if (mainOnly) smokeArgs.splice(2, 0, "--main-only");
commands.push(runStep("Android phone smoke evidence", "bash", smokeArgs, {
  commandSummary: `scripts/android-device-smoke-test.sh --skip-build ${mainOnly ? "--main-only " : ""}--write-evidence --evidence-dir ${evidenceDir.relative}`.replace(/\s+/g, " ").trim(),
}));

const deviceEvidenceExists = fs.existsSync(path.join(ROOT_DIR, deviceEvidencePath));
let validatorOk = false;
let validatorExitCode = null;
const directionEvidenceDir = path.join(reportDir.relative, "direction-evidence");
const directionEvidenceSummaryPath = path.join(directionEvidenceDir, "direction-evidence-summary.json");
const directionEvidenceMarkdownPath = path.join(directionEvidenceDir, "direction-evidence-summary.md");
const directionManifestTemplatePath = path.join(directionEvidenceDir, "manifest-update-template.json");
let directionExtractorOk = false;
let directionExtractorExitCode = null;
let directionValidatorOk = false;
let directionValidatorExitCode = null;
let directionApplyDryRunOk = false;
let directionApplyDryRunExitCode = null;
let directionApplyReady = false;
let directionApplyWroteManifest = false;
let directionApplyWroteAggregateEvidence = false;
let directionProductionCandidate = false;
let directionFixtureEvidence = null;
let directionTotalTrials = null;
if (deviceEvidenceExists) {
  const validation = runStep("Device evidence validator", process.execPath, [
    path.join(ROOT_DIR, "scripts/validate-device-evidence.mjs"),
    path.join(ROOT_DIR, deviceEvidencePath),
    "--json",
  ], {
    commandSummary: `node scripts/validate-device-evidence.mjs ${deviceEvidencePath} --json`,
  });
  commands.push(validation);
  validatorOk = validation.status === "pass";
  validatorExitCode = validation.exitCode;

  const directionExtraction = runStep("Direction evidence summary extraction", process.execPath, [
    path.join(ROOT_DIR, "scripts/extract-direction-evidence-summary.mjs"),
    path.join(ROOT_DIR, deviceEvidencePath),
    "--report-dir",
    path.join(ROOT_DIR, directionEvidenceDir),
    "--json",
  ], {
    commandSummary: `node scripts/extract-direction-evidence-summary.mjs ${deviceEvidencePath} --report-dir ${directionEvidenceDir} --json`,
  });
  commands.push(directionExtraction);
  directionExtractorOk = directionExtraction.status === "pass";
  directionExtractorExitCode = directionExtraction.exitCode;

  const absoluteDirectionSummary = path.join(ROOT_DIR, directionEvidenceSummaryPath);
  if (fs.existsSync(absoluteDirectionSummary)) {
    try {
      const directionSummary = JSON.parse(fs.readFileSync(absoluteDirectionSummary, "utf8"));
      directionProductionCandidate = directionSummary.productionDirectionCandidate === true;
      directionFixtureEvidence = directionSummary.fixtureEvidence === true;
      directionTotalTrials = typeof directionSummary.aggregateEvaluation?.totalTrials === "number"
        ? directionSummary.aggregateEvaluation.totalTrials
        : null;
    } catch {
      directionProductionCandidate = false;
      directionFixtureEvidence = null;
      directionTotalTrials = null;
    }
  }

  const directionValidation = runStep("Direction evidence summary validator", process.execPath, [
    path.join(ROOT_DIR, "scripts/validate-direction-evidence-summary.mjs"),
    path.join(ROOT_DIR, directionEvidenceSummaryPath),
    "--json",
  ], {
    commandSummary: `node scripts/validate-direction-evidence-summary.mjs ${directionEvidenceSummaryPath} --json`,
  });
  commands.push(directionValidation);
  directionValidatorOk = directionValidation.status === "pass";
  directionValidatorExitCode = directionValidation.exitCode;

  const directionApplyDryRun = runJsonStep("Direction evidence manifest apply dry-run", process.execPath, [
    path.join(ROOT_DIR, "scripts/apply-direction-evidence-summary.mjs"),
    path.join(ROOT_DIR, directionEvidenceSummaryPath),
    "--json",
  ], {
    commandSummary: `node scripts/apply-direction-evidence-summary.mjs ${directionEvidenceSummaryPath} --json`,
  });
  commands.push(directionApplyDryRun.step);
  directionApplyDryRunOk = directionApplyDryRun.step.status === "pass";
  directionApplyDryRunExitCode = directionApplyDryRun.step.exitCode;
  directionApplyReady = directionApplyDryRun.parsedJson?.applyReady === true;
  directionApplyWroteManifest = directionApplyDryRun.parsedJson?.wroteManifest === true;
  directionApplyWroteAggregateEvidence = directionApplyDryRun.parsedJson?.wroteAggregateEvidence === true;
} else {
  commands.push({
    label: "Device evidence validator",
    status: "skipped",
    exitCode: null,
    startedAt: kstTimestamp(),
    endedAt: kstTimestamp(),
    command: `node scripts/validate-device-evidence.mjs ${deviceEvidencePath} --json`,
    rawOutputPersisted: false,
  });
  commands.push({
    label: "Direction evidence summary extraction",
    status: "skipped",
    exitCode: null,
    startedAt: kstTimestamp(),
    endedAt: kstTimestamp(),
    command: `node scripts/extract-direction-evidence-summary.mjs ${deviceEvidencePath} --report-dir ${directionEvidenceDir} --json`,
    rawOutputPersisted: false,
  });
  commands.push({
    label: "Direction evidence summary validator",
    status: "skipped",
    exitCode: null,
    startedAt: kstTimestamp(),
    endedAt: kstTimestamp(),
    command: `node scripts/validate-direction-evidence-summary.mjs ${directionEvidenceSummaryPath} --json`,
    rawOutputPersisted: false,
  });
  commands.push({
    label: "Direction evidence manifest apply dry-run",
    status: "skipped",
    exitCode: null,
    startedAt: kstTimestamp(),
    endedAt: kstTimestamp(),
    command: `node scripts/apply-direction-evidence-summary.mjs ${directionEvidenceSummaryPath} --json`,
    rawOutputPersisted: false,
  });
}

const audit = runStep("Service readiness audit", process.execPath, [
  path.join(ROOT_DIR, "scripts/audit-service-readiness.mjs"),
  "--write-report",
  "--report-dir",
  path.join(reportDir.absolute, "service-readiness-audit"),
], {
  commandSummary: `node scripts/audit-service-readiness.mjs --write-report --report-dir ${path.join(reportDir.relative, "service-readiness-audit")}`,
});
commands.push(audit);

const summary = {
  ok: false,
  generatedAt,
  reportDir: reportDir.relative,
  evidenceDir: evidenceDir.relative,
  deviceEvidencePath,
  serviceReadinessAuditPath,
  adb,
  flags: {
    skipBuild,
    mainOnly,
    allowNoDevice,
  },
  commands,
  deviceEvidence: {
    exists: deviceEvidenceExists,
    validatorOk,
    validatorExitCode,
  },
  directionEvidence: {
    exists: fs.existsSync(path.join(ROOT_DIR, directionEvidenceSummaryPath)),
    extractorOk: directionExtractorOk,
    extractorExitCode: directionExtractorExitCode,
    validatorOk: directionValidatorOk,
    validatorExitCode: directionValidatorExitCode,
    applyDryRunOk: directionApplyDryRunOk,
    applyDryRunExitCode: directionApplyDryRunExitCode,
    applyReady: directionApplyReady,
    applyWroteManifest: directionApplyWroteManifest,
    applyWroteAggregateEvidence: directionApplyWroteAggregateEvidence,
    productionDirectionCandidate: directionProductionCandidate,
    fixtureEvidence: directionFixtureEvidence,
    totalTrials: directionTotalTrials,
    reportDir: directionEvidenceDir,
    summaryPath: directionEvidenceSummaryPath,
    summaryMarkdownPath: directionEvidenceMarkdownPath,
    manifestUpdateTemplatePath: directionManifestTemplatePath,
    canonicalManifestPath: "apps/voice-direction-glass/direction-evidence/manifest.json",
    aggregateEvidencePath: "apps/voice-direction-glass/direction-evidence/aggregate-direction-evidence-summary.json",
  },
  phonePrivateAlphaCandidate: false,
  nextActions: [],
};

summary.phonePrivateAlphaCandidate = summary.deviceEvidence.exists &&
  summary.deviceEvidence.validatorOk &&
  summary.directionEvidence.exists &&
  summary.directionEvidence.validatorOk &&
  summary.adb.authorizedDeviceCount === 1 &&
  commands.every((command) => command.status === "pass");
summary.nextActions = deriveNextActions(summary);

const hardFailure = commands.some((command) => command.status === "fail");
const toleratedNoDeviceDryRun = allowNoDevice &&
  summary.adb.authorizedDeviceCount !== 1 &&
  commands.every((command) => (
    command.status === "pass" ||
    command.label === "Android phone smoke evidence" ||
    command.label === "Device evidence validator" ||
    command.label === "Direction evidence summary extraction" ||
    command.label === "Direction evidence summary validator" ||
    command.label === "Direction evidence manifest apply dry-run"
  ));
summary.ok = summary.phonePrivateAlphaCandidate || toleratedNoDeviceDryRun;

fs.writeFileSync(path.join(reportDir.absolute, "phone-alpha-evidence-summary.md"), renderMarkdown(summary));
fs.writeFileSync(path.join(reportDir.absolute, "phone-alpha-evidence-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

if (wantsJson) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  process.stdout.write(renderMarkdown(summary));
}

if (summary.ok) {
  process.exit(0);
}
process.exit(hardFailure ? 1 : 1);
