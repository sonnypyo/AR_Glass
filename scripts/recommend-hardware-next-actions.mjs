#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_DASHBOARD = "data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard/hardware-test-status-dashboard.json";
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/111-hardware-next-actions";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const wantsWriteReport = args.includes("--write-report");
const showHelp = args.includes("--help") || args.includes("-h");
const dashboardArg = positionalArgs()[0] || DEFAULT_DASHBOARD;
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;

function usage() {
  return [
    "Usage: scripts/recommend-hardware-next-actions.mjs [dashboard-json] [--write-report] [--report-dir DIR] [--json]",
    "",
    "Builds a non-PII next-action brief from the hardware test status dashboard.",
    "It recommends what to run next and which hardware lanes must remain blocked.",
    "",
    `Default dashboard: ${DEFAULT_DASHBOARD}`,
    `Default report dir: ${DEFAULT_REPORT_DIR}`,
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

function laneByLabel(dashboard, label) {
  return (dashboard?.lanes ?? []).find((lane) => lane.label === label) ?? null;
}

function action(id, priority, status, title, command, reason, blockers = []) {
  return {
    id,
    priority,
    status,
    title,
    command,
    reason,
    blockers,
  };
}

function defaultWorkflowCurrent(dashboard) {
  if (dashboard?.currentSafeWorkflow !== true) return false;
  if (dashboard?.evidencePrivacyScan?.ok !== true) return false;
  const checks = dashboard?.checks ?? [];
  if (checks.length === 0) return false;
  return checks.every((check) => check.ok === true);
}

function buildActions(dashboard) {
  const actions = [];
  const defaultLane = laneByLabel(dashboard, "Default no-hardware workflow");
  const phoneLane = laneByLabel(dashboard, "Phone evidence");
  const directionLane = laneByLabel(dashboard, "Controlled direction trials");
  const glassesLane = laneByLabel(dashboard, "Glasses evidence");
  const supportLane = laneByLabel(dashboard, "Support evidence");

  actions.push(action(
    "refresh-default-workflow",
    1,
    defaultWorkflowCurrent(dashboard) ? "current" : (defaultLane?.status === "ready" ? "ready" : "blocked"),
    "Refresh default no-hardware workflow",
    defaultLane?.command ?? "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh",
    defaultWorkflowCurrent(dashboard)
      ? "No-hardware workflow, service gates, controlled-direction validator, and privacy scan are already current."
      : "Run this before attaching real evidence lanes so local workflow drift is caught early.",
    defaultLane?.blockers ?? [],
  ));

  actions.push(action(
    "run-controlled-direction-session",
    2,
    directionLane?.status ?? "blocked",
    "Prepare controlled direction rows",
    directionLane?.command ?? "data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/commands.sh",
    "Keep the 20-per-direction front/back/left/right evidence plan ready; collect observed rows only during the final phone hardware step.",
    directionLane?.blockers ?? [],
  ));

  actions.push(action(
    "run-glasses-lane",
    3,
    glassesLane?.status ?? "blocked",
    "Prepare glasses evidence lane",
    glassesLane?.command ?? "RUN_GLASSES=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh",
    "Keep glasses preflight, Meta DAT, Ray-Ban fallback, Android XR, and haptics/fallback gates explicit before any hardware claim.",
    glassesLane?.blockers ?? [],
  ));

  actions.push(action(
    "run-support-lane",
    4,
    supportLane?.status ?? "manual-required",
    "Prepare support drill lane",
    supportLane?.command ?? "RUN_SUPPORT=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh",
    "Use when deletion and mistaken-alert drill owners can record reviewed non-PII evidence.",
    supportLane?.blockers ?? [],
  ));

  const authorizedCount = dashboard?.counts?.authorizedAdbDevices ?? 0;
  actions.push(action(
    "run-phone-lane",
    5,
    authorizedCount === 1 && phoneLane?.status !== "blocked" ? "ready" : "blocked",
    "Run Android phone evidence lane last",
    phoneLane?.command ?? "RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh",
    "Run this only after pre-phone local workflow, controlled-direction planning, glasses preflight, and support-drill preparation are current.",
    phoneLane?.blockers ?? [`authorized ADB devices must be exactly 1, current=${authorizedCount}`],
  ));

  return actions;
}

function summarizeDecision(dashboard, actions) {
  const readyActions = actions.filter((item) => item.status === "ready");
  const manualActions = actions.filter((item) => item.status === "manual-required");
  const phoneReady = actions.find((item) => item.id === "run-phone-lane")?.status === "ready";
  const prePhoneManual = manualActions.some((item) => item.id !== "run-phone-lane");
  const currentActions = actions.filter((item) => item.status === "current");
  if (actions.find((item) => item.id === "refresh-default-workflow")?.status === "current" && prePhoneManual) return "pre_phone_manual_preparation_available";
  if (readyActions.some((item) => item.id === "refresh-default-workflow")) return "pre_phone_workflow_ready_keep_phone_last";
  if (prePhoneManual) return "pre_phone_manual_preparation_available";
  if (phoneReady) return "phone_lane_ready_last";
  if (currentActions.length > 0 && dashboard?.ok) return "pre_phone_preparation_current_hardware_blocked";
  return dashboard?.ok ? "workflow_ok_no_hardware_lane_ready" : "workflow_attention_required";
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# Hardware Next Actions");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Source dashboard: ${summary.sourceDashboard}`);
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  lines.push(`- Recommendation: ${summary.decision}`);
  lines.push(`- Current safe workflow: ${summary.currentSafeWorkflow}`);
  lines.push(`- Authorized ADB devices: ${summary.counts.authorizedAdbDevices}`);
  lines.push(`- Phone manifest apply ready: ${summary.candidates.phoneDirectionManifestApplyReady}`);
  lines.push(`- Controlled direction rows: ${summary.controlledDirection.recordedRows}/${summary.controlledDirection.totalPlannedRows}`);
  lines.push("");
  lines.push("## Ordered Actions");
  lines.push("");
  lines.push("| Priority | Status | Action | Command | Blockers |");
  lines.push("| ---: | --- | --- | --- | --- |");
  for (const item of summary.actions) {
    lines.push(`| ${item.priority} | ${item.status} | ${item.title} | \`${item.command}\` | ${item.blockers.join("; ") || "-"} |`);
  }
  lines.push("");
  lines.push("## Privacy Guardrail");
  lines.push("");
  lines.push(summary.privacyGuardrail);
  return `${lines.join("\n")}\n`;
}

const errors = [];
let dashboard = null;
let reportDir = null;
let sourceDashboard = dashboardArg;

try {
  sourceDashboard = resolveInsideWorkspace(dashboardArg).relative;
  dashboard = readJson(dashboardArg, errors, "Hardware status dashboard");
  reportDir = resolveInsideWorkspace(reportDirArg);
} catch (error) {
  errors.push(error.message);
}

const actions = dashboard ? buildActions(dashboard) : [];
const summary = {
  ok: errors.length === 0 && Boolean(dashboard?.ok),
  generatedAt: kstTimestamp(),
  sourceDashboard,
  reportDir: reportDir?.relative ?? reportDirArg,
  reportPath: reportDir ? path.join(reportDir.relative, "hardware-next-actions.md") : null,
  summaryJsonPath: reportDir ? path.join(reportDir.relative, "hardware-next-actions.json") : null,
  decision: summarizeDecision(dashboard, actions),
  currentSafeWorkflow: dashboard?.currentSafeWorkflow === true,
  privateAlphaCandidate: dashboard?.privateAlphaCandidate === true,
  counts: {
    authorizedAdbDevices: dashboard?.counts?.authorizedAdbDevices ?? 0,
    unauthorizedAdbDevices: dashboard?.counts?.unauthorizedAdbDevices ?? 0,
    offlineAdbDevices: dashboard?.counts?.offlineAdbDevices ?? 0,
  },
  candidates: {
    phonePrivateAlphaCandidate: dashboard?.candidates?.phonePrivateAlphaCandidate === true,
    phoneDirectionSummaryValidated: dashboard?.candidates?.phoneDirectionSummaryValidated === true,
    phoneDirectionManifestApplyDryRunOk: dashboard?.candidates?.phoneDirectionManifestApplyDryRunOk === true,
    phoneDirectionManifestApplyReady: dashboard?.candidates?.phoneDirectionManifestApplyReady === true,
    phoneDirectionProductionCandidate: dashboard?.candidates?.phoneDirectionProductionCandidate === true,
    glassesPrivateAlphaCandidate: dashboard?.candidates?.glassesPrivateAlphaCandidate === true,
    supportStrictRequested: dashboard?.candidates?.supportStrictRequested === true,
  },
  controlledDirection: {
    planningReady: dashboard?.controlledDirection?.planningReady === true,
    observedRowsComplete: dashboard?.controlledDirection?.observedRowsComplete === true,
    recordedRows: dashboard?.controlledDirection?.recordedRows ?? 0,
    totalPlannedRows: dashboard?.controlledDirection?.totalPlannedRows ?? 0,
    sessionDir: dashboard?.controlledDirection?.sessionDir ?? "",
  },
  actions,
  errors,
  privacyGuardrail: "This report stores only booleans, counts, statuses, command recommendations, blockers, and workspace-relative paths. It must not include raw command output, ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, private alert text, exact locations, tokens, or application id values.",
};

if (wantsWriteReport && reportDir) {
  fs.mkdirSync(reportDir.absolute, { recursive: true });
  fs.writeFileSync(path.join(reportDir.absolute, "hardware-next-actions.md"), renderMarkdown(summary));
  fs.writeFileSync(path.join(reportDir.absolute, "hardware-next-actions.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

if (wantsJson) {
  console.log(JSON.stringify(summary, null, 2));
} else if (summary.ok) {
  console.log(renderMarkdown(summary));
} else {
  console.error("Hardware next-action recommendation failed.");
  for (const error of errors) console.error(`error: ${error}`);
}

process.exit(summary.ok ? 0 : 1);
