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
const DEFAULT_RUNNER_SUMMARY = "data/runs/20260528_voice_direction_mvp/80-private-alpha-hardware-runner/hardware-run-summary.json";
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/81-private-alpha-hardware-readiness";
const DEBUG_APK = "apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk";
const GLASSES_PREFLIGHT = "data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence/glasses-preflight.md";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const wantsWriteReport = args.includes("--write-report");
const showHelp = args.includes("--help") || args.includes("-h");
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;
const rehearsalSession = valueAfter("--rehearsal-session") || DEFAULT_REHEARSAL_SESSION;
const physicalSession = valueAfter("--physical-session") || DEFAULT_PHYSICAL_SESSION;
const supportSession = valueAfter("--support-session") || DEFAULT_SUPPORT_SESSION;
const glassesSession = valueAfter("--glasses-session") || DEFAULT_GLASSES_SESSION;

function usage() {
  return [
    "Usage: scripts/check-private-alpha-hardware-readiness.mjs [--write-report] [--report-dir DIR] [--json]",
    "",
    "Checks whether the local machine is ready to run the private-alpha hardware runner.",
    "The report is non-PII: it stores device counts only, not ADB serials or Bluetooth names.",
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

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT_DIR, relativePath));
}

function isExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
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

function parseJsonOutput(result) {
  const text = (result.stdout || "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function runNodeJson(scriptRelative, scriptArgs = []) {
  const result = spawnSync(process.execPath, [path.join(ROOT_DIR, scriptRelative), ...scriptArgs, "--json"], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    env: {
      ...process.env,
      JAVA_HOME: process.env.JAVA_HOME || "/Users/sonjunpyo/Documents/Project/glass/.toolchains/jdk-17.0.19+10/Contents/Home",
      ANDROID_HOME: process.env.ANDROID_HOME || "/Users/sonjunpyo/Library/Android/sdk",
    },
  });
  return {
    ok: result.status === 0,
    exitCode: typeof result.status === "number" ? result.status : 1,
    parsed: parseJsonOutput(result),
  };
}

function latestDeviceEvidence() {
  const start = path.join(ROOT_DIR, "data/runs");
  if (!fs.existsSync(start)) return "";
  const results = [];
  const stack = [start];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
      } else if (entry.isFile() && entry.name === "device-evidence.md") {
        results.push(absolute);
      }
    }
  }
  results.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return results[0] ? path.relative(ROOT_DIR, results[0]) : "";
}

function parsePreflight(relativePath) {
  if (!relativePath || !fileExists(relativePath)) {
    return { available: false, status: "missing", pass: null, manual: null, blocked: null };
  }
  const text = fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");
  return {
    available: true,
    status: text.match(/-\s*Overall status:\s*([^\n]+)/)?.[1]?.trim() ?? "unknown",
    pass: Number(text.match(/-\s*Pass:\s*(\d+)/)?.[1] ?? 0),
    manual: Number(text.match(/-\s*Manual required:\s*(\d+)/)?.[1] ?? 0),
    blocked: Number(text.match(/-\s*Blocked:\s*(\d+)/)?.[1] ?? 0),
  };
}

