#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher";
const PHONE_RUNNER = "scripts/run-phone-lane-hardware.mjs";
const PHONE_REVIEWER = "scripts/review-phone-lane-evidence.mjs";
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 5 * 1000;
const MIN_INTERVAL_MS = 250;

const args = process.argv.slice(2);
const wantsHelp = args.includes("--help") || args.includes("-h");
const wantsJson = args.includes("--json");
const wantsWriteReport = args.includes("--write-report");
const wantsExecute = args.includes("--execute");
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;
const timeoutMs = parsePositiveInt(valueAfter("--timeout-ms"), DEFAULT_TIMEOUT_MS, "--timeout-ms");
const intervalMs = Math.max(
  parsePositiveInt(valueAfter("--interval-ms"), DEFAULT_INTERVAL_MS, "--interval-ms"),
  MIN_INTERVAL_MS,
);

function usage() {
  return [
    "Usage: scripts/run-phone-lane-when-ready.mjs [--execute] [--write-report] [--report-dir DIR] [--timeout-ms N] [--interval-ms N] [--json]",
    "",
    "Polls the phone-lane runner until exactly one authorized phone is ready, then optionally runs the phone lane",
    "and immediately reviews the generated evidence. Hardware execution still requires --execute.",
    "",
    `Default timeout: ${DEFAULT_TIMEOUT_MS} ms`,
    `Default interval: ${DEFAULT_INTERVAL_MS} ms`,
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

function parsePositiveInt(value, fallback, flag) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    console.error(`${flag} must be a positive integer.`);
    process.exit(1);
  }
  return parsed;
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
  const startedMs = Date.now();
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
      durationMs: Date.now() - startedMs,
      command: [command, ...commandArgs].map(commandPart).join(" "),
      rawOutputPersisted: false,
    },
    parsedJson,
  };
}

