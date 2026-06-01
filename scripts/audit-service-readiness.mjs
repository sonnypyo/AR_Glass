#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const RELEASE_SOURCE = "apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/qa/ReleaseReadiness.kt";
const GLASSES_SOURCE = "apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/devices/GlassesIntegrationReadiness.kt";
const DEVICE_EVIDENCE_VALIDATOR = "scripts/validate-device-evidence.mjs";

const targetOrder = [
  "INTERNAL_PROTOTYPE",
  "PHONE_PRIVATE_ALPHA",
  "GLASSES_PRIVATE_ALPHA",
  "EXTERNAL_BETA",
  "PRODUCTION_SERVICE",
];
const platformOrder = ["META_DAT", "ANDROID_XR"];

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const wantsWrite = args.includes("--write-report");
const showHelp = args.includes("--help") || args.includes("-h");
const reportDirArg = valueAfter("--report-dir");

function usage() {
  return [
    "Usage: scripts/audit-service-readiness.mjs [--json] [--write-report] [--report-dir DIR]",
    "",
    "Audits the app-factory release gates from the Kotlin checklist sources and local evidence files.",
    "The audit is non-destructive and does not require an attached Android device.",
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

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");
}

function extractCallBodies(source, callName) {
  const bodies = [];
  let searchFrom = 0;
  while (searchFrom < source.length) {
    const callIndex = source.indexOf(`${callName}(`, searchFrom);
    if (callIndex === -1) break;

    const openIndex = callIndex + callName.length;
    let depth = 0;
    let inString = false;
    let escaping = false;
    let endIndex = -1;

    for (let i = openIndex; i < source.length; i += 1) {
      const char = source[i];
      if (inString) {
        if (escaping) {
          escaping = false;
        } else if (char === "\\") {
          escaping = true;
        } else if (char === "\"") {
          inString = false;
        }
        continue;
      }

      if (char === "\"") {
        inString = true;
      } else if (char === "(") {
        depth += 1;
      } else if (char === ")") {
        depth -= 1;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex === -1) {
      throw new Error(`Could not parse ${callName} call starting at offset ${callIndex}.`);
    }

    bodies.push(source.slice(openIndex + 1, endIndex));
    searchFrom = endIndex + 1;
  }
  return bodies;
}

function namedString(body, field) {
  const match = body.match(new RegExp(`${field}\\s*=\\s*"([^"]*)"`));
  return match ? match[1] : "";
}

function namedEnum(body, field, enumName) {
  const match = body.match(new RegExp(`${field}\\s*=\\s*${enumName}\\.([A-Z_]+)`));
  return match ? match[1] : "";
}

function namedBoolean(body, field, defaultValue) {
  const match = body.match(new RegExp(`${field}\\s*=\\s*(true|false)`));
  return match ? match[1] === "true" : defaultValue;
}

function parseReleaseItems() {
  const source = readProjectFile(RELEASE_SOURCE);
  return extractCallBodies(source, "ReleaseReadinessItem").filter((body) => /\bid\s*=/.test(body)).map((body) => ({
    id: namedString(body, "id"),
    target: namedEnum(body, "requiredFor", "ReleaseTarget"),
    status: namedEnum(body, "status", "ReleaseReadinessStatus"),
    title: namedString(body, "title"),
    evidence: namedString(body, "evidence"),
    nextAction: namedString(body, "nextAction"),
    blocks: namedBoolean(body, "blocksTargetWhenUnmet", true),
  }));
}

function parseGlassesItems() {
  const source = readProjectFile(GLASSES_SOURCE);
  return extractCallBodies(source, "GlassesReadinessItem").filter((body) => /\bid\s*=/.test(body)).map((body) => ({
    id: namedString(body, "id"),
    platform: namedEnum(body, "platform", "GlassesPlatform"),
    status: namedEnum(body, "status", "GlassesReadinessStatus"),
    title: namedString(body, "title"),
    evidence: namedString(body, "evidence"),
    nextAction: namedString(body, "nextAction"),
    blocks: namedBoolean(body, "blocksGlassesAlpha", true),
  }));
}

function assertParsedItems(items, requiredFields, label) {
  const errors = [];
  for (const item of items) {
    for (const field of requiredFields) {
      if (!item[field]) {
        errors.push(`${label} item is missing ${field}: ${JSON.stringify(item)}`);
      }
    }
  }
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

function summarizeTargets(items) {
  return targetOrder.map((target, targetIndex) => {
    const required = items.filter((item) => targetOrder.indexOf(item.target) <= targetIndex);
    const open = required.filter((item) => item.blocks && item.status !== "PASS");
    return {
      target,
      total: required.length,
      pass: required.filter((item) => item.status === "PASS").length,
      manual: required.filter((item) => item.status === "MANUAL_REQUIRED").length,
      blocked: required.filter((item) => item.status === "BLOCKED").length,
      ready: open.length === 0,
      openIds: open.map((item) => item.id),
    };
  });
}

function summarizePlatforms(items) {
  return platformOrder.map((platform) => {
    const platformItems = items.filter((item) => item.platform === platform);
    const open = platformItems.filter((item) => item.blocks && item.status !== "PASS");
    return {
      platform,
      total: platformItems.length,
      pass: platformItems.filter((item) => item.status === "PASS").length,
      manual: platformItems.filter((item) => item.status === "MANUAL_REQUIRED").length,
      blocked: platformItems.filter((item) => item.status === "BLOCKED").length,
      ready: open.length === 0,
      openIds: open.map((item) => item.id),
    };
  });
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT_DIR, relativePath));
}

function listFilesRecursive(startDir, fileName) {
  const absoluteStart = path.join(ROOT_DIR, startDir);
  if (!fs.existsSync(absoluteStart)) return [];
  const results = [];
  const stack = [absoluteStart];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
      } else if (entry.isFile() && entry.name === fileName) {
        results.push(path.relative(ROOT_DIR, absolute));
      }
    }
  }
  return results.sort((a, b) => {
    const aTime = fs.statSync(path.join(ROOT_DIR, a)).mtimeMs;
    const bTime = fs.statSync(path.join(ROOT_DIR, b)).mtimeMs;
    return bTime - aTime;
  });
}

