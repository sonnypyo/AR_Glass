#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_RUN_PREFIX = "voice_direction_physical_session";

const args = process.argv.slice(2);
const showHelp = args.includes("--help") || args.includes("-h");
const wantsJson = args.includes("--json");
const force = args.includes("--force");
const runDirArg = valueAfter("--run-dir");
const tester = valueAfter("--tester") || "local tester";
const phoneLabel = valueAfter("--phone") || "physical Android phone";
const glassesLabel = valueAfter("--glasses") || "Meta Ray-Ban Display / Ray-Ban Meta Gen 1 / Android XR";

function usage() {
  return [
    "Usage: scripts/create-physical-test-session.mjs [--run-dir DIR] [--tester NAME] [--phone LABEL] [--glasses LABEL] [--force] [--json]",
    "",
    "Creates a non-PII physical-device evidence session folder with run commands and manual checklists.",
    "It does not run adb, connect to devices, or create any app data.",
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

function kstParts() {
  return new Intl.DateTimeFormat("en-CA", {
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
}

function kstTimestamp() {
  const parts = kstParts();
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+09:00`;
}

function defaultRunDir() {
  const parts = kstParts();
  return `data/runs/${parts.year}${parts.month}${parts.day}_${parts.hour}${parts.minute}${parts.second}_${DEFAULT_RUN_PREFIX}`;
}

function ensureInsideWorkspace(absolutePath) {
  const relative = path.relative(ROOT_DIR, absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside workspace: ${absolutePath}`);
  }
}

function writeFile(relativeOrAbsolutePath, content, mode) {
  const absolutePath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(ROOT_DIR, relativeOrAbsolutePath);
  ensureInsideWorkspace(absolutePath);
  if (!force && fs.existsSync(absolutePath)) {
    throw new Error(`Refusing to overwrite without --force: ${path.relative(ROOT_DIR, absolutePath)}`);
  }
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
  if (mode) fs.chmodSync(absolutePath, mode);
  return path.relative(ROOT_DIR, absolutePath);
}

function fencedCommand(command) {
  return ["```bash", command.trim(), "```"].join("\n");
}

const generatedAt = kstTimestamp();
const runDirRelative = runDirArg || defaultRunDir();
const runDir = path.isAbsolute(runDirRelative) ? runDirRelative : path.join(ROOT_DIR, runDirRelative);
ensureInsideWorkspace(runDir);
const runDirProjectRelative = path.relative(ROOT_DIR, runDir);

const sessionSummary = `# Physical Test Session Summary

Generated: ${generatedAt}

## Session

- Tester: ${tester}
- Phone target: ${phoneLabel}
- Glasses target: ${glassesLabel}
- App: Voice Direction Glass
- APK path: apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk

## Objective

Collect the first non-PII physical-device evidence needed to move the project from internal prototype toward phone private alpha and later glasses private alpha.

## Required Order

1. Read \`privacy-redaction-rules.md\`.
2. Run \`commands.sh\` from this session folder or copy the commands manually.
3. Complete \`phone-manual-checklist.md\` while the app is installed on a real phone.
4. Complete \`meta-rayban-checklist.md\` only when Meta DAT credentials and Ray-Ban hardware are available.
5. Complete \`android-xr-checklist.md\` only when Android XR runtime or hardware is available.
6. Generate or review \`controlled-direction-trial-session\` before a 20-per-direction front/back/left/right pass.
7. Complete \`direction-accuracy-checklist.md\` before any front/back or four-direction claim.
8. Run \`scripts/audit-service-readiness.mjs --write-report --report-dir ${runDirProjectRelative}/service-readiness-audit\`.
9. Run \`scripts/validate-physical-test-session.mjs ${runDirProjectRelative} --json\`.

## Expected Evidence Files

- \`${runDirProjectRelative}/android-phone-smoke/device-evidence.md\`
- \`${runDirProjectRelative}/glasses-preflight/glasses-preflight.md\`
- \`${runDirProjectRelative}/controlled-direction-trial-session/README.md\`
- \`${runDirProjectRelative}/service-readiness-audit/service-readiness-audit.md\`
- Filled manual checklist files in this folder.

## Current Known Gaps

- No physical \`device-evidence.md\` exists yet in this workspace.
- Meta DAT credentials and package access are not configured.
- Android XR projected runtime proof is not recorded.
- Production speaker verification and direction accuracy are not proven.
`;

const commandsScript = `#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR}"
SESSION_DIR="$ROOT_DIR/${runDirProjectRelative}"

export JAVA_HOME="\${JAVA_HOME:-/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home}"
export ANDROID_HOME="\${ANDROID_HOME:-/Users/sonjunpyo/Library/Android/sdk}"

cd "$ROOT_DIR"

echo "1/8 Build and test debug APK"
(
  cd apps/voice-direction-glass
  ./gradlew --no-daemon test assembleDebug
)

echo "2/8 Collect Android phone smoke evidence"
scripts/android-device-smoke-test.sh --skip-build --write-evidence --evidence-dir "$SESSION_DIR/android-phone-smoke"

echo "3/8 Collect glasses integration preflight evidence"
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir "$SESSION_DIR/glasses-preflight"

echo "4/8 Validate generated phone evidence"
node scripts/validate-device-evidence.mjs "$SESSION_DIR/android-phone-smoke/device-evidence.md" --json

echo "5/8 Validate direction accuracy evidence gate"
node scripts/validate-direction-accuracy-evidence.mjs --json
if node scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json; then
  echo "Strict production direction validation passed."
else
  echo "Strict production direction validation remains blocked until controlled phone/glasses evidence exists."
fi

echo "6/8 Generate and validate controlled direction trial session"
scripts/create-controlled-direction-trial-session.mjs --run-dir "$SESSION_DIR/controlled-direction-trial-session" --force --json
scripts/validate-controlled-direction-trial-session.mjs "$SESSION_DIR/controlled-direction-trial-session" --json

echo "7/8 Generate service readiness audit"
scripts/audit-service-readiness.mjs --write-report --report-dir "$SESSION_DIR/service-readiness-audit"

echo "8/8 Validate physical test session folder"
scripts/validate-physical-test-session.mjs "$SESSION_DIR" --json

echo "Physical test session evidence is under: $SESSION_DIR"
`;

const phoneChecklist = `# Phone Manual Checklist

Generated: ${generatedAt}

Use this after \`commands.sh\` creates \`android-phone-smoke/device-evidence.md\`. Record pass/fail/status only. Do not paste transcripts, speaker names, raw audio, PCM, embeddings, encrypted values, Bluetooth owner names, or private alert text.

## Setup

- [ ] ADB phone is visible.
- [ ] Debug APK installs.
- [ ] Microphone disclosure blocks microphone permission/audio flow until checked.
- [ ] Microphone permission granted.
- [ ] Notification permission granted where required.
- [ ] Bluetooth permission granted where required.
- [ ] \`android-phone-smoke/device-evidence.md\` exists.
- [ ] \`validate-device-evidence.mjs\` passes for the generated report.

## Core Runtime

- [ ] \`마이크 사용 안내\` accepted before any microphone action.
- [ ] \`세션 시작\` starts foreground service.
- [ ] Persistent foreground notification appears.
- [ ] Notification stop action stops service.
- [ ] One-shot speech recognition creates a detection result without storing transcript in evidence.
- [ ] Processing latency appears in latest event/evidence snapshot.
- [ ] Service diagnostic card updates after a foreground-service bridge run.

## Speaker And Consent

- [ ] New speaker profile cannot be created until explicit consent checkbox is selected.
- [ ] Enrollment sample quality capture accepts only usable samples.
- [ ] Same-speaker prototype match diagnostic recorded as bucket/status only.
- [ ] Different-speaker prototype match diagnostic recorded as bucket/status only.

## Direction And Alerts

- [ ] Microphone channel probe records mono/stereo support only.
- [ ] Direction sample records direction enum, confidence bucket, and evidence label only.
- [ ] Debug glasses cue seed broadcast is script-pass and latest evidence snapshot shows \`latestCuePresent=true\`.
- [ ] Debug direction sample broadcast is script-pass and records status/evidence/microphone metadata counts only.
- [ ] Optional ADB direction validation trial recorder tested with \`scripts/record-direction-validation-trial.sh\` during controlled positioning.
- [ ] Debug Bluetooth route evidence broadcast is script-pass and records route support/count/type metadata only.
- [ ] Debug local delete self-check broadcast is script-pass and records post-delete counts only.
- [ ] Left trial recorded.
- [ ] Right trial recorded.
- [ ] Front trial recorded as unproven/unknown unless strong hardware evidence exists.
- [ ] Back trial recorded as unproven/unknown unless strong hardware evidence exists.
- [ ] \`direction-accuracy-checklist.md\` is filled with aggregate counts only.
- [ ] Strict direction accuracy validation remains blocked unless controlled evidence has been added deliberately.
- [ ] Phone notification observed.
- [ ] Phone vibration pattern observed.
- [ ] TTS direction-only cue heard or documented as unavailable.
- [ ] Alert channel preferences filter outputs.
- [ ] \`알림 출력 점검\` creates a test delivery snapshot without detection event.
- [ ] Latest evidence snapshot shows \`latestCuePresent=true\` after scripted glasses cue seed.
- [ ] Latest evidence snapshot shows \`latestDeliverySource=TEST_CUE\` after scripted test cue.
- [ ] Bluetooth route evidence contains no product names, owner names, or MAC addresses.
- [ ] Latest evidence snapshot includes direction sample microphone metadata counts after scripted direction sample.

## False Positive And Storage

- [ ] Accurate feedback persists.
- [ ] False-positive feedback persists.
- [ ] Wrong-speaker feedback persists.
- [ ] Wrong-direction feedback persists.
- [ ] 30-minute false-positive test session started, ended, and summarized.
- [ ] Real app data survives force-stop/reopen.
- [ ] Local delete button tested.
- [ ] Debug local delete self-check uses only the separate debug store and does not delete tester app data.

## Outcome

- Phone private alpha candidate: yes / no
- Blocking issue ids:
- Next run needed:
`;

const metaChecklist = `# Meta Ray-Ban Checklist

Generated: ${generatedAt}

Do not mark any row pass without physical Ray-Ban evidence or documented official-SDK limitation. Keep credentials outside source control.

## Preflight

- [ ] Meta Developer account access confirmed.
- [ ] Meta AI app Developer Mode confirmed.
- [ ] Meta Wearables application id configured outside source control.
- [ ] GitHub Packages token for Meta DAT configured outside source control.
- [ ] \`glasses-preflight/glasses-preflight.md\` has no Meta DAT blocked rows.

## Ray-Ban Display

- [ ] Real DAT adapter replaces \`MetaDatDisplayStubAdapter\`.
- [ ] SDK registration/session lifecycle observed.
- [ ] Latest actionable cue renders on Ray-Ban Display.
- [ ] Cue direction is visible without private speaker names in evidence.
- [ ] Failure/offline state is documented.

## Ray-Ban Meta Gen 1 Fallback

- [ ] Display unavailable behavior documented.
- [ ] Bluetooth microphone route probe run.
- [ ] Bluetooth route select/clear run when a candidate appears.
- [ ] TTS direction cue tested over available phone/Bluetooth route.
- [ ] Phone vibration fallback tested.

## Unknowns To Resolve

- [ ] Official API exposes useful microphone/channel metadata: yes / no / not available.
- [ ] Glasses-side haptics API available: yes / no / not available.
- [ ] Per-side haptics possible: yes / no / not available.
- [ ] Wearable direction-of-arrival evidence collected: yes / no.
`;

const androidXrChecklist = `# Android XR Checklist

Generated: ${generatedAt}

Use this when Android XR emulator, developer kit, or glasses runtime is available.

## Preflight

- [ ] Android Studio / SDK preview tooling supports the target Android XR runtime.
- [ ] Jetpack XR projected dependencies resolve in this local toolchain.
- [ ] \`glasses-preflight/glasses-preflight.md\` has no Android XR dependency blocked rows.
- [ ] Android XR device/emulator is attached or available.

## Projected Cue

- [ ] \`GlassesProjectedActivity\` launches in projected context.
- [ ] Latest actionable cue is visible on projected display.
- [ ] Cue direction is readable at glasses distance.
- [ ] Empty/no-cue state is readable.
- [ ] Offline/failure state is documented.

## Audio And Fallback

- [ ] Projected-context microphone access tested.
- [ ] Available microphone channel count recorded as enum/count only.
- [ ] Bluetooth HFP/BLE fallback route probe run.
- [ ] Bluetooth route select/clear run when a candidate appears.
- [ ] TTS direction cue tested.

## Adapter Replacement

- [ ] \`AndroidXrDisplayStubAdapter\` replacement plan written.
- [ ] Real adapter emits display cue.
- [ ] Real adapter reports delivery status without private text.
- [ ] Readiness audit rerun after adapter proof.
`;

const directionAccuracyChecklist = `# Direction Accuracy Checklist

Generated: ${generatedAt}

Use this checklist before changing \`front-back-direction-evidence\` or making any front/back or four-direction claim. Record only aggregate counts, statuses, booleans, enum values, confidence buckets, latency buckets, and route/device-class notes. Do not paste raw audio, PCM, transcripts, speaker names, raw embeddings, private alert text, or Bluetooth owner names.

## Validation Commands

- [ ] \`node scripts/validate-direction-accuracy-evidence.mjs --json\` passes.
- [ ] \`node scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json\` is blocked until controlled evidence exists, or passes only after the manifest has been deliberately updated with real aggregate evidence.

## Phone Baseline

- [ ] Physical Android phone model recorded as device class only.
- [ ] App posture recorded: handheld / table / pocket-adjacent / glasses-worn companion.
- [ ] Microphone inventory captured from Android microphone APIs.
- [ ] Active microphone metadata captured during sampling.
- [ ] Channel mapping captured when available.
- [ ] Hardware pose or mounting orientation documented.

## Controlled Direction Trials

- [ ] Clear old debug trial rows before a controlled run: \`scripts/record-direction-validation-trial.sh --clear\`.
- [ ] Optional ADB entry path tested without private labels: \`scripts/record-direction-validation-trial.sh --expected LEFT --observed UNKNOWN --source controlled-phone\`.
- [ ] Front trials count >= 20 before any front claim.
- [ ] Back trials count >= 20 before any back claim.
- [ ] Left trials count >= 20 before any left claim.
- [ ] Right trials count >= 20 before any right claim.
- [ ] UNKNOWN outcomes preserved as UNKNOWN.
- [ ] Confident wrong-direction outcomes counted separately.
- [ ] Confidence buckets recorded.
- [ ] p95 direction latency bucket recorded.

## Wearable Routes

- [ ] Ray-Ban Meta Gen 1 Bluetooth HFP route tested as single-microphone fallback only.
- [ ] Meta Ray-Ban Display DAT route tested only after real adapter exists.
- [ ] Android XR projected-context microphone route tested only after projected runtime proof exists.
- [ ] At least one claimed wearable route has controlled evidence before wearable direction copy is used.

## Outcome

- Strict direction validation status: blocked / passed
- Claimed routes:
- Claimed directions:
- Blocking issue ids:
- Next run needed:
`;

const privacyRules = `# Privacy Redaction Rules

Generated: ${generatedAt}

These rules apply to every file in this physical test session folder.

## Never Paste

- Raw audio files or PCM samples.
- Speech transcripts from real people.
- Speaker names, caller names, profile labels, or contact names.
- Voice embedding values or model vectors.
- Encrypted payload values such as \`enc:v1:\`.
- Bluetooth owner/device names if they reveal a person.
- Private alert message text.
- Home/work location details.

## Allowed Evidence

- Pass/fail/manual/blocking status.
- Counts.
- Enum values such as \`LEFT\`, \`RIGHT\`, \`UNKNOWN\`, \`TEST_CUE\`.
- Confidence buckets.
- Latency buckets or milliseconds.
- Checklist ids.
- Non-private device model/OS version.
- Screenshots only after checking they do not show private names or transcripts.

## If Private Data Appears

1. Stop copying that output.
2. Replace the private value with \`[redacted]\`.
3. Keep the surrounding count/status if it is useful.
4. Note which command produced private output so the script can be fixed.
`;

const files = [
  ["README.md", sessionSummary],
  ["commands.sh", commandsScript, 0o755],
  ["phone-manual-checklist.md", phoneChecklist],
  ["meta-rayban-checklist.md", metaChecklist],
  ["android-xr-checklist.md", androidXrChecklist],
  ["direction-accuracy-checklist.md", directionAccuracyChecklist],
  ["privacy-redaction-rules.md", privacyRules],
];

const created = [];
for (const [name, content, mode] of files) {
  created.push(writeFile(path.join(runDir, name), content, mode));
}

const result = {
  runDir: runDirProjectRelative,
  generatedAt,
  created,
  nextCommands: [
    `${runDirProjectRelative}/commands.sh`,
    `scripts/validate-physical-test-session.mjs ${runDirProjectRelative} --json`,
    `node scripts/audit-service-readiness.mjs --write-report --report-dir ${runDirProjectRelative}/service-readiness-audit`,
  ],
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Physical test session created: ${runDirProjectRelative}`);
  for (const file of created) {
    console.log(` - ${file}`);
  }
}
