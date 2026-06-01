#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner";
const DASHBOARD_SCRIPT = "scripts/summarize-hardware-test-status.mjs";
const NEXT_ACTIONS_SCRIPT = "scripts/recommend-hardware-next-actions.mjs";
const OPERATOR_PACK_COMMAND = "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh";
const PHONE_ACTION_ID = "run-phone-lane";
const PHONE_ACTION_COMMAND = `RUN_PHONE=1 ${OPERATOR_PACK_COMMAND}`;

const args = process.argv.slice(2);
const wantsHelp = args.includes("--help") || args.includes("-h");
const wantsJson = args.includes("--json");
const wantsWriteReport = args.includes("--write-report");
const wantsExecute = args.includes("--execute");
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;

function usage() {
  return [
    "Usage: scripts/run-phone-lane-hardware.mjs [--execute] [--write-report] [--report-dir DIR] [--json]",
    "",
    "Refreshes the hardware dashboard, refreshes next actions, and checks whether the Android phone lane is ready.",
    "With --execute, runs RUN_PHONE=1 only when the refreshed phone lane action is ready and allow-listed.",
    "The execution path suppresses raw child command output and records only non-PII status metadata.",
    "",
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

function commandPart(value) {
  if (value === process.execPath) return "node";
  const absoluteCandidate = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, absoluteCandidate);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) return relative;
  return value;
}

function runJsonStep(label, command, commandArgs) {
  const startedAt = kstTimestamp();
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT_DIR,
    encoding: "utf8",
    env: {
      ...process.env,
      JAVA_HOME: process.env.JAVA_HOME || "/Users/sonjunpyo/Documents/Project/glass/.toolchains/jdk-17.0.19+10/Contents/Home",
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
    step: {
      label,
      status: exitCode === 0 && parseOk ? "pass" : "fail",
      exitCode,
      parseOk,
      startedAt,
      endedAt: kstTimestamp(),
      command: [command, ...commandArgs].map(commandPart).join(" "),
      rawOutputPersisted: false,
    },
    parsedJson,
  };
}

function executePhoneLane() {
  const startedAt = kstTimestamp();
  const startedMs = Date.now();
  const scriptPath = resolveInsideWorkspace(OPERATOR_PACK_COMMAND);
  const result = spawnSync("bash", [scriptPath.absolute], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      RUN_PHONE: "1",
      JAVA_HOME: process.env.JAVA_HOME || "/Users/sonjunpyo/Documents/Project/glass/.toolchains/jdk-17.0.19+10/Contents/Home",
      ANDROID_HOME: process.env.ANDROID_HOME || "/Users/sonjunpyo/Library/Android/sdk",
    },
    stdio: "ignore",
  });
  const exitCode = typeof result.status === "number" ? result.status : 1;
  return {
    label: "Execute phone lane",
    status: exitCode === 0 ? "pass" : "fail",
    exitCode,
    signal: result.signal,
    startedAt,
    endedAt: kstTimestamp(),
    durationMs: Date.now() - startedMs,
    command: PHONE_ACTION_COMMAND,
    rawOutputPersisted: false,
  };
}

function actionById(nextActions, id) {
  return (nextActions?.actions ?? []).find((action) => action.id === id) ?? null;
}