function runDeviceEvidenceValidator(relativePath) {
  if (!relativePath) {
    return { available: false, ok: false, warnings: [], errors: ["No device-evidence.md file found under data/runs."] };
  }
  const result = spawnSync(process.execPath, [
    path.join(ROOT_DIR, DEVICE_EVIDENCE_VALIDATOR),
    path.join(ROOT_DIR, relativePath),
    "--json",
  ], { encoding: "utf8" });

  if (result.status !== 0 && !result.stdout.trim()) {
    return {
      available: true,
      ok: false,
      warnings: [],
      errors: [result.stderr.trim() || `Validator exited with status ${result.status}.`],
    };
  }

  try {
    const parsed = JSON.parse(result.stdout);
    return {
      available: true,
      ok: parsed.ok === true,
      warnings: parsed.warnings ?? [],
      errors: parsed.errors ?? [],
    };
  } catch (error) {
    return {
      available: true,
      ok: false,
      warnings: [],
      errors: [`Could not parse validator JSON: ${error.message}`],
    };
  }
}

function extractPreflightStatus(relativePath) {
  if (!relativePath || !fileExists(relativePath)) {
    return { available: false, status: "missing", blocked: null, manual: null, pass: null };
  }
  const markdown = readProjectFile(relativePath);
  return {
    available: true,
    status: markdown.match(/-\s*Overall status:\s*([^\n]+)/)?.[1]?.trim() ?? "unknown",
    blocked: numberAfter(markdown, "Blocked"),
    manual: numberAfter(markdown, "Manual required"),
    pass: numberAfter(markdown, "Pass"),
  };
}

function numberAfter(markdown, label) {
  const match = markdown.match(new RegExp(`-\\s*${label}:\\s*(\\d+)`, "i"));
  return match ? Number(match[1]) : null;
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

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|");
}

