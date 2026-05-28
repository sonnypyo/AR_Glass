#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_NEXT_ACTIONS = "data/runs/20260528_voice_direction_mvp/111-hardware-next-actions/hardware-next-actions.json";
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const wantsWriteReport = args.includes("--write-report");
const wantsExecute = args.includes("--execute");
const wantsHelp = args.includes("--help") || args.includes("-h");
const actionArg = valueAfter("--action");
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;
const nextActionsArg = positionalArgs()[0] || DEFAULT_NEXT_ACTIONS;

const allowedActions = {
  "refresh-default-workflow": {
    command: "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh",
    script: "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh",
    env: {},
    laneType: "default-no-hardware",
  },
  "run-phone-lane": {
    command: "RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh",
    script: "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh",
    env: { RUN_PHONE: "1" },
    laneType: "phone-hardware",
  },
  "run-glasses-lane": {
    command: "RUN_GLASSES=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh",
    script: "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh",
    env: { RUN_GLASSES: "1" },
    laneType: "glasses-hardware",
  },
  "run-support-lane": {
    command: "RUN_SUPPORT=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh",
    script: "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh",
    env: { RUN_SUPPORT: "1" },
    laneType: "support-manual",
  },
  "run-controlled-direction-session": {
    command: "data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/commands.sh",
    script: "data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/commands.sh",
    env: {},
    laneType: "controlled-direction-manual",
  },
};

function usage() {
  return [
    "Usage: scripts/run-hardware-next-action.mjs [next-actions-json] [--action ID] [--execute] [--write-report] [--report-dir DIR] [--json]",
    "",
    "Dry-runs or executes the first ready action from the hardware next-action brief.",
    "Execution is allowed only for actions whose status is ready and whose command matches the allow-list.",
    "",
    `Default next actions: ${DEFAULT_NEXT_ACTIONS}`,
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
    if (arg === "--action" || arg === "--report-dir") {
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

function selectAction(nextActions, requestedActionId) {
  const actions = [...(nextActions?.actions ?? [])].sort((a, b) => a.priority - b.priority);
  if (requestedActionId) return actions.find((action) => action.id === requestedActionId) ?? null;
  return actions.find((action) => action.status === "ready") ?? null;
}

function summarizeAction(action) {
  if (!action) return null;
  return {
    id: action.id,
    priority: action.priority,
    status: action.status,
    title: action.title,
    command: action.command,
    blockers: action.blockers ?? [],
  };
}

function validateExecution(action, errors) {
  if (!action) {
    errors.push(actionArg ? `Action not found: ${actionArg}` : "No ready action found.");
    return null;
  }
  const allowed = allowedActions[action.id];
  if (!allowed) {
    errors.push(`Action is not allow-listed: ${action.id}`);
    return null;
  }
  if (action.command !== allowed.command) {
    errors.push(`Action command mismatch for ${action.id}.`);
  }
  const scriptPath = resolveInsideWorkspace(allowed.script);
  if (!fs.existsSync(scriptPath.absolute)) {
    errors.push(`Action script missing: ${scriptPath.relative}`);
  }
  if (action.status !== "ready") {
    errors.push(`Action is not ready: ${action.id} status=${action.status}`);
  }
  return { ...allowed, scriptPath };
}

function executeAction(executionPlan) {
  const started = Date.now();
  const result = spawnSync("bash", [executionPlan.scriptPath.absolute], {
    cwd: ROOT_DIR,
    env: { ...process.env, ...executionPlan.env },
    stdio: "inherit",
  });
  return {
    exitCode: result.status,
    signal: result.signal,
    durationMs: Date.now() - started,
  };
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# Hardware Next Action Execution");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Source next actions: ${summary.sourceNextActions}`);
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  lines.push(`- Mode: ${summary.mode}`);
  lines.push(`- Requested action: ${summary.requestedActionId || "first-ready"}`);
  lines.push(`- Selected action: ${summary.selectedAction?.id ?? "none"}`);
  lines.push(`- Selected status: ${summary.selectedAction?.status ?? "none"}`);
  lines.push(`- Execution allowed: ${summary.executionAllowed}`);
  lines.push(`- Executed: ${summary.executed}`);
  lines.push(`- Exit code: ${summary.execution.exitCode ?? "-"}`);
  lines.push("");
  lines.push("## Selected Action");
  lines.push("");
  lines.push(`- Title: ${summary.selectedAction?.title ?? "-"}`);
  lines.push(`- Command: ${summary.selectedAction?.command ? `\`${summary.selectedAction.command}\`` : "-"}`);
  lines.push(`- Blockers: ${summary.selectedAction?.blockers?.join("; ") || "-"}`);
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
let nextActions = null;
let reportDir = null;
let sourceNextActions = nextActionsArg;

try {
  sourceNextActions = resolveInsideWorkspace(nextActionsArg).relative;
  nextActions = readJson(nextActionsArg, errors, "Hardware next actions");
  reportDir = resolveInsideWorkspace(reportDirArg);
} catch (error) {
  errors.push(error.message);
}

const selectedAction = selectAction(nextActions, actionArg);
const validationErrors = [];
const executionPlan = validateExecution(selectedAction, validationErrors);
const executionAllowed = validationErrors.length === 0 && Boolean(executionPlan);
errors.push(...validationErrors);

let execution = {
  exitCode: null,
  signal: null,
  durationMs: 0,
};

if (wantsExecute && executionAllowed) {
  execution = executeAction(executionPlan);
  if (execution.exitCode !== 0) {
    errors.push(`Action command exited with ${execution.exitCode ?? execution.signal}.`);
  }
}

const summary = {
  ok: errors.length === 0,
  generatedAt: kstTimestamp(),
  sourceNextActions,
  reportDir: reportDir?.relative ?? reportDirArg,
  reportPath: reportDir ? path.join(reportDir.relative, "hardware-next-action-execution.md") : null,
  summaryJsonPath: reportDir ? path.join(reportDir.relative, "hardware-next-action-execution.json") : null,
  mode: wantsExecute ? "execute" : "dry-run",
  requestedActionId: actionArg || "",
  selectedAction: summarizeAction(selectedAction),
  laneType: executionPlan?.laneType ?? "",
  executionAllowed,
  executed: wantsExecute && executionAllowed,
  execution,
  errors,
  rawOutputPersisted: false,
  privacyGuardrail: "This report stores only action id, status, command recommendation, blocker text, exit code, duration, and workspace-relative paths. It does not persist raw command output, ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, private alert text, exact locations, tokens, or application id values.",
};

if (wantsWriteReport && reportDir) {
  fs.mkdirSync(reportDir.absolute, { recursive: true });
  fs.writeFileSync(path.join(reportDir.absolute, "hardware-next-action-execution.md"), renderMarkdown(summary));
  fs.writeFileSync(path.join(reportDir.absolute, "hardware-next-action-execution.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

if (wantsJson) {
  console.log(JSON.stringify(summary, null, 2));
} else if (summary.ok) {
  console.log(renderMarkdown(summary));
} else {
  console.error("Hardware next-action execution failed.");
  for (const error of errors) console.error(`error: ${error}`);
}

process.exit(summary.ok ? 0 : 1);
