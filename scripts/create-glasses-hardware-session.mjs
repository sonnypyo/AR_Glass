#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_RUN_PREFIX = "voice_direction_glasses_hardware_session";

const args = process.argv.slice(2);
const showHelp = args.includes("--help") || args.includes("-h");
const wantsJson = args.includes("--json");
const force = args.includes("--force");
const runDirArg = valueAfter("--run-dir");
const tester = valueAfter("--tester") || "glasses hardware tester";
const target = valueAfter("--target") || "Meta Ray-Ban Display / Ray-Ban Meta Gen 1 / Android XR";

function usage() {
  return [
    "Usage: scripts/create-glasses-hardware-session.mjs [--run-dir DIR] [--tester NAME] [--target LABEL] [--force] [--json]",
    "",
    "Creates a non-PII glasses hardware evidence session folder for Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, and haptics/fallback proof.",
    "It does not update the canonical glasses-evidence manifest; copy reviewed aggregate results deliberately after the hardware session.",
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

const generatedAt = kstTimestamp();
const runDirRelative = runDirArg || defaultRunDir();
const runDir = path.isAbsolute(runDirRelative) ? runDirRelative : path.join(ROOT_DIR, runDirRelative);
ensureInsideWorkspace(runDir);
const runDirProjectRelative = path.relative(ROOT_DIR, runDir);

const readme = `# Glasses Hardware Session Summary

Generated: ${generatedAt}

## Session

- Tester: ${tester}
- Target: ${target}
- App: Voice Direction Glass
- Canonical manifest: apps/voice-direction-glass/glasses-evidence/manifest.json
- Hardware gate doc: docs/25-glasses-hardware-evidence.md

## Objective

Collect non-PII hardware evidence for Meta Ray-Ban Display cue rendering, Ray-Ban Meta Gen 1 Bluetooth fallback, Android XR projected runtime, and haptics/fallback status.

## Required Order

1. Read \`privacy-redaction-rules.md\`.
2. Run \`commands.sh\` before hardware proof to confirm the draft gates.
3. Complete \`meta-rayban-display-evidence.md\` only when DAT credentials, package access, and Ray-Ban Display hardware are available.
4. Complete \`rayban-gen1-fallback-evidence.md\` when Ray-Ban Meta Gen 1 is paired for Bluetooth route/TTS/vibration fallback checks.
5. Complete \`android-xr-projected-evidence.md\` only when Android XR projected runtime or hardware is available.
6. Complete \`haptics-fallback-evidence.md\` with either real official haptics proof or the documented phone-vibration fallback result.
7. Fill \`manifest-update-template.json\` with aggregate pass/fail/boolean/enum values only.
8. Review all files for private data.
9. Deliberately copy approved aggregate values into \`apps/voice-direction-glass/glasses-evidence/manifest.json\`.
10. Run \`node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json\` only after real evidence paths and pass fields exist.
11. Regenerate service readiness audit.

## Expected Evidence Files

- \`${runDirProjectRelative}/meta-rayban-display-evidence.md\`
- \`${runDirProjectRelative}/rayban-gen1-fallback-evidence.md\`
- \`${runDirProjectRelative}/android-xr-projected-evidence.md\`
- \`${runDirProjectRelative}/haptics-fallback-evidence.md\`
- \`${runDirProjectRelative}/manifest-update-template.json\`
- \`${runDirProjectRelative}/service-readiness-audit/service-readiness-audit.md\`

## Current Known Gaps

- This folder is a template until hardware rows are filled.
- The canonical manifest remains draft until reviewed aggregate values are copied deliberately.
- Strict glasses hardware validation is expected to fail before real Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, and haptics/fallback evidence exists.
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

echo "2/8 Validate glasses setup draft gate"
node scripts/validate-glasses-setup-readiness.mjs --json

echo "3/8 Validate glasses hardware draft gate"
node scripts/validate-glasses-hardware-evidence.mjs --json

echo "4/8 Confirm strict glasses hardware gate is blocked until evidence exists"
if node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json; then
  echo "Strict glasses hardware validation passed. Confirm this was intentional and evidence-backed."
else
  echo "Strict glasses hardware validation remains blocked until real Ray-Ban Display, Ray-Ban Gen 1 fallback, and Android XR evidence exists."
fi

echo "5/8 Collect glasses integration preflight evidence"
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir "$SESSION_DIR/glasses-preflight"

echo "6/8 Validate this glasses hardware session folder"
node scripts/validate-glasses-hardware-session.mjs "$SESSION_DIR" --json

echo "7/8 Generate service readiness audit"
node scripts/audit-service-readiness.mjs --write-report --report-dir "$SESSION_DIR/service-readiness-audit"

echo "8/8 Re-validate this glasses hardware session folder"
node scripts/validate-glasses-hardware-session.mjs "$SESSION_DIR" --json

echo "Glasses hardware session evidence is under: $SESSION_DIR"
`;

const metaRaybanDisplayEvidence = `# Meta Ray-Ban Display Evidence

Generated: ${generatedAt}

Record only status, booleans, command names, lifecycle event labels, adapter status, and workspace-relative file paths. Do not include private speaker names, speech text, raw audio, PCM, embeddings, encrypted values, Bluetooth owner labels, exact locations, or private alert text.

## Setup

- [ ] Meta Developer account access confirmed.
- [ ] Meta AI app Developer Mode confirmed.
- [ ] Meta Wearables application id configured outside source control.
- [ ] GitHub Packages token configured outside source control.
- [ ] DAT package access verified.
- [ ] Ray-Ban Display paired.
- [ ] \`scripts/glasses-integration-preflight.sh --write-evidence\` has no relevant blocked DAT rows.

## Adapter Proof

- [ ] Real DAT adapter replaces \`MetaDatDisplayStubAdapter\`.
- [ ] App registers with the DAT SDK.
- [ ] Session lifecycle observed.
- [ ] Failure/offline state documented.
- [ ] No external submission performed during this session.

## Display Cue Proof

- [ ] Latest actionable cue is created by the app.
- [ ] Cue renders on Ray-Ban Display.
- [ ] Direction is visible.
- [ ] Speaker label privacy reviewed.
- [ ] Evidence does not include speaker names or transcripts.
- [ ] Evidence screenshot/video, if any, uses non-private placeholder data.

## Evidence Summary

- status: not_collected
- evidencePath: ${runDirProjectRelative}/meta-rayban-display-evidence.md
- adapterStatus: stub / real_adapter
- datCredentialsConfigured: false
- datPackageAccessVerified: false
- sessionLifecycleObserved: false
- cueRenderedOnDisplay: false
- directionVisible: false
- displayLabelPrivacyReviewed: false
- failureStateDocumented: false
- validatorCommand: node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json

## Outcome

- Display proof result: blocked / passed / failed / documented_unavailable
- Blocking issue ids:
- Next run needed:
`;

const raybanGen1Evidence = `# Ray-Ban Gen 1 Fallback Evidence

Generated: ${generatedAt}

Record only status, booleans, enum values, route counts, route type counts, command names, and workspace-relative file paths. Do not include Bluetooth owner/device names, MAC addresses, private speaker labels, transcripts, raw audio, PCM, embeddings, encrypted values, exact locations, or private alert text.

## Setup

- [ ] Ray-Ban Meta Gen 1 paired.
- [ ] Android \`BLUETOOTH_CONNECT\` permission granted where required.
- [ ] Debug Bluetooth route evidence broadcast available in debug APK.
- [ ] Phone notification/vibration/TTS channels are configured.

## Route Proof

- [ ] Bluetooth communication-device route probe run.
- [ ] Bluetooth input candidate visibility recorded as boolean.
- [ ] Route candidate counts recorded without product names.
- [ ] Route select/clear tested when candidate appears.
- [ ] Private route names redacted.

## Fallback Output Proof

- [ ] Display unavailable behavior documented.
- [ ] TTS direction cue heard, or documented unavailable.
- [ ] Phone vibration fallback observed, or documented unavailable.
- [ ] Evidence confirms no glasses display claim is made for Gen 1.

## Evidence Summary

- status: not_collected
- evidencePath: ${runDirProjectRelative}/rayban-gen1-fallback-evidence.md
- routeProbeRun: false
- bluetoothInputCandidateVisible:
- routeSelectClearTested: false
- ttsDirectionCueHeard: false
- phoneVibrationFallbackObserved: false
- displayUnavailableDocumented: false
- privateRouteNamesRedacted: false
- validatorCommand: node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json

## Outcome

- Gen 1 fallback result: blocked / passed / failed / documented_unavailable
- Blocking issue ids:
- Next run needed:
`;

const androidXrEvidence = `# Android XR Projected Evidence

Generated: ${generatedAt}

Record only status, booleans, command names, dependency status, runtime type, cue visibility, fallback status, and workspace-relative file paths. Do not include private speaker labels, transcripts, raw audio, PCM, embeddings, encrypted values, Bluetooth owner labels, exact locations, or private alert text.

## Setup

- [ ] Android XR-compatible device, emulator, or dev kit available.
- [ ] Android Studio / SDK setup supports the current Android XR projected flow.
- [ ] Jetpack Projected dependencies resolve in the local toolchain.
- [ ] \`GlassesProjectedActivity\` remains declared for projected display.

## Projected Runtime Proof

- [ ] Android XR runtime available.
- [ ] Projected activity launched.
- [ ] Projected context used.
- [ ] Latest actionable cue visible on projected display.
- [ ] Empty/no-cue state visible.
- [ ] Failure/offline state documented.

## Audio And Fallback Proof

- [ ] Projected-context microphone access tested, or documented unavailable.
- [ ] Bluetooth fallback tested when projected microphone access is unavailable.
- [ ] TTS direction cue tested.
- [ ] No front/back or wearable direction claim added without strict direction evidence.

## Evidence Summary

- status: not_collected
- evidencePath: ${runDirProjectRelative}/android-xr-projected-evidence.md
- adapterStatus: stub / real_adapter
- runtimeAvailable: false
- jetpackProjectedDependenciesResolved: false
- projectedActivityLaunched: false
- projectedContextUsed: false
- cueVisibleOnProjectedDisplay: false
- emptyStateVisible: false
- microphoneAccessTested: false
- bluetoothFallbackTested: false
- failureStateDocumented: false
- validatorCommand: node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json

## Outcome

- Android XR projected result: blocked / passed / failed / documented_unavailable
- Blocking issue ids:
- Next run needed:
`;

const hapticsEvidence = `# Haptics And Fallback Evidence

Generated: ${generatedAt}

Record only official API status, booleans, fallback output status, and workspace-relative file paths. Do not include private speaker labels, transcripts, raw audio, PCM, embeddings, encrypted values, Bluetooth owner labels, exact locations, or private alert text.

## Official API Check

- [ ] Official glasses-side haptics API checked for the target SDK/device.
- [ ] Glasses-side haptics verified only if an official API and device session prove it.
- [ ] Per-side haptics verified only if left/right device-side haptics can be triggered and observed separately.
- [ ] If unavailable, document phone vibration fallback as the MVP output.

## Fallback Proof

- [ ] Phone vibration fallback observed.
- [ ] Direction-coded phone vibration pattern metadata recorded.
- [ ] Evidence confirms \`phoneVibrationSideSpecific=false\` unless real per-side glasses haptics exists.
- [ ] Public copy avoids glasses haptics claims while unavailable.

## Evidence Summary

- status: documented_not_available
- evidencePath: ${runDirProjectRelative}/haptics-fallback-evidence.md
- officialApiVerified: false
- glassesSideHapticsVerified: false
- perSideHapticsVerified: false
- phoneVibrationFallbackRemainsMvp: true
- validatorCommand: node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json

## Outcome

- Haptics result: documented_not_available / passed / failed
- Blocking issue ids:
- Next run needed:
`;

const manifestTemplate = {
  schemaVersion: 1,
  packageName: "com.voicedirection.glass",
  status: "DRAFT_GLASSES_HARDWARE_EVIDENCE_NOT_COLLECTED",
  externalSubmission: "not_performed",
  metaRayBanDisplay: {
    status: "not_collected",
    evidencePath: `${runDirProjectRelative}/meta-rayban-display-evidence.md`,
    adapterStatus: "stub",
    datCredentialsConfigured: false,
    datPackageAccessVerified: false,
    sessionLifecycleObserved: false,
    cueRenderedOnDisplay: false,
    directionVisible: false,
    displayLabelPrivacyReviewed: false,
    failureStateDocumented: false,
  },
  rayBanGen1BluetoothFallback: {
    status: "not_collected",
    evidencePath: `${runDirProjectRelative}/rayban-gen1-fallback-evidence.md`,
    routeProbeRun: false,
    bluetoothInputCandidateVisible: null,
    routeSelectClearTested: false,
    ttsDirectionCueHeard: false,
    phoneVibrationFallbackObserved: false,
    displayUnavailableDocumented: false,
    privateRouteNamesRedacted: false,
  },
  androidXrProjected: {
    status: "not_collected",
    evidencePath: `${runDirProjectRelative}/android-xr-projected-evidence.md`,
    adapterStatus: "stub",
    runtimeAvailable: false,
    jetpackProjectedDependenciesResolved: false,
    projectedActivityLaunched: false,
    projectedContextUsed: false,
    cueVisibleOnProjectedDisplay: false,
    emptyStateVisible: false,
    microphoneAccessTested: false,
    bluetoothFallbackTested: false,
    failureStateDocumented: false,
  },
  haptics: {
    status: "documented_not_available",
    evidencePath: `${runDirProjectRelative}/haptics-fallback-evidence.md`,
    officialApiVerified: false,
    glassesSideHapticsVerified: false,
    perSideHapticsVerified: false,
    phoneVibrationFallbackRemainsMvp: true,
  },
  privacy: {
    rawAudioSaved: false,
    pcmSaved: false,
    transcriptsIncluded: false,
    speakerNamesIncluded: false,
    contactNamesIncluded: false,
    voiceEmbeddingsIncluded: false,
    encryptedPayloadsIncluded: false,
    bluetoothOwnerNamesIncluded: false,
    bluetoothProductNamesIncluded: false,
    macAddressesIncluded: false,
    privateAlertTextIncluded: false,
    privateLocationsIncluded: false,
  },
  serviceReadinessAuditRegenerated: false,
};

const privacyRules = `# Glasses Hardware Privacy Redaction Rules

Generated: ${generatedAt}

These rules apply to every file in this glasses hardware session folder.

## Never Paste

- Audio recordings or PCM samples.
- Speech transcripts from real people.
- Speaker names, caller names, profile labels, or contact names.
- Voice embedding values or model vectors.
- Encrypted payload values such as \`enc:v1:\`.
- Bluetooth owner/device names or product names if they reveal a person.
- MAC addresses or serial numbers that identify a private device.
- Private alert message text.
- Home/work location details.

## Allowed Evidence

- Pass/fail/manual/blocking status.
- Counts.
- Booleans.
- Enum values such as \`not_collected\`, \`passed\`, \`failed\`, \`documented_unavailable\`, \`stub\`, or \`real_adapter\`.
- Lifecycle event labels that contain no private data.
- Confidence buckets.
- Checklist ids.
- Command names.
- Workspace-relative evidence file paths.
- Screenshots only after confirming they show non-private placeholder labels.

## If Private Data Appears

1. Stop copying that output.
2. Replace the private value with \`[redacted]\`.
3. Keep the surrounding count/status if it is useful.
4. Note which command produced private output so the script or process can be fixed.
`;

const files = [
  ["README.md", readme],
  ["commands.sh", commandsScript, 0o755],
  ["meta-rayban-display-evidence.md", metaRaybanDisplayEvidence],
  ["rayban-gen1-fallback-evidence.md", raybanGen1Evidence],
  ["android-xr-projected-evidence.md", androidXrEvidence],
  ["haptics-fallback-evidence.md", hapticsEvidence],
  ["manifest-update-template.json", `${JSON.stringify(manifestTemplate, null, 2)}\n`],
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
    `scripts/validate-glasses-hardware-session.mjs ${runDirProjectRelative} --json`,
    "node scripts/validate-glasses-hardware-evidence.mjs --json",
    "node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json",
  ],
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Glasses hardware session created: ${runDirProjectRelative}`);
  for (const file of created) {
    console.log(` - ${file}`);
  }
}