function renderMarkdown(audit) {
  const lines = [];
  lines.push("# Service Readiness Audit");
  lines.push("");
  lines.push(`Generated: ${audit.generatedAt}`);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("This audit ties the implemented app, release checklist, glasses readiness checklist, and local evidence files into one service-readiness view. It is meant to be regenerated after every physical phone or glasses test.");
  lines.push("");
  lines.push("## Target Summary");
  lines.push("");
  lines.push("| Target | Ready | Total | Pass | Manual | Blocked | Open Blocking IDs |");
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | --- |");
  for (const summary of audit.releaseTargets) {
    lines.push(`| ${escapeCell(summary.target)} | ${summary.ready ? "yes" : "no"} | ${summary.total} | ${summary.pass} | ${summary.manual} | ${summary.blocked} | ${escapeCell(summary.openIds.join(", ") || "-")} |`);
  }
  lines.push("");
  lines.push("## Glasses Summary");
  lines.push("");
  lines.push("| Platform | Ready For Glasses Alpha | Total | Pass | Manual | Blocked | Open Blocking IDs |");
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | --- |");
  for (const summary of audit.glassesPlatforms) {
    lines.push(`| ${escapeCell(summary.platform)} | ${summary.ready ? "yes" : "no"} | ${summary.total} | ${summary.pass} | ${summary.manual} | ${summary.blocked} | ${escapeCell(summary.openIds.join(", ") || "-")} |`);
  }
  lines.push("");
  lines.push("## Local Evidence");
  lines.push("");
  lines.push("| Evidence | Status | Notes |");
  lines.push("| --- | --- | --- |");
  for (const artifact of audit.artifacts) {
    lines.push(`| ${escapeCell(artifact.label)} | ${artifact.exists ? "present" : "missing"} | ${escapeCell(artifact.path)} |`);
  }
  lines.push(`| Latest device evidence report | ${audit.deviceEvidence.path ? "present" : "missing"} | ${escapeCell(audit.deviceEvidence.path || "Run scripts/android-device-smoke-test.sh --write-evidence with a phone attached.")} |`);
  lines.push(`| Device evidence validator | ${audit.deviceEvidence.validation.available ? (audit.deviceEvidence.validation.ok ? "pass" : "fail") : "not-run"} | ${escapeCell([...audit.deviceEvidence.validation.errors, ...audit.deviceEvidence.validation.warnings].join("; ") || "No warnings.")} |`);
  lines.push(`| Latest glasses preflight | ${audit.glassesPreflight.available ? audit.glassesPreflight.status : "missing"} | pass=${audit.glassesPreflight.pass ?? "-"}, manual=${audit.glassesPreflight.manual ?? "-"}, blocked=${audit.glassesPreflight.blocked ?? "-"} |`);
  lines.push("");
  lines.push("## Current Promotion Decision");
  lines.push("");
  const internal = audit.releaseTargets.find((summary) => summary.target === "INTERNAL_PROTOTYPE");
  const phone = audit.releaseTargets.find((summary) => summary.target === "PHONE_PRIVATE_ALPHA");
  const glasses = audit.releaseTargets.find((summary) => summary.target === "GLASSES_PRIVATE_ALPHA");
  const external = audit.releaseTargets.find((summary) => summary.target === "EXTERNAL_BETA");
  const production = audit.releaseTargets.find((summary) => summary.target === "PRODUCTION_SERVICE");
  lines.push(`- Internal prototype: ${internal?.ready ? "ready" : "not ready"}.`);
  lines.push(`- Phone private alpha: ${phone?.ready ? "ready" : "not ready"}; physical phone evidence is still required when open ids remain.`);
  lines.push(`- Glasses private alpha: ${glasses?.ready ? "ready" : "blocked"}; Meta DAT credentials, real adapters, and wearable proof must close first.`);
  lines.push(`- External beta: ${external?.ready ? "ready" : "blocked"}; production speaker verification, tester/policy review, and public privacy-policy hosting remain outside the current prototype.`);
  lines.push(`- Production service: ${production?.ready ? "ready" : "blocked"}; front/back direction evidence, policy clearance, Play/privacy submission package, upload-signed release artifact, release-track notes, strict screenshot package, strict speaker model evaluation, strict direction accuracy evaluation, support/incident drills, and real glasses hardware proof are not proven yet.`);
  lines.push("");
  lines.push("## Next Execution Path");
  lines.push("");
  lines.push("1. Connect a physical Android phone and run `scripts/android-device-smoke-test.sh --write-evidence`.");
  lines.push("2. Fill the manual rows in the generated `device-evidence.md`, then run `scripts/validate-device-evidence.mjs <device-evidence.md> --json`.");
  lines.push("3. Keep `docs/16-privacy-policy-data-safety-draft.md` valid after every SDK or data-flow change.");
  lines.push("4. Keep `docs/17-store-review-submission-package-draft.md` valid after every listing, media, SDK, release-track, or review-instruction change.");
  lines.push("5. Keep `docs/18-release-artifact-signing-runbook.md` valid after every release artifact, signing, or Play App Signing change.");
  lines.push("6. Keep `docs/19-release-notes-versioning.md` valid after every Gradle version, release-note, or Play track change.");
  lines.push("7. Keep `docs/20-play-screenshot-media-runbook.md` valid after every screenshot, feature graphic, Android XR media, or Play preview-asset change.");
  lines.push("8. Keep `docs/21-production-speaker-model-evaluation.md` valid after every model candidate, threshold, evaluation, latency, or anti-spoofing change.");
  lines.push("9. Keep `docs/22-direction-accuracy-evidence.md` valid after every direction algorithm, microphone metadata, controlled trial, route evidence, or platform claim change.");
  lines.push("10. Keep `docs/23-support-drill-evidence.md` valid after every support channel, deletion drill, mistaken-alert drill, or support evidence change.");
  lines.push("11. Keep `docs/24-glasses-setup-readiness.md` valid after every Meta DAT, Android XR, credential-template, or projected-source change.");
  lines.push("12. Keep `docs/25-glasses-hardware-evidence.md` valid after every Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, or haptics proof change.");
  lines.push("13. Generate a glasses hardware session with `scripts/create-glasses-hardware-session.mjs` before copying hardware proof into the canonical manifest.");
  lines.push("14. Validate filled glasses hardware sessions with `scripts/validate-glasses-hardware-session.mjs <session-dir> --json`.");
  lines.push("15. Dry-run reviewed glasses hardware manifest updates with `scripts/apply-glasses-hardware-session.mjs <session-dir> --json` before using `--write`.");
  lines.push("16. Run `scripts/create-private-alpha-rehearsal.mjs` and `scripts/validate-private-alpha-rehearsal.mjs` before any tester-facing private-alpha claim.");
  lines.push("17. Run `scripts/run-private-alpha-hardware-rehearsal.mjs --json` for the default hardware-day rehearsal summary, then add `--run-phone`, `--run-support`, or `--run-glasses` only when the matching evidence can be collected.");
  lines.push("18. Run `scripts/check-private-alpha-hardware-readiness.mjs --write-report --json` before adding hardware-runner flags on a test day.");
  lines.push("19. Run `scripts/check-platform-source-freshness.mjs --write-report --json` after platform docs, source URLs, or SDK assumptions change.");
  lines.push("20. Keep `docs/31-direction-cue-output-contract.md` valid after every notification, vibration, TTS, or glasses cue formatting change.");
  lines.push("21. Keep `docs/32-direction-validation-evidence-snapshot.md` valid after every direction trial, snapshot, or validator field change.");
  lines.push("22. Keep `docs/33-release-readiness-ui.md` valid after every release checklist, readiness snapshot, or readiness UI change.");
  lines.push("23. Keep `docs/34-release-readiness-next-actions.md` valid after every phone-alpha evidence, next-action, or operator-facing release card change.");
  lines.push("24. Use `scripts/run-phone-private-alpha-evidence.mjs` for the final phone evidence run before making a phone alpha claim.");
  lines.push("25. Validate phone-alpha runner summaries with `scripts/validate-phone-private-alpha-evidence-runner.mjs` and use strict mode only after real phone evidence exists.");
  lines.push("26. Assert promotion profiles with `scripts/assert-service-gates.mjs` before any phone alpha, glasses alpha, beta, or production claim.");
  lines.push("27. Keep `docs/38-glasses-haptics-intent-contract.md` valid after every haptic target, intensity, pulse, fallback, or platform-claim change.");
  lines.push("28. Use `scripts/run-glasses-private-alpha-evidence.mjs` for glasses-lane evidence summaries before any glasses alpha claim.");
  lines.push("29. Validate glasses-lane runner summaries with `scripts/validate-glasses-private-alpha-evidence-runner.mjs` and use strict mode only after real glasses and phone evidence exists.");
  lines.push("30. Generate and validate hardware operator packs with `scripts/create-hardware-test-operator-pack.mjs` and `scripts/validate-hardware-test-operator-pack.mjs` before the real phone/glasses/support test day.");
  lines.push("31. Run the generated operator pack once without hardware flags, then add `RUN_PHONE=1`, `RUN_GLASSES=1`, or `RUN_SUPPORT=1` only when the matching evidence can be collected.");
  lines.push("32. Validate operator-pack outputs with `scripts/validate-hardware-test-promotion.mjs --profile workflow --json`; use strict profiles only after matching real evidence exists.");
  lines.push("33. Confirm the phone runner generated `direction-evidence/direction-evidence-summary.json` after any real phone `device-evidence.md` run.");
  lines.push("34. Extract direction evidence with `scripts/extract-direction-evidence-summary.mjs <device-evidence.md> --json` manually only if using a report outside the phone runner.");
  lines.push("35. Validate the Android XR projected contract with `scripts/validate-android-xr-projected-contract.mjs --json`; use strict mode only after ProjectedContext, Glimmer, real adapter, and device evidence exist.");
  lines.push("36. Confirm `scripts/glasses-integration-preflight.sh --write-evidence` records Android XR default projected contract pass and strict real projected contract manual-required before adapter work.");
  lines.push("37. Regenerate `scripts/summarize-hardware-test-status.mjs --write-report --json` after every operator-pack, phone, glasses, support, Android XR, or preflight evidence change.");
  lines.push("38. Run `scripts/recommend-hardware-next-actions.mjs --write-report --json` after the hardware dashboard changes so the day-of-test command order reflects current blockers.");
  lines.push("39. Confirm `collectionReadiness.phoneCollectionBlockers` contains only pre-run blockers and `collectionReadiness.phoneEvidenceGaps` contains post-run promotion gaps before using the phone lane.");
  lines.push("40. For the next phone pass, run `scripts/run-phone-lane-hardware.mjs --write-report --json`, then add `--execute` only when it reports the phone lane ready.");
  lines.push("41. For unattended phone setup, run `scripts/run-phone-lane-when-ready.mjs --write-report --json`; add `--execute` only when the connected phone is the intended test device.");
  lines.push("42. After a phone-lane execution, run `scripts/review-phone-lane-evidence.mjs --write-report --json` before changing any phone-alpha claim.");
  lines.push("43. Run `scripts/run-hardware-next-action.mjs --execute --write-report --json` only when the selected action is `ready` and should be executed.");
  lines.push("44. Confirm generated phone `device-evidence.md` redacts `Device serial` and `Build fingerprint` before promotion review.");
  lines.push("45. Run `scripts/scan-evidence-privacy.mjs <evidence-or-report-dir> --write-report --json` after every generated evidence/report folder update and before promotion review.");
  lines.push("46. Use `scripts/record-direction-validation-trial.sh` only on installed debug APKs when controlled expected-vs-observed direction trials need repeatable ADB entry.");
  lines.push("47. Generate `scripts/create-controlled-direction-trial-session.mjs --json` before any 20-per-direction front/back/left/right hardware pass.");
  lines.push("48. Add Meta DAT credentials outside source control and rerun `scripts/glasses-integration-preflight.sh --write-evidence`.");
  lines.push("49. Replace stub glasses adapters one platform at a time only after preflight blockers close.");
  lines.push("50. Keep this audit report with the run artifacts after every phone/glasses/support session.");
  lines.push("");
  lines.push("## Privacy Guardrail");
  lines.push("");
  lines.push("This audit intentionally reports only checklist ids, counts, statuses, file presence, and validator errors/warnings. It must not include raw audio, transcripts, speaker names, embedding values, encrypted payload values, Bluetooth owner names, or private alert text.");
  lines.push("");
  lines.push("## Source Files");
  lines.push("");
  lines.push(`- ${RELEASE_SOURCE}`);
  lines.push(`- ${GLASSES_SOURCE}`);
  lines.push(`- ${DEVICE_EVIDENCE_VALIDATOR}`);
  return `${lines.join("\n")}\n`;
}

