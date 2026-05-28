#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_REHEARSAL_SESSION = "data/runs/20260528_voice_direction_mvp/79-private-alpha-rehearsal-pack";
const DEFAULT_PHYSICAL_SESSION = "data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack";
const DEFAULT_SUPPORT_SESSION = "data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack";
const DEFAULT_GLASSES_SESSION = "data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack";
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/80-private-alpha-hardware-runner";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const runPhone = args.includes("--run-phone");
const runSupport = args.includes("--run-support");
const runGlasses = args.includes("--run-glasses");
const skipPrivateRehearsal = args.includes("--skip-private-rehearsal");

const rehearsalSession = valueAfter("--rehearsal-session") || DEFAULT_REHEARSAL_SESSION;
const physicalSession = valueAfter("--physical-session") || DEFAULT_PHYSICAL_SESSION;
const supportSession = valueAfter("--support-session") || DEFAULT_SUPPORT_SESSION;
const glassesSession = valueAfter("--glasses-session") || DEFAULT_GLASSES_SESSION;
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;

function usage() {
  return [
    "Usage: scripts/run-private-alpha-hardware-rehearsal.mjs [options]",
    "",
    "Runs the private-alpha hardware-day rehearsal without persisting raw command output.",
    "",
    "Options:",
    "  --run-phone                 Run the physical Android phone session commands.sh.",
    "  --run-support               Run the support drill session commands.sh.",
    "  --run-glasses               Run the glasses hardware session commands.sh.",
    "  --skip-private-rehearsal    Skip the top-level private-alpha rehearsal commands.sh.",
    "  --rehearsal-session DIR     Override the private-alpha rehearsal session folder.",
    "  --physical-session DIR      Override the physical phone session folder.",
    "  --support-session DIR       Override the support drill session folder.",
    "  --glasses-session DIR       Override the glasses hardware session folder.",
    "  --report-dir DIR            Override the summary report folder.",
    "  --json                      Print machine-readable summary only.",
    "",
    "Default mode validates linked sessions, dry-runs glasses manifest apply, runs the top-level rehearsal, writes a service-readiness audit, and emits a non-PII summary.",
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

function ensureDir(relativeOrAbsolutePath) {
  const { absolute, relative } = resolveInsideWorkspace(relativeOrAbsolutePath);
  fs.mkdirSync(absolute, { recursive: true });
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

function commandPath(sessionAbsolute) {
  return path.join(sessionAbsolute, "commands.sh");
}

function relativeCommand(command) {
  return path.relative(ROOT_DIR, command);
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

function shellResultStatus(result) {
  if (typeof result.status === "number") return result.status;
  if (result.error) return 1;
  return 1;
}

function safeOutputPreview(result) {
  const text = `${result.stdout || ""}${result.stderr || ""}`.trim();
  if (!text) return "";
  return text.split(/\r?\n/).slice(-8).join("\n");
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
  const exitCode = shellResultStatus(result);
  const endedAt = kstTimestamp();
  const ok = exitCode === 0;

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
    outputPreview: options.includePreview ? safeOutputPreview(result) : "",
  };
}

function pushCommand(steps, label, command, commandArgs, options = {}) {
  steps.push({ label, command, args: commandArgs, options });
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function renderReport(summary) {
  const lines = [];
  lines.push("# Private Alpha Hardware Rehearsal Runner Summary");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("This report summarizes a hardware-day rehearsal runner for Voice Direction Glass. It coordinates existing phone, support, glasses, and private-alpha rehearsal packs while keeping raw command output out of the report.");
  lines.push("");
  lines.push("## Scope");
  lines.push("");
  lines.push(`- Phone session executed: ${summary.flags.runPhone ? "yes" : "no"}`);
  lines.push(`- Support session executed: ${summary.flags.runSupport ? "yes" : "no"}`);
  lines.push(`- Glasses session executed: ${summary.flags.runGlasses ? "yes" : "no"}`);
  lines.push(`- Private-alpha rehearsal executed: ${summary.flags.skipPrivateRehearsal ? "no" : "yes"}`);
  lines.push("");
  lines.push("## Linked Sessions");
  lines.push("");
  lines.push(`- Rehearsal session: \`${summary.sessions.rehearsalSession}\``);
  lines.push(`- Physical phone session: \`${summary.sessions.physicalSession}\``);
  lines.push(`- Support drill session: \`${summary.sessions.supportSession}\``);
  lines.push(`- Glasses hardware session: \`${summary.sessions.glassesSession}\``);
  lines.push("");
  lines.push("## Command Results");
  lines.push("");
  lines.push("| Step | Result | Exit Code | Raw Output Persisted |");
  lines.push("| --- | --- | ---: | --- |");
  for (const command of summary.commands) {
    lines.push(`| ${escapeCell(command.label)} | ${command.status} | ${command.exitCode} | ${command.rawOutputPersisted ? "yes" : "no"} |`);
  }
  lines.push("");
  lines.push("## Output Policy");
  lines.push("");
  lines.push("No raw command output is persisted in this report. Child commands may print to the terminal during interactive runs, but only labels, statuses, exit codes, paths, and next actions are stored.");
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push(`- Overall status: ${summary.ok ? "pass" : "fail"}.`);
  lines.push(`- Service readiness audit: \`${summary.serviceReadinessAuditPath}\``);
  lines.push("");
  lines.push("## Next Actions");
  lines.push("");
  for (const action of summary.nextActions) {
    lines.push(`- ${action}`);
  }
  lines.push("");
  lines.push("## Privacy Guardrail");
  lines.push("");
  lines.push("This report must contain only aggregate status, booleans, exit codes, command labels, timestamps, and workspace-relative paths. It must not contain raw audio, transcripts, speaker names, voice embeddings, encrypted payload values, Bluetooth product names, MAC addresses, private alert text, or exact locations.");
  return `${lines.join("\n")}\n`;
}

function buildNextActions(summary) {
  const actions = [];
  actions.push("Connect a physical Android phone, then rerun this script with `--run-phone` and fill the physical session manual rows.");
  actions.push("Run the support drill session with real deletion and mistaken-alert rehearsal evidence before any external beta claim.");
  actions.push("Configure Meta DAT credentials outside source control, run glasses preflight, and fill Ray-Ban Display evidence.");
  actions.push("Collect Ray-Ban Gen 1 fallback and Android XR projected runtime evidence before attempting glasses private alpha.");
  actions.push("Rerun service readiness audit after every evidence change.");
  if (!summary.flags.runPhone) actions.push("Phone private alpha remains blocked because this run did not execute physical phone evidence collection.");
  if (!summary.flags.runGlasses) actions.push("Glasses private alpha remains blocked because this run did not execute real glasses hardware evidence collection.");
  if (summary.commands.some((command) => command.status !== "pass")) {
    actions.push("Resolve failed command rows above, then rerun this runner so the summary and audit reflect the corrected state.");
  }
  return actions;
}

const generatedAt = kstTimestamp();
const reportDir = ensureDir(reportDirArg);
const sessions = {
  rehearsalSession: resolveInsideWorkspace(rehearsalSession),
  physicalSession: resolveInsideWorkspace(physicalSession),
  supportSession: resolveInsideWorkspace(supportSession),
  glassesSession: resolveInsideWorkspace(glassesSession),
};

const planned = [];
pushCommand(planned, "Validate physical phone session", process.execPath, [
  path.join(ROOT_DIR, "scripts/validate-physical-test-session.mjs"),
  sessions.physicalSession.relative,
  "--json",
]);
pushCommand(planned, "Validate support drill session", process.execPath, [
  path.join(ROOT_DIR, "scripts/validate-support-drill-session.mjs"),
  sessions.supportSession.relative,
  "--json",
]);
pushCommand(planned, "Validate glasses hardware session", process.execPath, [
  path.join(ROOT_DIR, "scripts/validate-glasses-hardware-session.mjs"),
  sessions.glassesSession.relative,
  "--json",
]);
pushCommand(planned, "Dry-run glasses hardware session apply", process.execPath, [
  path.join(ROOT_DIR, "scripts/apply-glasses-hardware-session.mjs"),
  sessions.glassesSession.relative,
  "--json",
]);

if (runSupport) {
  pushCommand(planned, "Run support drill session commands", commandPath(sessions.supportSession.absolute), [], {
    commandSummary: relativeCommand(commandPath(sessions.supportSession.absolute)),
  });
}

if (runGlasses) {
  pushCommand(planned, "Run glasses hardware session commands", commandPath(sessions.glassesSession.absolute), [], {
    commandSummary: relativeCommand(commandPath(sessions.glassesSession.absolute)),
  });
}

if (runPhone) {
  pushCommand(planned, "Run physical phone session commands", commandPath(sessions.physicalSession.absolute), [], {
    commandSummary: relativeCommand(commandPath(sessions.physicalSession.absolute)),
  });
}

if (!skipPrivateRehearsal) {
  pushCommand(planned, "Run top-level private alpha rehearsal commands", commandPath(sessions.rehearsalSession.absolute), [], {
    commandSummary: relativeCommand(commandPath(sessions.rehearsalSession.absolute)),
  });
}

pushCommand(planned, "Write service readiness audit for runner", process.execPath, [
  path.join(ROOT_DIR, "scripts/audit-service-readiness.mjs"),
  "--write-report",
  "--report-dir",
  path.join(reportDir.absolute, "service-readiness-audit"),
]);
pushCommand(planned, "Validate private alpha rehearsal session", process.execPath, [
  path.join(ROOT_DIR, "scripts/validate-private-alpha-rehearsal.mjs"),
  sessions.rehearsalSession.relative,
  "--json",
]);

const commandResults = planned.map((step) => runStep(step.label, step.command, step.args, step.options));
const summary = {
  ok: commandResults.every((command) => command.status === "pass"),
  generatedAt,
  reportDir: reportDir.relative,
  reportPath: path.join(reportDir.relative, "hardware-run-summary.md"),
  summaryJsonPath: path.join(reportDir.relative, "hardware-run-summary.json"),
  serviceReadinessAuditPath: path.join(reportDir.relative, "service-readiness-audit", "service-readiness-audit.md"),
  flags: {
    runPhone,
    runSupport,
    runGlasses,
    skipPrivateRehearsal,
  },
  sessions: {
    rehearsalSession: sessions.rehearsalSession.relative,
    physicalSession: sessions.physicalSession.relative,
    supportSession: sessions.supportSession.relative,
    glassesSession: sessions.glassesSession.relative,
  },
  commands: commandResults,
  warnings: [],
  errors: commandResults.filter((command) => command.status !== "pass").map((command) => `${command.label} failed with exit ${command.exitCode}.`),
};
summary.nextActions = buildNextActions(summary);

fs.writeFileSync(path.join(reportDir.absolute, "hardware-run-summary.md"), renderReport(summary));
fs.writeFileSync(path.join(reportDir.absolute, "hardware-run-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

if (wantsJson) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`\nHardware rehearsal summary written: ${path.join(reportDir.absolute, "hardware-run-summary.md")}`);
}

process.exit(summary.ok ? 0 : 1);