function wait(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function pollingSnapshot(parsedJson) {
  return {
    status: parsedJson?.status ?? "unknown",
    phoneReadyToCollect: parsedJson?.phoneReadyToCollect === true,
    executionAllowed: parsedJson?.executionAllowed === true,
    phoneActionStatus: parsedJson?.phoneActionStatus ?? "unknown",
    authorizedAdbDevices: parsedJson?.counts?.authorizedAdbDevices ?? 0,
    unauthorizedAdbDevices: parsedJson?.counts?.unauthorizedAdbDevices ?? 0,
    offlineAdbDevices: parsedJson?.counts?.offlineAdbDevices ?? 0,
    collectionBlockerCount: Array.isArray(parsedJson?.phoneCollectionBlockers)
      ? parsedJson.phoneCollectionBlockers.length
      : 0,
    evidenceGapCount: Array.isArray(parsedJson?.phoneEvidenceGaps)
      ? parsedJson.phoneEvidenceGaps.length
      : 0,
  };
}

function sanitizeRunnerSummary(parsedJson) {
  if (!parsedJson) return null;
  return {
    status: parsedJson.status,
    ok: parsedJson.ok === true,
    phoneReadyToCollect: parsedJson.phoneReadyToCollect === true,
    executionAllowed: parsedJson.executionAllowed === true,
    executed: parsedJson.executed === true,
    phoneActionStatus: parsedJson.phoneActionStatus ?? "",
    counts: parsedJson.counts ?? {},
    phoneCollectionBlockers: parsedJson.phoneCollectionBlockers ?? [],
    phoneEvidenceGaps: parsedJson.phoneEvidenceGaps ?? [],
    reportPath: parsedJson.reportPath ?? "",
    summaryJsonPath: parsedJson.summaryJsonPath ?? "",
  };
}

function sanitizeReviewSummary(parsedJson) {
  if (!parsedJson) return null;
  return {
    status: parsedJson.status,
    ok: parsedJson.ok === true,
    phoneAlphaReady: parsedJson.phoneAlphaReady === true,
    phoneEvidence: parsedJson.phoneEvidence ?? {},
    promotion: parsedJson.promotion ?? {},
    privacy: parsedJson.privacy ?? {},
    errors: parsedJson.errors ?? [],
    nextActions: parsedJson.nextActions ?? [],
    reportPath: parsedJson.reportPath ?? "",
    summaryJsonPath: parsedJson.summaryJsonPath ?? "",
  };
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# Phone Lane Ready Watcher");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("This watcher polls the guarded phone-lane runner until exactly one authorized Android phone is ready. With `--execute`, it runs the phone evidence lane and then immediately runs the post-run reviewer.");
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  lines.push(`- Mode: ${summary.mode}`);
  lines.push(`- Status: ${summary.status}`);
  lines.push(`- Timed out: ${summary.timedOut}`);
  lines.push(`- Ready observed: ${summary.readyObserved}`);
  lines.push(`- Executed: ${summary.executed}`);
  lines.push(`- Review attempted: ${summary.reviewAttempted}`);
  lines.push(`- Phone alpha ready: ${summary.phoneAlphaReady}`);
  lines.push(`- Poll attempts: ${summary.pollAttempts}`);
  lines.push("");
  lines.push("## Latest Poll");
  lines.push("");
  lines.push(`- Phone ready to collect: ${summary.latestPoll?.phoneReadyToCollect ?? false}`);
  lines.push(`- Execution allowed: ${summary.latestPoll?.executionAllowed ?? false}`);
  lines.push(`- Phone action status: ${summary.latestPoll?.phoneActionStatus ?? "-"}`);
  lines.push(`- Authorized ADB devices: ${summary.latestPoll?.authorizedAdbDevices ?? 0}`);
  lines.push(`- Collection blocker count: ${summary.latestPoll?.collectionBlockerCount ?? 0}`);
  lines.push(`- Evidence gap count: ${summary.latestPoll?.evidenceGapCount ?? 0}`);
  lines.push("");
  lines.push("## Steps");
  lines.push("");
  lines.push("| Step | Result | Exit Code | Parsed JSON | Raw Output Persisted |");
  lines.push("| --- | --- | ---: | --- | --- |");
  for (const step of summary.steps) {
    lines.push(`| ${escapeCell(step.label)} | ${step.status} | ${step.exitCode} | ${step.parseOk ? "yes" : "no"} | ${step.rawOutputPersisted ? "yes" : "no"} |`);
  }
  lines.push("");
  lines.push("## Evidence Paths");
  lines.push("");
  lines.push(`- Phone runner report: \`${summary.phoneRunner?.reportPath || "-"}\``);
  lines.push(`- Phone runner JSON: \`${summary.phoneRunner?.summaryJsonPath || "-"}\``);
  lines.push(`- Post-run review report: \`${summary.phoneReview?.reportPath || "-"}\``);
  lines.push(`- Post-run review JSON: \`${summary.phoneReview?.summaryJsonPath || "-"}\``);
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
  if (!summary.readyObserved) {
    next.push("Attach exactly one authorized Android phone before rerunning the watcher.");
  }
  if (summary.readyObserved && summary.mode === "dry-run") {
    next.push("Rerun with `--execute --write-report --json` only when the attached phone is the intended test device.");
  }
  if (summary.executed && !summary.reviewAttempted) {
    next.push("Run `scripts/review-phone-lane-evidence.mjs --write-report --json` before changing phone-alpha status.");
  }
  if (summary.reviewAttempted && !summary.phoneAlphaReady) {
    next.push("Keep phone alpha blocked and inspect the post-run review report for the remaining aggregate gaps.");
  }
  if (summary.phoneAlphaReady) {
    next.push("Manually review the non-PII phone evidence rows, then update release readiness only if observations match.");
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

const startedMs = Date.now();
const deadlineMs = startedMs + timeoutMs;
const pollSnapshots = [];
const steps = [];
let latestPoll = null;
let lastPollJson = null;
let timedOut = false;

do {
  const poll = runJsonStep("Poll phone lane readiness", process.execPath, [
    PHONE_RUNNER,
    "--json",
  ]);
  steps.push(poll.step);
  latestPoll = pollingSnapshot(poll.parsedJson);
  lastPollJson = poll.parsedJson;
  pollSnapshots.push({
    attempt: pollSnapshots.length + 1,
    observedAt: poll.step.endedAt,
    ...latestPoll,
  });
  if (latestPoll.phoneReadyToCollect && latestPoll.executionAllowed) break;
  if (Date.now() >= deadlineMs) {
    timedOut = true;
    break;
  }
  wait(Math.min(intervalMs, Math.max(deadlineMs - Date.now(), 0)));
} while (Date.now() <= deadlineMs);

const readyObserved = latestPoll?.phoneReadyToCollect === true && latestPoll?.executionAllowed === true;
let executed = false;
let reviewAttempted = false;
let phoneRunner = sanitizeRunnerSummary(lastPollJson);
let phoneReview = null;

if (readyObserved && wantsExecute) {
  const runner = runJsonStep("Execute phone lane runner", process.execPath, [
    PHONE_RUNNER,
    "--execute",
    "--write-report",
    "--json",
  ]);
  steps.push(runner.step);
  phoneRunner = sanitizeRunnerSummary(runner.parsedJson);
  executed = runner.parsedJson?.executed === true && runner.step.exitCode === 0;
  if (!executed) {
    errors.push("Phone lane execution did not complete successfully.");
  }

  const review = runJsonStep("Review phone lane evidence", process.execPath, [
    PHONE_REVIEWER,
    "--write-report",
    "--json",
  ]);
  steps.push(review.step);
  reviewAttempted = review.parseOk === true;
  phoneReview = sanitizeReviewSummary(review.parsedJson);
  if (!phoneReview?.phoneAlphaReady) {
    errors.push("Post-run review is not phone-alpha ready.");
  }
}

if (!readyObserved) {
  errors.push("Phone lane readiness was not observed before timeout.");
}

const phoneAlphaReady = phoneReview?.phoneAlphaReady === true;
const status = phoneAlphaReady
  ? "phone-alpha-review-ready"
  : readyObserved && wantsExecute
    ? "executed-review-blocked"
    : readyObserved
      ? "ready"
      : "timed-out";

const summary = {
  ok: status === "ready" || phoneAlphaReady,
  generatedAt: kstTimestamp(),
  mode: wantsExecute ? "execute" : "dry-run",
  status,
  reportDir: reportDir?.relative ?? reportDirArg,
  reportPath: reportDir ? path.join(reportDir.relative, "phone-lane-ready-watcher.md") : null,
  summaryJsonPath: reportDir ? path.join(reportDir.relative, "phone-lane-ready-watcher.json") : null,
  timeoutMs,
  intervalMs,
  elapsedMs: Date.now() - startedMs,
  pollAttempts: pollSnapshots.length,
  timedOut,
  readyObserved,
  executed,
  reviewAttempted,
  phoneAlphaReady,
  latestPoll,
  pollSnapshots,
  phoneRunner,
  phoneReview,
  steps,
  errors,
  nextActions: [],
  rawOutputPersisted: false,
  privacyGuardrail: "This report stores only aggregate readiness booleans, counts, exit codes, timestamps, command labels, and workspace-relative report paths. It must not store raw child command output, ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, encrypted payload values, private alert text, exact locations, tokens, or matched privacy-scan text.",
};
summary.nextActions = deriveNextActions(summary);

if (wantsWriteReport && reportDir) {
  fs.mkdirSync(reportDir.absolute, { recursive: true });
  fs.writeFileSync(path.join(reportDir.absolute, "phone-lane-ready-watcher.md"), renderMarkdown(summary));
  fs.writeFileSync(path.join(reportDir.absolute, "phone-lane-ready-watcher.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

if (wantsJson) {
  console.log(JSON.stringify(summary, null, 2));
} else if (summary.ok) {
  console.log(renderMarkdown(summary));
} else {
  console.error("Phone lane ready watcher did not reach a promotable state.");
  for (const error of errors) console.error(`error: ${error}`);
}

process.exit(summary.ok ? 0 : 1);
