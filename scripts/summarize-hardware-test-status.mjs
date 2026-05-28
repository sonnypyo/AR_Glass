#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PACK = "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack";
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard";
const ANDROID_XR_CONTRACT = "data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract/android-xr-projected-contract.json";
const DEFAULT_CONTROLLED_DIRECTION_SESSION = "data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const wantsWriteReport = args.includes("--write-report");
const showHelp = args.includes("--help") || args.includes("-h");
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;
const controlledDirectionSessionArg = valueAfter("--controlled-direction-session") || DEFAULT_CONTROLLED_DIRECTION_SESSION;
const packArg = positionalArgs()[0] || DEFAULT_PACK;

function usage() {
  return [
    "Usage: scripts/summarize-hardware-test-status.mjs [operator-pack-dir] [--controlled-direction-session DIR] [--write-report] [--report-dir DIR] [--json]",
    "",
    "Summarizes the current phone, glasses, Android XR, support, and promotion status for a hardware test day.",
    "The summary is non-PII: it stores only booleans, counts, statuses, command recommendations, and workspace-relative paths.",
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
    if (arg === "--report-dir" || arg === "--controlled-direction-session") {
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

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT_DIR, relativePath));
}

function readJson(relativePath, label, errors) {
  if (!fileExists(relativePath)) {
    errors.push(`${label} is missing: ${relativePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8"));
  } catch (error) {
    errors.push(`${label} could not be parsed: ${error.message}`);
    return null;
  }
}

function runJson(label, commandArgs) {
  const result = spawnSync(process.execPath, commandArgs, {
    cwd: ROOT_DIR,
    encoding: "utf8",
  });
  let parsed = null;
  const text = (result.stdout || "").trim();
  if (text.startsWith("{")) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  return {
    label,
    ok: result.status === 0,
    exitCode: typeof result.status === "number" ? result.status : 1,
    parsedOk: parsed?.ok === true,
    parsed,
  };
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

function statusFor(ok, blocked, manual) {
  if (ok) return "ready";
  if (blocked) return "blocked";
  if (manual) return "manual-required";
  return "not-ready";
}

function lane(label, status, command, blockers = [], nextActions = [], evidenceGaps = []) {
  return { label, status, command, blockers, nextActions, evidenceGaps };
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function parseSimpleCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const header = lines.shift()?.split(",") ?? [];
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""]));
  });
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "missing";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function controlledDirectionSessionStatus(sessionArg, errors) {
  const session = resolveInsideWorkspace(sessionArg);
  const exists = fs.existsSync(session.absolute) && fs.statSync(session.absolute).isDirectory();
  const validator = runJson("Validate controlled direction trial session", [
    path.join(ROOT_DIR, "scripts/validate-controlled-direction-trial-session.mjs"),
    session.relative,
    "--json",
  ]);
  const result = {
    sessionDir: session.relative,
    exists,
    validatorOk: validator.ok,
    validatorExitCode: validator.exitCode,
    validatorWarnings: validator.parsed?.warnings ?? [],
    validatorErrors: validator.parsed?.errors ?? [],
    commandsPath: path.join(session.relative, "commands.sh"),
    aggregateSummaryPath: path.join(session.relative, "aggregate-summary-template.json"),
    trialPlanPath: path.join(session.relative, "trial-plan.csv"),
    status: "missing",
    source: "missing",
    route: "missing",
    trialsPerDirection: 0,
    totalPlannedRows: 0,
    plannedByDirection: {},
    recordedRows: 0,
    todoRows: 0,
    recorderCommandRows: 0,
    productionDirectionCandidate: false,
    planningReady: false,
    observedRowsComplete: false,
  };

  if (!exists) {
    errors.push(`Controlled direction trial session is missing: ${session.relative}`);
    return result;
  }

  const aggregatePath = path.join(session.absolute, "aggregate-summary-template.json");
  const trialPlanPath = path.join(session.absolute, "trial-plan.csv");
  if (!fs.existsSync(aggregatePath) || !fs.existsSync(trialPlanPath)) {
    return result;
  }

  try {
    const aggregate = JSON.parse(fs.readFileSync(aggregatePath, "utf8"));
    const rows = parseSimpleCsv(fs.readFileSync(trialPlanPath, "utf8"));
    const recordedRows = rows.filter((row) =>
      row.recorderCommandRan === "yes" ||
      row.observedDirection !== "TODO" ||
      row.status !== "TODO" ||
      row.confidenceBucket !== "TODO"
    ).length;
    result.status = aggregate.status ?? "unknown";
    result.source = aggregate.source ?? "unknown";
    result.route = aggregate.route ?? "unknown";
    result.trialsPerDirection = aggregate.expected?.trialsPerDirection ?? 0;
    result.totalPlannedRows = rows.length;
    result.plannedByDirection = countBy(rows, "expectedDirection");
    result.recordedRows = recordedRows;
    result.todoRows = Math.max(rows.length - recordedRows, 0);
    result.recorderCommandRows = rows.filter((row) => row.recorderCommandRan === "yes").length;
    result.productionDirectionCandidate = aggregate.productionDirectionCandidate === true;
    result.planningReady = validator.ok && rows.length > 0;
    result.observedRowsComplete = rows.length > 0 && recordedRows === rows.length;
  } catch (error) {
    errors.push(`Controlled direction trial session could not be summarized: ${error.message}`);
  }

  return result;
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# Hardware Test Status Dashboard");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Pack: ${summary.packDir}`);
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  lines.push(`- Current safe workflow: ${summary.currentSafeWorkflow ? "yes" : "no"}`);
  lines.push(`- Phone alpha candidate: ${summary.candidates.phonePrivateAlphaCandidate ? "yes" : "no"}`);
  lines.push(`- Glasses alpha candidate: ${summary.candidates.glassesPrivateAlphaCandidate ? "yes" : "no"}`);
  lines.push(`- Controlled direction plan ready: ${summary.controlledDirection.planningReady ? "yes" : "no"}`);
  lines.push(`- Controlled direction observed rows complete: ${summary.controlledDirection.observedRowsComplete ? "yes" : "no"}`);
  lines.push(`- Private alpha candidate: ${summary.privateAlphaCandidate ? "yes" : "no"}`);
  lines.push("");
  lines.push("## Lane Status");
  lines.push("");
  lines.push("| Lane | Status | Command | Blockers |");
  lines.push("| --- | --- | --- | --- |");
  for (const item of summary.lanes) {
    lines.push(`| ${escapeCell(item.label)} | ${item.status} | \`${escapeCell(item.command)}\` | ${escapeCell(item.blockers.join("; ") || "-")} |`);
  }
  lines.push("");
  lines.push("## Evidence Gaps");
  lines.push("");
  lines.push("| Lane | Evidence gaps after collection |");
  lines.push("| --- | --- |");
  for (const item of summary.lanes) {
    lines.push(`| ${escapeCell(item.label)} | ${escapeCell(item.evidenceGaps?.join("; ") || "-")} |`);
  }
  lines.push("");
  lines.push("## Key Evidence");
  lines.push("");
  lines.push(`- Hardware readiness summary: \`${summary.paths.hardwareReadinessSummary}\``);
  lines.push(`- Phone summary: \`${summary.paths.phoneSummary}\``);
  lines.push(`- Glasses summary: \`${summary.paths.glassesSummary}\``);
  lines.push(`- Promotion report: \`${summary.paths.promotionReport}\``);
  lines.push(`- Evidence privacy scan: \`${summary.paths.evidencePrivacyScan}\``);
  lines.push(`- Android XR contract: \`${summary.paths.androidXrContract}\``);
  lines.push(`- Controlled direction session: \`${summary.paths.controlledDirectionSession}\``);
  lines.push("");
  lines.push("## Current Counts");
  lines.push("");
  lines.push(`- Authorized ADB devices: ${summary.counts.authorizedAdbDevices}`);
  lines.push(`- Glasses preflight: ${summary.glassesPreflight.status}, pass=${summary.glassesPreflight.pass}, manual=${summary.glassesPreflight.manual}, blocked=${summary.glassesPreflight.blocked}`);
  lines.push(`- Phone direction summary validated: ${summary.candidates.phoneDirectionSummaryValidated ? "yes" : "no"}`);
  lines.push(`- Phone direction manifest apply dry-run: ${summary.candidates.phoneDirectionManifestApplyDryRunOk ? "yes" : "no"}`);
  lines.push(`- Phone direction manifest apply ready: ${summary.candidates.phoneDirectionManifestApplyReady ? "yes" : "no"}`);
  lines.push(`- Evidence privacy scan: ${summary.evidencePrivacyScan.ok ? "pass" : "fail"}, files=${summary.evidencePrivacyScan.filesScanned}, violations=${summary.evidencePrivacyScan.violationCount}`);
  lines.push(`- Android XR contract mode: ${summary.androidXr.currentMode}`);
  lines.push(`- Real Android XR candidate: ${summary.androidXr.realAndroidXrCandidate ? "yes" : "no"}`);
  lines.push(`- Controlled direction validator: ${summary.controlledDirection.validatorOk ? "pass" : "fail"}`);
  lines.push(`- Controlled direction planned rows: ${summary.controlledDirection.totalPlannedRows}`);
  lines.push(`- Controlled direction recorded rows: ${summary.controlledDirection.recordedRows}`);
  lines.push(`- Controlled direction TODO rows: ${summary.controlledDirection.todoRows}`);
  lines.push(`- Controlled direction source/route: ${summary.controlledDirection.source} / ${summary.controlledDirection.route}`);
  lines.push("");
  lines.push("## Next Actions");
  lines.push("");
  for (const action of summary.nextActions) {
    lines.push(`- ${action}`);
  }
  lines.push("");
  lines.push("## Privacy Guardrail");
  lines.push("");
  lines.push(summary.privacyGuardrail);
  lines.push("");
  return lines.join("\n");
}

function summarize() {
  const errors = [];
  const pack = resolveInsideWorkspace(packArg);
  const reportDir = resolveInsideWorkspace(reportDirArg);
  const paths = {
    hardwareReadinessSummary: path.join(pack.relative, "hardware-readiness/hardware-readiness-preflight.json"),
    phoneSummary: path.join(pack.relative, "phone-alpha-runner/phone-alpha-evidence-summary.json"),
    glassesSummary: path.join(pack.relative, "glasses-alpha-runner/glasses-alpha-evidence-summary.json"),
    promotionReport: path.join(pack.relative, "promotion-validation/promotion-validation.json"),
    evidencePrivacyScan: path.join(pack.relative, "evidence-privacy-scan/evidence-privacy-scan.json"),
    androidXrContract: ANDROID_XR_CONTRACT,
    controlledDirectionSession: resolveInsideWorkspace(controlledDirectionSessionArg).relative,
  };

  if (!fs.existsSync(pack.absolute) || !fs.statSync(pack.absolute).isDirectory()) {
    errors.push(`Operator pack directory is missing: ${pack.relative}`);
  }

  const readiness = readJson(paths.hardwareReadinessSummary, "Hardware readiness summary", errors);
  const phone = readJson(paths.phoneSummary, "Phone alpha summary", errors);
  const glasses = readJson(paths.glassesSummary, "Glasses alpha summary", errors);
  const promotion = readJson(paths.promotionReport, "Promotion report", errors);
  const androidXr = readJson(paths.androidXrContract, "Android XR projected contract", errors);

  const packValidation = runJson("Validate operator pack", [
    path.join(ROOT_DIR, "scripts/validate-hardware-test-operator-pack.mjs"),
    pack.relative,
    "--json",
  ]);
  const workflowPromotion = runJson("Validate workflow promotion", [
    path.join(ROOT_DIR, "scripts/validate-hardware-test-promotion.mjs"),
    pack.relative,
    "--profile",
    "workflow",
    "--json",
  ]);
  const currentSafeGate = runJson("Assert current-safe gate", [
    path.join(ROOT_DIR, "scripts/assert-service-gates.mjs"),
    "--profile",
    "current-safe",
    "--json",
  ]);
  const evidencePrivacyScan = runJson("Scan operator pack privacy", [
    path.join(ROOT_DIR, "scripts/scan-evidence-privacy.mjs"),
    pack.relative,
    "--json",
  ]);
  const controlledDirection = controlledDirectionSessionStatus(controlledDirectionSessionArg, errors);

  const authorized = readiness?.adb?.attachedDeviceCount ?? 0;
  const canRunPhone = readiness?.canRunPhoneSession === true;
  const hasMetaApplicationId = readiness?.glassesSetup?.hasMetaApplicationId === true;
  const hasGithubToken = readiness?.glassesSetup?.hasGithubToken === true;
  const glassesPreflight = readiness?.glassesPreflight ?? { status: "missing", pass: 0, manual: 0, blocked: 0 };

  const phoneCandidate = phone?.phonePrivateAlphaCandidate === true;
  const phoneDirectionSummaryValidated = phone?.directionEvidence?.validatorOk === true;
  const phoneDirectionManifestApplyDryRunOk = phone?.directionEvidence?.applyDryRunOk === true;
  const phoneDirectionManifestApplyReady = phone?.directionEvidence?.applyReady === true;
  const glassesCandidate = glasses?.glassesPrivateAlphaCandidate === true;
  const supportStrictRequested = promotion?.candidates?.supportStrictRequested === true;
  const privateAlphaCandidate = phoneCandidate && glassesCandidate && supportStrictRequested;
  const androidXrRealCandidate = androidXr?.realAndroidXrCandidate === true;
  const phoneCollectionBlockers = [
    ...(authorized === 1 ? [] : [`authorized ADB devices must be exactly 1, current=${authorized}`]),
    ...(authorized === 1 && !canRunPhone ? ["phone readiness preflight did not approve RUN_PHONE=1"] : []),
  ];
  const phoneEvidenceGaps = [
    ...(phone?.deviceEvidence?.exists === true ? [] : ["real phone device-evidence.md not collected yet"]),
    ...(phoneDirectionSummaryValidated ? [] : ["direction summary will be generated only after real phone device-evidence.md exists"]),
    ...(phoneDirectionSummaryValidated && !phoneDirectionManifestApplyDryRunOk ? ["direction manifest apply dry-run missing after direction summary"] : []),
    ...(phoneDirectionManifestApplyReady ? [] : ["direction manifest apply is not ready for canonical promotion"]),
    ...(phoneCandidate ? [] : ["phone private alpha candidate false until manual device evidence rows pass"]),
  ];

  const lanes = [
    lane(
      "Default no-hardware workflow",
      statusFor(packValidation.ok && workflowPromotion.ok && currentSafeGate.ok && evidencePrivacyScan.ok, false, false),
      path.join(pack.relative, "commands.sh"),
      [
        ...(packValidation.ok ? [] : ["operator pack validator failing"]),
        ...(workflowPromotion.ok ? [] : ["workflow promotion validator failing"]),
        ...(currentSafeGate.ok ? [] : ["current-safe service gate failing"]),
        ...(evidencePrivacyScan.ok ? [] : ["operator pack privacy scan failing"]),
      ],
      ["Run before every hardware session."],
    ),
    lane(
      "Phone evidence",
      statusFor(canRunPhone, phoneCollectionBlockers.length > 0, false),
      `RUN_PHONE=1 ${path.join(pack.relative, "commands.sh")}`,
      phoneCollectionBlockers,
      [
        "Attach exactly one authorized Android phone, then run the phone lane.",
        "After the run, validate device evidence, direction summary, and promotion profiles before making any alpha claim.",
      ],
      phoneEvidenceGaps,
    ),
    lane(
      "Glasses evidence",
      statusFor(glassesCandidate, glassesPreflight.blocked > 0 || !hasMetaApplicationId || !hasGithubToken || !androidXrRealCandidate, true),
      `RUN_GLASSES=1 ${path.join(pack.relative, "commands.sh")}`,
      [
        ...(hasMetaApplicationId ? [] : ["Meta application id missing"]),
        ...(hasGithubToken ? [] : ["GitHub Packages token missing"]),
        ...(glassesPreflight.blocked === 0 ? [] : [`glasses preflight blocked=${glassesPreflight.blocked}`]),
        ...(androidXrRealCandidate ? [] : ["real Android XR projected contract not ready"]),
        ...(glassesCandidate ? [] : ["glasses private alpha candidate false"]),
      ],
      ["Collect Ray-Ban Display, Gen 1 fallback, Android XR, and haptics/fallback evidence before strict validation."],
    ),
    lane(
      "Support evidence",
      statusFor(supportStrictRequested, false, true),
      `RUN_SUPPORT=1 ${path.join(pack.relative, "commands.sh")}`,
      [
        ...(supportStrictRequested ? [] : ["support strict evidence not requested or not complete"]),
      ],
      ["Run only when deletion and mistaken-alert drill owners can fill reviewed evidence."],
    ),
    lane(
      "Controlled direction trials",
      statusFor(controlledDirection.observedRowsComplete, !controlledDirection.validatorOk, controlledDirection.planningReady),
      path.join(controlledDirection.sessionDir, "commands.sh"),
      [
        ...(controlledDirection.validatorOk ? [] : ["controlled direction session validator failing"]),
        ...(controlledDirection.observedRowsComplete ? [] : [`observed direction rows incomplete: ${controlledDirection.recordedRows}/${controlledDirection.totalPlannedRows}`]),
        ...(controlledDirection.productionDirectionCandidate ? [] : ["production direction candidate false until aggregate evidence is reviewed"]),
      ],
      ["Run the session commands after installing the debug APK, then fill only aggregate direction counts and reviewed observed rows."],
    ),
  ];

  const nextActions = [
    "Run the default no-hardware workflow before attaching real evidence lanes.",
    ...(canRunPhone ? ["Run the phone lane now if the attached phone is the intended test device."] : ["Attach exactly one authorized Android phone before `RUN_PHONE=1`."]),
    ...(controlledDirection.planningReady
      ? [`Use ${controlledDirection.sessionDir}/trial-plan.csv for the next controlled direction run; recorded rows are ${controlledDirection.recordedRows}/${controlledDirection.totalPlannedRows}.`]
      : ["Generate and validate a controlled direction-trial session before the next direction hardware test."]),
    "Keep phone/glasses/support strict promotion profiles blocked until matching real evidence exists.",
    "Use `scripts/validate-hardware-test-promotion.mjs --profile workflow --json` after every operator-pack run.",
    "Regenerate this dashboard after any phone, glasses, support, Android XR, or preflight evidence change.",
  ];

  return {
    ok: errors.length === 0 && packValidation.ok && workflowPromotion.ok && currentSafeGate.ok && evidencePrivacyScan.ok && controlledDirection.validatorOk,
    generatedAt: kstTimestamp(),
    packDir: pack.relative,
    reportDir: reportDir.relative,
    reportPath: path.join(reportDir.relative, "hardware-test-status-dashboard.md"),
    summaryJsonPath: path.join(reportDir.relative, "hardware-test-status-dashboard.json"),
    currentSafeWorkflow: packValidation.ok && workflowPromotion.ok && currentSafeGate.ok && evidencePrivacyScan.ok,
    privateAlphaCandidate,
    candidates: {
      phonePrivateAlphaCandidate: phoneCandidate,
      phoneDirectionSummaryValidated,
      phoneDirectionManifestApplyDryRunOk,
      phoneDirectionManifestApplyReady,
      phoneDirectionProductionCandidate: phone?.directionEvidence?.productionDirectionCandidate === true,
      glassesPrivateAlphaCandidate: glassesCandidate,
      glassesHardwareEvidenceCandidate: glasses?.glassesHardwareEvidenceCandidate === true,
      supportStrictRequested,
    },
    collectionReadiness: {
      phoneReadyToCollect: canRunPhone,
      phoneCollectionBlockers,
      phoneEvidenceGaps,
    },
    counts: {
      authorizedAdbDevices: authorized,
      unauthorizedAdbDevices: readiness?.adb?.unauthorizedCount ?? 0,
      offlineAdbDevices: readiness?.adb?.offlineCount ?? 0,
    },
    glassesPreflight,
    androidXr: {
      currentMode: androidXr?.currentMode ?? "missing",
      phonePreviewOnly: androidXr?.phonePreviewOnly === true,
      realAndroidXrCandidate: androidXrRealCandidate,
      strictMissingCount: androidXr?.strictRealAndroidXrMissing?.length ?? null,
    },
    controlledDirection,
    evidencePrivacyScan: {
      ok: evidencePrivacyScan.ok,
      exitCode: evidencePrivacyScan.exitCode,
      filesScanned: evidencePrivacyScan.parsed?.filesScanned ?? null,
      violationCount: evidencePrivacyScan.parsed?.violations?.length ?? null,
      warningCount: evidencePrivacyScan.parsed?.warnings?.length ?? null,
    },
    checks: [packValidation, workflowPromotion, currentSafeGate, evidencePrivacyScan, {
      label: "Validate controlled direction trial session",
      ok: controlledDirection.validatorOk,
      exitCode: controlledDirection.validatorExitCode,
      parsedOk: controlledDirection.validatorOk,
    }].map((check) => ({
      label: check.label,
      ok: check.ok,
      exitCode: check.exitCode,
      parsedOk: check.parsedOk,
    })),
    lanes,
    paths,
    nextActions,
    errors,
    privacyGuardrail: "This dashboard stores only booleans, counts, statuses, command recommendations, and workspace-relative paths. It must not include raw command output, ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, private alert text, exact locations, tokens, or application id values.",
  };
}

const summary = summarize();
if (wantsWriteReport) {
  const reportDir = resolveInsideWorkspace(reportDirArg);
  fs.mkdirSync(reportDir.absolute, { recursive: true });
  fs.writeFileSync(path.join(reportDir.absolute, "hardware-test-status-dashboard.md"), renderMarkdown(summary));
  fs.writeFileSync(path.join(reportDir.absolute, "hardware-test-status-dashboard.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

if (wantsJson) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  process.stdout.write(renderMarkdown(summary));
}

process.exit(summary.ok ? 0 : 1);
