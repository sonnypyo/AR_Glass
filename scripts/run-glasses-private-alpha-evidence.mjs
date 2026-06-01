#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SESSION = "data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack";
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/92-glasses-private-alpha-evidence-runner";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const runSession = args.includes("--run-session");
const sessionDirArg = valueAfter("--session-dir") || DEFAULT_SESSION;
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;

function usage() {
  return [
    "Usage: scripts/run-glasses-private-alpha-evidence.mjs [options]",
    "",
    "Runs the glasses-private-alpha evidence workflow without persisting raw command output.",
    "",
    "Options:",
    "  --session-dir DIR     Glasses hardware session folder to validate/run.",
    "  --report-dir DIR      Where this runner writes glasses-alpha-evidence-summary.md/json.",
    "  --run-session         Run the session commands.sh before validation.",
    "  --json                Print machine-readable summary.",
    "",
    "Default mode validates the current session, checks hardware gates, dry-runs manifest apply, writes a service audit, and keeps glassesPrivateAlphaCandidate=false until real hardware evidence and promotion gates pass.",
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

function resolveInsideWorkspace(value) {
  const absolute = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to access outside workspace: ${absolute}`);
  }
  return { absolute, relative };
}

function ensureDir(value) {
  const resolved = resolveInsideWorkspace(value);
  fs.mkdirSync(resolved.absolute, { recursive: true });
  return resolved;
}

function summarizeCommandPart(value) {
  if (value === process.execPath) return "node";
  const absoluteCandidate = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, absoluteCandidate);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) return relative;
  return value;
}

function summarizeCommand(command, commandArgs) {
  return [summarizeCommandPart(command), ...commandArgs.map((arg) => summarizeCommandPart(arg))].join(" ");
}

function runStep(label, command, commandArgs, options = {}) {
  const startedAt = kstTimestamp();
  if (!wantsJson) {
    console.log(`\n[run] ${label}`);
  }

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
  const ok = exitCode === 0;
  const endedAt = kstTimestamp();

  if (!wantsJson) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    console.log(`[${ok ? "pass" : "fail"}] ${label} (exit ${exitCode})`);
  }

  return {
    label,
    status: ok ? "pass" : "fail",
    exitCode,
    startedAt,
    endedAt,
    command: options.commandSummary ?? summarizeCommand(command, commandArgs),
    rawOutputPersisted: false,
  };
}

function runExpectedFailure(label, command, commandArgs) {
  const result = runStep(label, command, commandArgs);
  return {
    ...result,
    expectedFailure: result.status === "fail",
    status: result.status === "fail" ? "expected-fail" : "unexpected-pass",
  };
}

function readJson(relativeOrAbsolutePath) {
  const resolved = resolveInsideWorkspace(relativeOrAbsolutePath);
  return JSON.parse(fs.readFileSync(resolved.absolute, "utf8"));
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function deriveNextActions(summary) {
  const actions = [];
  if (!summary.flags.runSession) {
    actions.push("Run this script with `--run-session` only when the Ray-Ban Display, Ray-Ban Gen 1, or Android XR hardware evidence can actually be collected.");
  }
  if (!summary.manifest.metaRayBanDisplayReady) {
    actions.push("Configure Meta DAT credentials outside source control, replace the Meta stub adapter, and collect Ray-Ban Display cue proof.");
  }
  if (!summary.manifest.rayBanGen1FallbackReady) {
    actions.push("Pair Ray-Ban Meta Gen 1, run Bluetooth route proof, and record TTS or phone-vibration fallback evidence without device names.");
  }
  if (!summary.manifest.androidXrProjectedReady) {
    actions.push("Run Android XR projected runtime proof and record runtime availability, ProjectedContext launch/device-context use, cue/empty-state visibility, and microphone or Bluetooth fallback status.");
  }
  if (!summary.manifest.hapticsReadyOrFallbackDocumented) {
    actions.push("Keep phone vibration as the MVP fallback until an official glasses haptics API or documented unavailable status is recorded.");
  }
  if (!summary.glassesPrivateAlphaCandidate) {
    actions.push("Do not claim glasses private alpha until strict glasses hardware validation and the glasses-alpha service gate both pass.");
  }
  actions.push("Regenerate the service readiness audit after every reviewed hardware evidence change.");
  return actions;
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# Glasses Private Alpha Evidence Runner Summary");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("This report summarizes the glasses-private-alpha evidence workflow. It records command statuses, manifest readiness booleans, strict gate results, and next actions without storing raw command output or private device/user data.");
  lines.push("");
  lines.push("## Scope");
  lines.push("");
  lines.push(`- Session directory: \`${summary.sessionDir}\``);
  lines.push(`- Session commands executed: ${summary.flags.runSession ? "yes" : "no"}`);
  lines.push(`- Glasses hardware evidence candidate: ${summary.glassesHardwareEvidenceCandidate ? "yes" : "no"}`);
  lines.push(`- Glasses private alpha candidate: ${summary.glassesPrivateAlphaCandidate ? "yes" : "no"}`);
  lines.push("");
  lines.push("## Manifest Readiness");
  lines.push("");
  lines.push(`- Manifest status: ${summary.manifest.status}`);
  lines.push(`- Meta Ray-Ban Display ready: ${summary.manifest.metaRayBanDisplayReady ? "yes" : "no"}`);
  lines.push(`- Ray-Ban Gen 1 fallback ready: ${summary.manifest.rayBanGen1FallbackReady ? "yes" : "no"}`);
  lines.push(`- Android XR projected ready: ${summary.manifest.androidXrProjectedReady ? "yes" : "no"}`);
  lines.push(`- Haptics ready or fallback documented: ${summary.manifest.hapticsReadyOrFallbackDocumented ? "yes" : "no"}`);
  lines.push(`- Privacy guardrails clear: ${summary.manifest.privacyGuardrailsClear ? "yes" : "no"}`);
  lines.push("");
  lines.push("## Command Results");
  lines.push("");
  lines.push("| Step | Result | Exit Code | Raw Output Persisted |");
  lines.push("| --- | --- | ---: | --- |");
  for (const command of summary.commands) {
    lines.push(`| ${escapeCell(command.label)} | ${command.status} | ${command.exitCode} | ${command.rawOutputPersisted ? "yes" : "no"} |`);
  }
  lines.push("");
  lines.push("## Strict Gate Results");
  lines.push("");
  lines.push(`- Strict glasses hardware validation: ${summary.strictHardwareValidationOk ? "pass" : "not passing"}`);
  lines.push(`- Glasses-alpha service gate: ${summary.strictServiceGateOk ? "pass" : "not passing"}`);
  lines.push("");
  lines.push("## Next Actions");
  lines.push("");
  for (const action of summary.nextActions) {
    lines.push(`- ${action}`);
  }
  lines.push("");
  lines.push("## Privacy Guardrail");
  lines.push("");
  lines.push("This report stores only aggregate status, booleans, exit codes, command labels, timestamps, and workspace-relative paths. It must not contain raw audio, transcripts, speaker names, voice embeddings, encrypted payload values, Bluetooth product names, MAC addresses, private alert text, or exact locations.");
  return `${lines.join("\n")}\n`;
}

const generatedAt = kstTimestamp();
const session = resolveInsideWorkspace(sessionDirArg);
const reportDir = ensureDir(reportDirArg);
const commands = [];

if (runSession) {
  commands.push(runStep("Run glasses hardware session commands", path.join(session.absolute, "commands.sh"), [], {
    commandSummary: path.join(session.relative, "commands.sh"),
  }));
}

commands.push(runStep("Validate glasses hardware session", process.execPath, [
  path.join(ROOT_DIR, "scripts/validate-glasses-hardware-session.mjs"),
  session.relative,
  "--json",
]));
commands.push(runStep("Validate glasses hardware evidence draft", process.execPath, [
  path.join(ROOT_DIR, "scripts/validate-glasses-hardware-evidence.mjs"),
  "--json",
]));
commands.push(runExpectedFailure("Check strict glasses hardware validation", process.execPath, [
  path.join(ROOT_DIR, "scripts/validate-glasses-hardware-evidence.mjs"),
  "--require-glasses-alpha-ready",
  "--json",
]));
commands.push(runStep("Dry-run glasses hardware manifest apply", process.execPath, [
  path.join(ROOT_DIR, "scripts/apply-glasses-hardware-session.mjs"),
  session.relative,
  "--json",
]));
commands.push(runExpectedFailure("Check glasses-alpha service gate", process.execPath, [
  path.join(ROOT_DIR, "scripts/assert-service-gates.mjs"),
  "--profile",
  "glasses-alpha",
  "--json",
]));
commands.push(runStep("Write service readiness audit", process.execPath, [
  path.join(ROOT_DIR, "scripts/audit-service-readiness.mjs"),
  "--write-report",
  "--report-dir",
  path.join(reportDir.absolute, "service-readiness-audit"),
]));

const template = readJson(path.join(session.relative, "manifest-update-template.json"));
const strictHardwareValidationOk = commands.find((command) => command.label === "Check strict glasses hardware validation")?.status === "unexpected-pass";
const strictServiceGateOk = commands.find((command) => command.label === "Check glasses-alpha service gate")?.status === "unexpected-pass";
const privacyGuardrailsClear = Object.values(template.privacy ?? {}).every((value) => value === false);
const metaRayBanDisplayReady = template.metaRayBanDisplay?.status === "passed" &&
  template.metaRayBanDisplay?.adapterStatus === "real_adapter" &&
  template.metaRayBanDisplay?.cueRenderedOnDisplay === true;
const rayBanGen1FallbackReady = template.rayBanGen1BluetoothFallback?.status === "passed" ||
  template.rayBanGen1BluetoothFallback?.status === "documented_unavailable";
const androidXr = template.androidXrProjected ?? {};
const androidXrProjectedReady = androidXr.status === "passed" &&
  androidXr.adapterStatus === "real_adapter" &&
  androidXr.runtimeAvailable === true &&
  androidXr.jetpackProjectedDependenciesResolved === true &&
  androidXr.projectedActivityLaunched === true &&
  androidXr.projectedContextUsed === true &&
  androidXr.cueVisibleOnProjectedDisplay === true &&
  androidXr.emptyStateVisible === true &&
  (androidXr.microphoneAccessTested === true || androidXr.bluetoothFallbackTested === true) &&
  androidXr.failureStateDocumented === true;
const hapticsReadyOrFallbackDocumented = template.haptics?.status === "passed" ||
  (template.haptics?.status === "documented_not_available" && template.haptics?.phoneVibrationFallbackRemainsMvp === true);
const glassesHardwareEvidenceCandidate = strictHardwareValidationOk &&
  template.status === "GLASSES_HARDWARE_EVIDENCE_COLLECTED" &&
  metaRayBanDisplayReady &&
  rayBanGen1FallbackReady &&
  androidXrProjectedReady &&
  hapticsReadyOrFallbackDocumented &&
  privacyGuardrailsClear;
const glassesPrivateAlphaCandidate = glassesHardwareEvidenceCandidate && strictServiceGateOk;

const summary = {
  schemaVersion: 1,
  ok: commands.every((command) => command.status === "pass" || command.status === "expected-fail"),
  generatedAt,
  reportDir: reportDir.relative,
  reportPath: path.join(reportDir.relative, "glasses-alpha-evidence-summary.md"),
  summaryJsonPath: path.join(reportDir.relative, "glasses-alpha-evidence-summary.json"),
  serviceReadinessAuditPath: path.join(reportDir.relative, "service-readiness-audit", "service-readiness-audit.md"),
  sessionDir: session.relative,
  flags: {
    runSession,
  },
  manifest: {
    status: template.status ?? "",
    metaRayBanDisplayReady,
    rayBanGen1FallbackReady,
    androidXrProjectedReady,
    hapticsReadyOrFallbackDocumented,
    privacyGuardrailsClear,
  },
  strictHardwareValidationOk,
  strictServiceGateOk,
  glassesHardwareEvidenceCandidate,
  glassesPrivateAlphaCandidate,
  rawOutputPersisted: false,
  commands,
  errors: commands
    .filter((command) => command.status === "fail" || command.status === "unexpected-pass")
    .map((command) => `${command.label} returned ${command.status} with exit ${command.exitCode}.`),
  warnings: [],
};
summary.nextActions = deriveNextActions(summary);

fs.writeFileSync(path.join(reportDir.absolute, "glasses-alpha-evidence-summary.md"), renderMarkdown(summary));
fs.writeFileSync(path.join(reportDir.absolute, "glasses-alpha-evidence-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

if (wantsJson) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`\nGlasses alpha evidence summary written: ${path.join(reportDir.absolute, "glasses-alpha-evidence-summary.md")}`);
}

process.exit(summary.ok ? 0 : 1);