function parseRunnerSummary(relativePath) {
  if (!relativePath || !fileExists(relativePath)) {
    return { available: false, ok: false, path: relativePath, generatedAt: "", commands: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8"));
    return {
      available: true,
      ok: parsed.ok === true,
      path: relativePath,
      generatedAt: parsed.generatedAt ?? "",
      commands: (parsed.commands ?? []).map((command) => ({
        label: command.label,
        status: command.status,
        exitCode: command.exitCode,
      })),
    };
  } catch {
    return { available: true, ok: false, path: relativePath, generatedAt: "", commands: [] };
  }
}

function adbStatus() {
  const androidHome = process.env.ANDROID_HOME || "/Users/sonjunpyo/Library/Android/sdk";
  const adbPath = process.env.ADB || path.join(androidHome, "platform-tools", "adb");
  const exists = fs.existsSync(adbPath);
  const executable = exists && isExecutable(adbPath);
  const counts = { device: 0, unauthorized: 0, offline: 0, other: 0 };
  if (!executable) {
    return {
      adbPathConfigured: Boolean(process.env.ADB || process.env.ANDROID_HOME || fs.existsSync(androidHome)),
      adbExecutable: false,
      attachedDeviceCount: 0,
      unauthorizedCount: 0,
      offlineCount: 0,
      otherCount: 0,
    };
  }

  const result = spawnSync(adbPath, ["devices"], { encoding: "utf8" });
  if (result.status !== 0) {
    return {
      adbPathConfigured: true,
      adbExecutable: true,
      attachedDeviceCount: 0,
      unauthorizedCount: 0,
      offlineCount: 0,
      otherCount: 0,
    };
  }

  for (const line of result.stdout.split(/\r?\n/).slice(1)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    if (parts[1] === "device") counts.device += 1;
    else if (parts[1] === "unauthorized") counts.unauthorized += 1;
    else if (parts[1] === "offline") counts.offline += 1;
    else counts.other += 1;
  }

  return {
    adbPathConfigured: true,
    adbExecutable: true,
    attachedDeviceCount: counts.device,
    unauthorizedCount: counts.unauthorized,
    offlineCount: counts.offline,
    otherCount: counts.other,
  };
}

function localToolchainStatus() {
  const javaHome = process.env.JAVA_HOME || "/Users/sonjunpyo/Documents/Project/glass/.toolchains/jdk-17.0.19+10/Contents/Home";
  const androidHome = process.env.ANDROID_HOME || "/Users/sonjunpyo/Library/Android/sdk";
  return {
    javaHomePresent: fs.existsSync(javaHome),
    androidHomePresent: fs.existsSync(androidHome),
    debugApkPresent: fileExists(DEBUG_APK),
    debugApk: DEBUG_APK,
  };
}

function sessionStatus(label, relativePath, validator) {
  const { absolute, relative } = resolveInsideWorkspace(relativePath);
  const commandsPath = path.join(absolute, "commands.sh");
  const validation = runNodeJson(validator, [relative]);
  return {
    label,
    path: relative,
    exists: fs.existsSync(absolute) && fs.statSync(absolute).isDirectory(),
    commandsExecutable: fs.existsSync(commandsPath) && isExecutable(commandsPath),
    validatorOk: validation.ok,
    validatorWarnings: validation.parsed?.warnings ?? [],
    validatorErrors: validation.parsed?.errors ?? [],
  };
}

function commandFor(summary) {
  const flags = [];
  if (summary.canRunPhoneSession) flags.push("--run-phone");
  if (summary.glassesSetup.hasMetaApplicationId && summary.glassesSetup.hasGithubToken && summary.adb.attachedDeviceCount > 0) {
    flags.push("--run-glasses");
  }
  return `scripts/run-private-alpha-hardware-rehearsal.mjs ${flags.join(" ")} --json`.replace(/\s+/g, " ").trim();
}

function deriveNextActions(summary) {
  const actions = [];
  if (!summary.canRunPhoneSession) {
    actions.push("Connect exactly one authorized Android phone over ADB before using `--run-phone`.");
  }
  if (!summary.local.debugApkPresent) {
    actions.push("Build the debug APK with `cd apps/voice-direction-glass && ./gradlew --no-daemon assembleDebug`.");
  }
  if (!summary.glassesSetup.hasMetaApplicationId || !summary.glassesSetup.hasGithubToken) {
    actions.push("Configure Meta Wearables application id and GitHub Packages token outside source control before DAT work.");
  }
  if (summary.glassesPreflight.status !== "pass") {
    actions.push("Rerun `scripts/glasses-integration-preflight.sh --write-evidence` after credentials, dependencies, or device availability change.");
  }
  if (!summary.latestDeviceEvidence.path) {
    actions.push("Run `scripts/android-device-smoke-test.sh --write-evidence` with a connected phone to create `device-evidence.md`.");
  }
  actions.push("Use the recommended runner command below, then fill only aggregate/manual rows in the linked session checklists.");
  actions.push("Regenerate `scripts/audit-service-readiness.mjs --write-report` after every evidence change.");
  return actions;
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function renderReport(summary) {
  const lines = [];
  lines.push("# Private Alpha Hardware Readiness Preflight");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("This preflight checks whether the local machine is ready to run the private-alpha hardware runner with real phone, support, or glasses evidence. It stores device counts only and never persists ADB serials, Bluetooth names, raw logs, audio, transcripts, embeddings, or private alert text.");
  lines.push("");
  lines.push("## Local Toolchain");
  lines.push("");
  lines.push(`- JDK present: ${summary.local.javaHomePresent ? "yes" : "no"}`);
  lines.push(`- Android SDK present: ${summary.local.androidHomePresent ? "yes" : "no"}`);
  lines.push(`- Debug APK present: ${summary.local.debugApkPresent ? "yes" : "no"} (${summary.local.debugApk})`);
  lines.push("");
  lines.push("## ADB Device Counts");
  lines.push("");
  lines.push(`- ADB executable: ${summary.adb.adbExecutable ? "yes" : "no"}`);
  lines.push(`- Authorized devices: ${summary.adb.attachedDeviceCount}`);
  lines.push(`- Unauthorized devices: ${summary.adb.unauthorizedCount}`);
  lines.push(`- Offline devices: ${summary.adb.offlineCount}`);
  lines.push(`- Other device rows: ${summary.adb.otherCount}`);
  lines.push("");
  lines.push("## Session Pack Status");
  lines.push("");
  lines.push("| Session | Exists | commands.sh executable | Validator | Warnings |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const session of summary.sessions) {
    lines.push(`| ${escapeCell(session.label)} | ${session.exists ? "yes" : "no"} | ${session.commandsExecutable ? "yes" : "no"} | ${session.validatorOk ? "pass" : "fail"} | ${escapeCell(session.validatorWarnings.join("; ") || "-")} |`);
  }
  lines.push("");
  lines.push("## Gate Snapshot");
  lines.push("");
  lines.push(`- Latest device evidence: ${summary.latestDeviceEvidence.path || "missing"}`);
  lines.push(`- Latest device evidence validation: ${summary.latestDeviceEvidence.validatorOk ? "pass" : "not ready"}`);
  lines.push(`- Can run phone session now: ${summary.canRunPhoneSession ? "yes" : "no"}`);
  lines.push(`- Glasses setup default validation: ${summary.glassesSetup.defaultOk ? "pass" : "fail"}`);
  lines.push(`- Meta application id configured: ${summary.glassesSetup.hasMetaApplicationId ? "yes" : "no"}`);
  lines.push(`- GitHub Packages token configured: ${summary.glassesSetup.hasGithubToken ? "yes" : "no"}`);
  lines.push(`- Glasses preflight status: ${summary.glassesPreflight.status}, pass=${summary.glassesPreflight.pass ?? "-"}, manual=${summary.glassesPreflight.manual ?? "-"}, blocked=${summary.glassesPreflight.blocked ?? "-"}`);
  lines.push(`- Default hardware runner summary available: ${summary.runnerSummary.available ? "yes" : "no"}`);
  lines.push(`- Default hardware runner summary status: ${summary.runnerSummary.ok ? "pass" : "not ready"}`);
  lines.push("");
  lines.push("## Recommended Runner Command");
  lines.push("");
  lines.push("```bash");
  lines.push(summary.recommendedRunnerCommand);
  lines.push("```");
  lines.push("");
  lines.push("## Next Actions");
  lines.push("");
  for (const action of summary.nextActions) {
    lines.push(`- ${action}`);
  }
  lines.push("");
  lines.push("## Privacy Guardrail");
  lines.push("");
  lines.push("This report intentionally records only aggregate readiness status, booleans, counts, command recommendations, and workspace-relative paths.");
  return `${lines.join("\n")}\n`;
}

const generatedAt = kstTimestamp();
const adb = adbStatus();
const local = localToolchainStatus();
const sessions = [
  sessionStatus("Physical phone", physicalSession, "scripts/validate-physical-test-session.mjs"),
  sessionStatus("Support drill", supportSession, "scripts/validate-support-drill-session.mjs"),
  sessionStatus("Glasses hardware", glassesSession, "scripts/validate-glasses-hardware-session.mjs"),
  sessionStatus("Private alpha rehearsal", rehearsalSession, "scripts/validate-private-alpha-rehearsal.mjs"),
];
const glassesSetupValidation = runNodeJson("scripts/validate-glasses-setup-readiness.mjs");
const latestEvidencePath = latestDeviceEvidence();
const latestEvidenceValidation = latestEvidencePath
  ? runNodeJson("scripts/validate-device-evidence.mjs", [latestEvidencePath])
  : { ok: false, parsed: { warnings: [], errors: ["No device-evidence.md exists yet."] } };
const summary = {
  ok: false,
  generatedAt,
  reportDir: reportDirArg,
  reportPath: path.join(reportDirArg, "hardware-readiness-preflight.md"),
  summaryJsonPath: path.join(reportDirArg, "hardware-readiness-preflight.json"),
  local,
  adb,
  sessions,
  canRunPhoneSession: local.debugApkPresent && adb.attachedDeviceCount === 1,
  latestDeviceEvidence: {
    path: latestEvidencePath,
    validatorOk: latestEvidenceValidation.ok,
    validatorWarnings: latestEvidenceValidation.parsed?.warnings ?? [],
    validatorErrors: latestEvidenceValidation.parsed?.errors ?? [],
  },
  glassesSetup: {
    defaultOk: glassesSetupValidation.ok,
    hasMetaApplicationId: glassesSetupValidation.parsed?.hasMetaApplicationId === true,
    hasGithubToken: glassesSetupValidation.parsed?.hasGithubToken === true,
    localPropertiesPresent: glassesSetupValidation.parsed?.localPropertiesPresent === true,
  },
  glassesPreflight: parsePreflight(GLASSES_PREFLIGHT),
  runnerSummary: parseRunnerSummary(DEFAULT_RUNNER_SUMMARY),
};
summary.recommendedRunnerCommand = commandFor(summary);
summary.nextActions = deriveNextActions(summary);
summary.ok = sessions.every((session) => session.exists && session.commandsExecutable && session.validatorOk) &&
  local.javaHomePresent &&
  local.androidHomePresent &&
  local.debugApkPresent &&
  summary.runnerSummary.ok;

if (wantsWriteReport) {
  const { absolute } = resolveInsideWorkspace(reportDirArg);
  fs.mkdirSync(absolute, { recursive: true });
  fs.writeFileSync(path.join(absolute, "hardware-readiness-preflight.md"), renderReport(summary));
  fs.writeFileSync(path.join(absolute, "hardware-readiness-preflight.json"), `${JSON.stringify(summary, null, 2)}\n`);
  if (!wantsJson) {
    console.log(`Private alpha hardware readiness report written: ${path.join(absolute, "hardware-readiness-preflight.md")}`);
  }
}

if (wantsJson) {
  console.log(JSON.stringify(summary, null, 2));
} else if (!wantsWriteReport) {
  process.stdout.write(renderReport(summary));
}

process.exit(summary.ok ? 0 : 1);