function laneByLabel(dashboard, label) {
  return (dashboard?.lanes ?? []).find((lane) => lane.label === label) ?? null;
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# Phone Lane Hardware Runner");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("This runner refreshes the hardware dashboard, refreshes the next-action brief, checks the Android phone evidence lane, and optionally executes `RUN_PHONE=1` only when the refreshed action is ready.");
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  lines.push(`- Mode: ${summary.mode}`);
  lines.push(`- Status: ${summary.status}`);
  lines.push(`- Phone ready to collect: ${summary.phoneReadyToCollect}`);
  lines.push(`- Phone action status: ${summary.phoneActionStatus}`);
  lines.push(`- Execution allowed: ${summary.executionAllowed}`);
  lines.push(`- Executed: ${summary.executed}`);
  lines.push(`- Execution exit code: ${summary.execution.exitCode ?? "-"}`);
  lines.push("");
  lines.push("## Blockers And Gaps");
  lines.push("");
  lines.push(`- Collection blockers: ${summary.phoneCollectionBlockers.join("; ") || "-"}`);
  lines.push(`- Evidence gaps after collection: ${summary.phoneEvidenceGaps.join("; ") || "-"}`);
  lines.push("");
  lines.push("## Step Results");
  lines.push("");
  lines.push("| Step | Result | Exit Code | Parsed JSON | Raw Output Persisted |");
  lines.push("| --- | --- | ---: | --- | --- |");
  for (const step of summary.steps) {
    lines.push(`| ${escapeCell(step.label)} | ${step.status} | ${step.exitCode} | ${step.parseOk ? "yes" : "no"} | ${step.rawOutputPersisted ? "yes" : "no"} |`);
  }
  if (summary.execution.attempted) {
    lines.push(`| Execute phone lane | ${summary.execution.status} | ${summary.execution.exitCode ?? "-"} | n/a | ${summary.execution.rawOutputPersisted ? "yes" : "no"} |`);
  }
  lines.push("");
  lines.push("## Evidence Paths");
  lines.push("");
  lines.push(`- Dashboard JSON: \`${summary.dashboardJsonPath}\``);
  lines.push(`- Next actions JSON: \`${summary.nextActionsJsonPath}\``);
  lines.push(`- Operator pack command: \`${OPERATOR_PACK_COMMAND}\``);
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

function deriveNextActions(summary) {
  const next = [];
  if (!summary.phoneReadyToCollect) {
    next.push("Attach exactly one authorized Android phone and rerun this runner.");
  }
  if (summary.phoneReadyToCollect && !summary.executed) {
    next.push("Rerun with `--execute --write-report --json` only if the attached phone is the intended test device.");
  }
  if (summary.executed && summary.execution.exitCode === 0) {
    next.push("Validate generated phone evidence, direction summary, manifest apply dry-run, and promotion profiles before making any phone-alpha claim.");
  }
  if (summary.phoneEvidenceGaps.length > 0) {
    next.push("Close post-run evidence gaps before changing phone alpha or direction promotion status.");
  }
  return next;
}

const errors = [];
let reportDir = null;
try {
  reportDir = resolveInsideWorkspace(reportDirArg);
} catch (error) {
  errors.push(error.message);
}

const dashboardRun = runJsonStep("Refresh hardware dashboard", process.execPath, [
  DASHBOARD_SCRIPT,
  "--write-report",
  "--json",
]);
const nextRun = runJsonStep("Refresh hardware next actions", process.execPath, [
  NEXT_ACTIONS_SCRIPT,
  "--write-report",
  "--json",
]);

const dashboard = dashboardRun.parsedJson;
const nextActions = nextRun.parsedJson;
const phoneLane = laneByLabel(dashboard, "Phone evidence");
const phoneAction = actionById(nextActions, PHONE_ACTION_ID);
const phoneCollectionBlockers = dashboard?.collectionReadiness?.phoneCollectionBlockers ?? phoneLane?.blockers ?? [];
const phoneEvidenceGaps = dashboard?.collectionReadiness?.phoneEvidenceGaps ?? phoneLane?.evidenceGaps ?? [];
const phoneReadyToCollect = dashboard?.collectionReadiness?.phoneReadyToCollect === true && phoneAction?.status === "ready";

if (!dashboardRun.parsedJson) errors.push("Could not parse refreshed hardware dashboard JSON.");
if (!nextRun.parsedJson) errors.push("Could not parse refreshed hardware next-action JSON.");
if (!phoneAction) errors.push("Phone lane action missing from next-action brief.");
if (phoneAction && phoneAction.command !== PHONE_ACTION_COMMAND) errors.push("Phone lane command does not match the allow-list.");
if (phoneAction && phoneAction.status !== "ready") errors.push(`Phone lane is not ready: ${phoneAction.status}.`);
if (phoneCollectionBlockers.length > 0) errors.push(`Phone collection blockers remain: ${phoneCollectionBlockers.join("; ")}`);

let execution = {
  attempted: false,
  status: "not-run",
  exitCode: null,
  signal: null,
  durationMs: 0,
  rawOutputPersisted: false,
};

let executed = false;
if (wantsExecute && phoneReadyToCollect && phoneAction?.command === PHONE_ACTION_COMMAND && phoneCollectionBlockers.length === 0) {
  const executionResult = executePhoneLane();
  execution = {
    attempted: true,
    status: executionResult.status,
    exitCode: executionResult.exitCode,
    signal: executionResult.signal,
    durationMs: executionResult.durationMs,
    rawOutputPersisted: false,
  };
  executed = true;
  if (executionResult.exitCode !== 0) {
    errors.push(`Phone lane command exited with ${executionResult.exitCode ?? executionResult.signal}.`);
  }
}

const executionAllowed = phoneReadyToCollect && phoneAction?.command === PHONE_ACTION_COMMAND && phoneCollectionBlockers.length === 0;
const summary = {
  ok: errors.length === 0,
  generatedAt: kstTimestamp(),
  mode: wantsExecute ? "execute" : "dry-run",
  status: executionAllowed ? (wantsExecute ? (execution.exitCode === 0 ? "executed" : "execution-failed") : "ready") : "blocked",
  reportDir: reportDir?.relative ?? reportDirArg,
  reportPath: reportDir ? path.join(reportDir.relative, "phone-lane-hardware-runner.md") : null,
  summaryJsonPath: reportDir ? path.join(reportDir.relative, "phone-lane-hardware-runner.json") : null,
  dashboardJsonPath: dashboard?.summaryJsonPath ?? "data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard/hardware-test-status-dashboard.json",
  nextActionsJsonPath: nextActions?.summaryJsonPath ?? "data/runs/20260528_voice_direction_mvp/111-hardware-next-actions/hardware-next-actions.json",
  phoneReadyToCollect,
  phoneActionStatus: phoneAction?.status ?? "missing",
  phoneActionCommand: phoneAction?.command ?? "",
  phoneCollectionBlockers,
  phoneEvidenceGaps,
  counts: {
    authorizedAdbDevices: dashboard?.counts?.authorizedAdbDevices ?? 0,
    unauthorizedAdbDevices: dashboard?.counts?.unauthorizedAdbDevices ?? 0,
    offlineAdbDevices: dashboard?.counts?.offlineAdbDevices ?? 0,
  },
  executionAllowed,
  executed,
  execution,
  steps: [dashboardRun.step, nextRun.step],
  errors,
  nextActions: [],
  rawOutputPersisted: false,
  privacyGuardrail: "This report stores only aggregate statuses, exit codes, booleans, counts, timestamps, command labels, and workspace-relative paths. It must not store raw child command output, ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, encrypted payload values, private alert text, or exact locations.",
};
summary.nextActions = deriveNextActions(summary);

if (wantsWriteReport && reportDir) {
  fs.mkdirSync(reportDir.absolute, { recursive: true });
  fs.writeFileSync(path.join(reportDir.absolute, "phone-lane-hardware-runner.md"), renderMarkdown(summary));
  fs.writeFileSync(path.join(reportDir.absolute, "phone-lane-hardware-runner.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

if (wantsJson) {
  console.log(JSON.stringify(summary, null, 2));
} else if (summary.ok) {
  console.log(renderMarkdown(summary));
} else {
  console.error("Phone lane hardware runner is not ready.");
  for (const error of errors) console.error(`error: ${error}`);
}

process.exit(summary.ok ? 0 : 1);