function createAudit() {
  const releaseItems = parseReleaseItems();
  const glassesItems = parseGlassesItems();
  assertParsedItems(releaseItems, ["id", "target", "status", "title"], "release");
  assertParsedItems(glassesItems, ["id", "platform", "status", "title"], "glasses");

  const deviceEvidenceFiles = listFilesRecursive("data/runs", "device-evidence.md");
  const latestDeviceEvidence = deviceEvidenceFiles[0] ?? "";
  const preflightPath = "data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence/glasses-preflight.md";

  return {
    generatedAt: kstTimestamp(),
    releaseTargets: summarizeTargets(releaseItems),
    glassesPlatforms: summarizePlatforms(glassesItems),
    releaseItems,
    glassesItems,
    artifacts: [
      { label: "Debug APK", path: "apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk", exists: fileExists("apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk") },
      { label: "Project charter", path: "docs/00-project-charter.md", exists: fileExists("docs/00-project-charter.md") },
      { label: "Service development process", path: "docs/05-service-development-process.md", exists: fileExists("docs/05-service-development-process.md") },
      { label: "Device test plan", path: "docs/08-device-test-plan.md", exists: fileExists("docs/08-device-test-plan.md") },
      { label: "Release readiness checklist", path: "docs/10-release-readiness.md", exists: fileExists("docs/10-release-readiness.md") },
      { label: "Glasses preflight guide", path: "docs/11-glasses-integration-preflight.md", exists: fileExists("docs/11-glasses-integration-preflight.md") },
      { label: "Canonical QA report", path: "data/canonical/voice-direction-glass.qa-report.json", exists: fileExists("data/canonical/voice-direction-glass.qa-report.json") },
      { label: "Support incident process", path: "docs/14-support-incident-process.md", exists: fileExists("docs/14-support-incident-process.md") },
      { label: "Policy clearance matrix", path: "docs/15-policy-clearance-matrix.md", exists: fileExists("docs/15-policy-clearance-matrix.md") },
      { label: "Privacy/Data Safety draft", path: "docs/16-privacy-policy-data-safety-draft.md", exists: fileExists("docs/16-privacy-policy-data-safety-draft.md") },
      { label: "Store review submission package", path: "docs/17-store-review-submission-package-draft.md", exists: fileExists("docs/17-store-review-submission-package-draft.md") },
      { label: "Release artifact signing runbook", path: "docs/18-release-artifact-signing-runbook.md", exists: fileExists("docs/18-release-artifact-signing-runbook.md") },
      { label: "Release notes versioning", path: "docs/19-release-notes-versioning.md", exists: fileExists("docs/19-release-notes-versioning.md") },
      { label: "Play screenshot media runbook", path: "docs/20-play-screenshot-media-runbook.md", exists: fileExists("docs/20-play-screenshot-media-runbook.md") },
      { label: "Production speaker model evaluation", path: "docs/21-production-speaker-model-evaluation.md", exists: fileExists("docs/21-production-speaker-model-evaluation.md") },
      { label: "Direction accuracy evidence", path: "docs/22-direction-accuracy-evidence.md", exists: fileExists("docs/22-direction-accuracy-evidence.md") },
      { label: "Support drill evidence", path: "docs/23-support-drill-evidence.md", exists: fileExists("docs/23-support-drill-evidence.md") },
      { label: "Support drill manifest", path: "apps/voice-direction-glass/support-drills/manifest.json", exists: fileExists("apps/voice-direction-glass/support-drills/manifest.json") },
      { label: "Support drill session generator", path: "scripts/create-support-drill-session.mjs", exists: fileExists("scripts/create-support-drill-session.mjs") },
      { label: "Support drill session validator", path: "scripts/validate-support-drill-session.mjs", exists: fileExists("scripts/validate-support-drill-session.mjs") },
      { label: "Glasses setup readiness", path: "docs/24-glasses-setup-readiness.md", exists: fileExists("docs/24-glasses-setup-readiness.md") },
      { label: "Glasses setup validator", path: "scripts/validate-glasses-setup-readiness.mjs", exists: fileExists("scripts/validate-glasses-setup-readiness.mjs") },
      { label: "Local properties example", path: "apps/voice-direction-glass/local.properties.example", exists: fileExists("apps/voice-direction-glass/local.properties.example") },
      { label: "Glasses hardware evidence", path: "docs/25-glasses-hardware-evidence.md", exists: fileExists("docs/25-glasses-hardware-evidence.md") },
      { label: "Glasses hardware manifest", path: "apps/voice-direction-glass/glasses-evidence/manifest.json", exists: fileExists("apps/voice-direction-glass/glasses-evidence/manifest.json") },
      { label: "Glasses hardware validator", path: "scripts/validate-glasses-hardware-evidence.mjs", exists: fileExists("scripts/validate-glasses-hardware-evidence.mjs") },
      { label: "Glasses hardware session runbook", path: "docs/26-glasses-hardware-session-runbook.md", exists: fileExists("docs/26-glasses-hardware-session-runbook.md") },
      { label: "Glasses hardware session generator", path: "scripts/create-glasses-hardware-session.mjs", exists: fileExists("scripts/create-glasses-hardware-session.mjs") },
      { label: "Glasses hardware session validator", path: "scripts/validate-glasses-hardware-session.mjs", exists: fileExists("scripts/validate-glasses-hardware-session.mjs") },
      { label: "Glasses hardware session apply", path: "scripts/apply-glasses-hardware-session.mjs", exists: fileExists("scripts/apply-glasses-hardware-session.mjs") },
      { label: "Private alpha rehearsal runbook", path: "docs/27-private-alpha-rehearsal-runbook.md", exists: fileExists("docs/27-private-alpha-rehearsal-runbook.md") },
      { label: "Private alpha rehearsal generator", path: "scripts/create-private-alpha-rehearsal.mjs", exists: fileExists("scripts/create-private-alpha-rehearsal.mjs") },
      { label: "Private alpha rehearsal validator", path: "scripts/validate-private-alpha-rehearsal.mjs", exists: fileExists("scripts/validate-private-alpha-rehearsal.mjs") },
      { label: "Private alpha hardware runner", path: "docs/28-private-alpha-hardware-runner.md", exists: fileExists("docs/28-private-alpha-hardware-runner.md") },
      { label: "Private alpha hardware runner script", path: "scripts/run-private-alpha-hardware-rehearsal.mjs", exists: fileExists("scripts/run-private-alpha-hardware-rehearsal.mjs") },
      { label: "Private alpha hardware readiness preflight", path: "docs/29-private-alpha-hardware-readiness-preflight.md", exists: fileExists("docs/29-private-alpha-hardware-readiness-preflight.md") },
      { label: "Private alpha hardware readiness preflight script", path: "scripts/check-private-alpha-hardware-readiness.mjs", exists: fileExists("scripts/check-private-alpha-hardware-readiness.mjs") },
      { label: "Platform source freshness", path: "docs/30-platform-source-freshness.md", exists: fileExists("docs/30-platform-source-freshness.md") },
      { label: "Platform source freshness script", path: "scripts/check-platform-source-freshness.mjs", exists: fileExists("scripts/check-platform-source-freshness.mjs") },
      { label: "Direction cue output contract", path: "docs/31-direction-cue-output-contract.md", exists: fileExists("docs/31-direction-cue-output-contract.md") },
      { label: "Direction validation evidence snapshot", path: "docs/32-direction-validation-evidence-snapshot.md", exists: fileExists("docs/32-direction-validation-evidence-snapshot.md") },
      { label: "Release readiness UI", path: "docs/33-release-readiness-ui.md", exists: fileExists("docs/33-release-readiness-ui.md") },
      { label: "Release readiness next actions", path: "docs/34-release-readiness-next-actions.md", exists: fileExists("docs/34-release-readiness-next-actions.md") },
      { label: "Phone private alpha evidence runner", path: "docs/35-phone-private-alpha-evidence-runner.md", exists: fileExists("docs/35-phone-private-alpha-evidence-runner.md") },
      { label: "Phone private alpha evidence runner script", path: "scripts/run-phone-private-alpha-evidence.mjs", exists: fileExists("scripts/run-phone-private-alpha-evidence.mjs") },
      { label: "Phone private alpha runner validator", path: "docs/36-phone-private-alpha-runner-validator.md", exists: fileExists("docs/36-phone-private-alpha-runner-validator.md") },
      { label: "Phone private alpha runner validator script", path: "scripts/validate-phone-private-alpha-evidence-runner.mjs", exists: fileExists("scripts/validate-phone-private-alpha-evidence-runner.mjs") },
      { label: "Service gate assertions", path: "docs/37-service-gate-assertions.md", exists: fileExists("docs/37-service-gate-assertions.md") },
      { label: "Service gate assertion script", path: "scripts/assert-service-gates.mjs", exists: fileExists("scripts/assert-service-gates.mjs") },
      { label: "Glasses haptics intent contract", path: "docs/38-glasses-haptics-intent-contract.md", exists: fileExists("docs/38-glasses-haptics-intent-contract.md") },
      { label: "Glasses private alpha evidence runner", path: "docs/39-glasses-private-alpha-evidence-runner.md", exists: fileExists("docs/39-glasses-private-alpha-evidence-runner.md") },
      { label: "Glasses private alpha evidence runner script", path: "scripts/run-glasses-private-alpha-evidence.mjs", exists: fileExists("scripts/run-glasses-private-alpha-evidence.mjs") },
      { label: "Glasses private alpha runner validator script", path: "scripts/validate-glasses-private-alpha-evidence-runner.mjs", exists: fileExists("scripts/validate-glasses-private-alpha-evidence-runner.mjs") },
      { label: "Hardware test operator pack", path: "docs/40-hardware-test-operator-pack.md", exists: fileExists("docs/40-hardware-test-operator-pack.md") },
      { label: "Hardware test operator pack generator", path: "scripts/create-hardware-test-operator-pack.mjs", exists: fileExists("scripts/create-hardware-test-operator-pack.mjs") },
      { label: "Hardware test operator pack validator", path: "scripts/validate-hardware-test-operator-pack.mjs", exists: fileExists("scripts/validate-hardware-test-operator-pack.mjs") },
      { label: "Hardware test promotion validator", path: "docs/41-hardware-test-promotion-validator.md", exists: fileExists("docs/41-hardware-test-promotion-validator.md") },
      { label: "Hardware test promotion validator script", path: "scripts/validate-hardware-test-promotion.mjs", exists: fileExists("scripts/validate-hardware-test-promotion.mjs") },
      { label: "Direction evidence extractor", path: "docs/42-direction-evidence-extractor.md", exists: fileExists("docs/42-direction-evidence-extractor.md") },
      { label: "Direction evidence extractor script", path: "scripts/extract-direction-evidence-summary.mjs", exists: fileExists("scripts/extract-direction-evidence-summary.mjs") },
      { label: "Direction evidence summary validator script", path: "scripts/validate-direction-evidence-summary.mjs", exists: fileExists("scripts/validate-direction-evidence-summary.mjs") },
      { label: "Direction evidence manifest apply gate", path: "docs/52-direction-evidence-manifest-apply.md", exists: fileExists("docs/52-direction-evidence-manifest-apply.md") },
      { label: "Direction evidence manifest apply script", path: "scripts/apply-direction-evidence-summary.mjs", exists: fileExists("scripts/apply-direction-evidence-summary.mjs") },
      { label: "Phone runner direction evidence integration", path: "docs/43-phone-runner-direction-evidence.md", exists: fileExists("docs/43-phone-runner-direction-evidence.md") },
      { label: "Android XR projected contract", path: "docs/44-android-xr-projected-contract.md", exists: fileExists("docs/44-android-xr-projected-contract.md") },
      { label: "Android XR projected contract validator script", path: "scripts/validate-android-xr-projected-contract.mjs", exists: fileExists("scripts/validate-android-xr-projected-contract.mjs") },
      { label: "Android XR preflight contract integration", path: "docs/45-android-xr-preflight-contract-integration.md", exists: fileExists("docs/45-android-xr-preflight-contract-integration.md") },
      { label: "Hardware test status dashboard", path: "docs/46-hardware-test-status-dashboard.md", exists: fileExists("docs/46-hardware-test-status-dashboard.md") },
      { label: "Hardware test status dashboard script", path: "scripts/summarize-hardware-test-status.mjs", exists: fileExists("scripts/summarize-hardware-test-status.mjs") },
      { label: "Latest hardware test status dashboard", path: "data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard/hardware-test-status-dashboard.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard/hardware-test-status-dashboard.md") },
      { label: "Hardware dashboard controlled direction session integration", path: "data/runs/20260528_voice_direction_mvp/105-hardware-dashboard-controlled-direction-session.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/105-hardware-dashboard-controlled-direction-session.md") },
      { label: "Device evidence redaction", path: "docs/47-device-evidence-redaction.md", exists: fileExists("docs/47-device-evidence-redaction.md") },
      { label: "Evidence privacy scan", path: "docs/48-evidence-privacy-scan.md", exists: fileExists("docs/48-evidence-privacy-scan.md") },
      { label: "Evidence privacy scanner script", path: "scripts/scan-evidence-privacy.mjs", exists: fileExists("scripts/scan-evidence-privacy.mjs") },
      { label: "Latest evidence privacy scan", path: "data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan/evidence-privacy-scan.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan/evidence-privacy-scan.md") },
      { label: "Operator pack privacy scan integration", path: "docs/49-operator-pack-privacy-scan-integration.md", exists: fileExists("docs/49-operator-pack-privacy-scan-integration.md") },
      { label: "Latest operator pack privacy scan", path: "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/evidence-privacy-scan/evidence-privacy-scan.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/evidence-privacy-scan/evidence-privacy-scan.md") },
      { label: "Direction validation ADB recorder", path: "docs/50-direction-validation-adb-recorder.md", exists: fileExists("docs/50-direction-validation-adb-recorder.md") },
      { label: "Direction validation ADB recorder script", path: "scripts/record-direction-validation-trial.sh", exists: fileExists("scripts/record-direction-validation-trial.sh") },
      { label: "Direction validation ADB receiver", path: "apps/voice-direction-glass/app/src/debug/kotlin/com/voicedirection/glass/qa/DirectionValidationTrialReceiver.kt", exists: fileExists("apps/voice-direction-glass/app/src/debug/kotlin/com/voicedirection/glass/qa/DirectionValidationTrialReceiver.kt") },
      { label: "Direction validation target progress UI", path: "data/runs/20260528_voice_direction_mvp/106-direction-validation-target-progress-ui.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/106-direction-validation-target-progress-ui.md") },
      { label: "Direction target progress evidence snapshot", path: "data/runs/20260528_voice_direction_mvp/107-direction-target-progress-evidence-snapshot.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/107-direction-target-progress-evidence-snapshot.md") },
      { label: "Direction evidence summary target progress", path: "data/runs/20260528_voice_direction_mvp/108-direction-evidence-summary-target-progress.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/108-direction-evidence-summary-target-progress.md") },
      { label: "Direction evidence manifest apply stage", path: "data/runs/20260528_voice_direction_mvp/109-direction-evidence-manifest-apply.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/109-direction-evidence-manifest-apply.md") },
      { label: "Phone runner direction apply dry-run stage", path: "data/runs/20260528_voice_direction_mvp/110-phone-runner-direction-apply-dry-run.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/110-phone-runner-direction-apply-dry-run.md") },
      { label: "Hardware next actions", path: "docs/53-hardware-next-actions.md", exists: fileExists("docs/53-hardware-next-actions.md") },
      { label: "Hardware next actions script", path: "scripts/recommend-hardware-next-actions.mjs", exists: fileExists("scripts/recommend-hardware-next-actions.mjs") },
      { label: "Latest hardware next actions report", path: "data/runs/20260528_voice_direction_mvp/111-hardware-next-actions/hardware-next-actions.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/111-hardware-next-actions/hardware-next-actions.md") },
      { label: "Hardware next actions stage", path: "data/runs/20260528_voice_direction_mvp/111-hardware-next-actions.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/111-hardware-next-actions.md") },
      { label: "Hardware next action executor", path: "docs/54-hardware-next-action-executor.md", exists: fileExists("docs/54-hardware-next-action-executor.md") },
      { label: "Hardware next action executor script", path: "scripts/run-hardware-next-action.mjs", exists: fileExists("scripts/run-hardware-next-action.mjs") },
      { label: "Latest hardware next action execution report", path: "data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor/hardware-next-action-execution.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor/hardware-next-action-execution.md") },
      { label: "Hardware next action executor stage", path: "data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor.md") },
      { label: "Phone lane collection readiness", path: "docs/55-phone-lane-collection-readiness.md", exists: fileExists("docs/55-phone-lane-collection-readiness.md") },
      { label: "Phone lane collection readiness stage", path: "data/runs/20260528_voice_direction_mvp/113-phone-lane-collection-readiness.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/113-phone-lane-collection-readiness.md") },
      { label: "Phone lane hardware runner", path: "docs/56-phone-lane-hardware-runner.md", exists: fileExists("docs/56-phone-lane-hardware-runner.md") },
      { label: "Phone lane hardware runner script", path: "scripts/run-phone-lane-hardware.mjs", exists: fileExists("scripts/run-phone-lane-hardware.mjs") },
      { label: "Latest phone lane hardware runner report", path: "data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner/phone-lane-hardware-runner.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner/phone-lane-hardware-runner.md") },
      { label: "Phone lane hardware runner stage", path: "data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner.md") },
      { label: "Phone lane post-run review", path: "docs/57-phone-lane-post-run-review.md", exists: fileExists("docs/57-phone-lane-post-run-review.md") },
      { label: "Phone lane post-run review script", path: "scripts/review-phone-lane-evidence.mjs", exists: fileExists("scripts/review-phone-lane-evidence.mjs") },
      { label: "Latest phone lane post-run review report", path: "data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review/phone-lane-post-run-review.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review/phone-lane-post-run-review.md") },
      { label: "Phone lane post-run review stage", path: "data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review.md") },
      { label: "Phone lane ready watcher", path: "docs/58-phone-lane-ready-watcher.md", exists: fileExists("docs/58-phone-lane-ready-watcher.md") },
      { label: "Phone lane ready watcher script", path: "scripts/run-phone-lane-when-ready.mjs", exists: fileExists("scripts/run-phone-lane-when-ready.mjs") },
      { label: "Latest phone lane ready watcher report", path: "data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher/phone-lane-ready-watcher.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher/phone-lane-ready-watcher.md") },
      { label: "Phone lane ready watcher stage", path: "data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher.md") },
      { label: "Glasses lane post-run review", path: "docs/59-glasses-lane-post-run-review.md", exists: fileExists("docs/59-glasses-lane-post-run-review.md") },
      { label: "Glasses lane post-run review script", path: "scripts/review-glasses-lane-evidence.mjs", exists: fileExists("scripts/review-glasses-lane-evidence.mjs") },
      { label: "Latest glasses lane post-run review report", path: "data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review/glasses-lane-post-run-review.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review/glasses-lane-post-run-review.md") },
      { label: "Glasses lane post-run review stage", path: "data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review.md") },
      { label: "Controlled direction trial session", path: "docs/51-controlled-direction-trial-session.md", exists: fileExists("docs/51-controlled-direction-trial-session.md") },
      { label: "Controlled direction trial session generator", path: "scripts/create-controlled-direction-trial-session.mjs", exists: fileExists("scripts/create-controlled-direction-trial-session.mjs") },
      { label: "Controlled direction trial session validator", path: "scripts/validate-controlled-direction-trial-session.mjs", exists: fileExists("scripts/validate-controlled-direction-trial-session.mjs") },
      { label: "Latest controlled direction trial session", path: "data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/README.md", exists: fileExists("data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/README.md") },
      { label: "Latest glasses preflight evidence", path: preflightPath, exists: fileExists(preflightPath) },
    ],
    deviceEvidence: {
      path: latestDeviceEvidence,
      validation: runDeviceEvidenceValidator(latestDeviceEvidence),
    },
    glassesPreflight: extractPreflightStatus(preflightPath),
  };
}

const audit = createAudit();

if (wantsJson) {
  console.log(JSON.stringify(audit, null, 2));
}

if (wantsWrite) {
  let reportDir = reportDirArg || `data/runs/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_service_readiness_audit`;
  if (!path.isAbsolute(reportDir)) {
    reportDir = path.join(ROOT_DIR, reportDir);
  }
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, "service-readiness-audit.md");
  fs.writeFileSync(reportPath, renderMarkdown(audit));
  console.log(`Service readiness audit written: ${reportPath}`);
}

if (!wantsJson && !wantsWrite) {
  process.stdout.write(renderMarkdown(audit));
}
