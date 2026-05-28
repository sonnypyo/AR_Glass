#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_RUN_PREFIX = "voice_direction_private_alpha_rehearsal";
const DEFAULT_PHYSICAL_SESSION = "data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack";
const DEFAULT_SUPPORT_SESSION = "data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack";
const DEFAULT_GLASSES_SESSION = "data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack";

const args = process.argv.slice(2);
const showHelp = args.includes("--help") || args.includes("-h");
const wantsJson = args.includes("--json");
const force = args.includes("--force");
const runDirArg = valueAfter("--run-dir");
const tester = valueAfter("--tester") || "private alpha rehearsal tester";
const physicalSession = valueAfter("--physical-session") || DEFAULT_PHYSICAL_SESSION;
const supportSession = valueAfter("--support-session") || DEFAULT_SUPPORT_SESSION;
const glassesSession = valueAfter("--glasses-session") || DEFAULT_GLASSES_SESSION;

function usage() {
  return [
    "Usage: scripts/create-private-alpha-rehearsal.mjs [--run-dir DIR] [--tester NAME] [--physical-session DIR] [--support-session DIR] [--glasses-session DIR] [--force] [--json]",
    "",
    "Creates a top-level non-PII private-alpha rehearsal folder that ties together phone, support, and glasses evidence sessions.",
    "It does not run hardware tests or update canonical evidence manifests.",
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

function workspaceRelative(value) {
  const absolute = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to reference outside workspace: ${absolute}`);
  }
  return relative;
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
const physicalSessionRelative = workspaceRelative(physicalSession);
const supportSessionRelative = workspaceRelative(supportSession);
const glassesSessionRelative = workspaceRelative(glassesSession);

const readme = `# Private Alpha Rehearsal Summary

Generated: ${generatedAt}

## Session

- Tester: ${tester}
- App: Voice Direction Glass
- Physical device session: ${physicalSessionRelative}
- Support drill session: ${supportSessionRelative}
- Glasses hardware session: ${glassesSessionRelative}

## Objective

Run a top-level rehearsal that shows whether the project is ready to move from internal prototype toward phone private alpha and later glasses private alpha.

This pack does not replace the child evidence sessions. It links them, validates their structure, records strict gates that remain blocked, and keeps service-readiness audit output with the rehearsal.

## Required Order

1. Read \`privacy-redaction-rules.md\`.
2. Run \`commands.sh\`.
3. Fill \`private-alpha-rehearsal-checklist.md\` with aggregate status only.
4. Run the physical phone session when an Android phone is attached.
5. Run the glasses hardware session when Ray-Ban or Android XR hardware is available.
6. Run the support drill session before any external or production support claim.
7. Regenerate service readiness audit after every evidence change.

## Linked Evidence Sessions

- Phone and direction evidence: \`${physicalSessionRelative}\`
- Support deletion/mistaken-alert drill evidence: \`${supportSessionRelative}\`
- Ray-Ban/Android XR hardware evidence: \`${glassesSessionRelative}\`

## Current Expected Result

- Internal prototype can remain ready.
- Phone private alpha remains not ready until physical phone evidence and manual rows exist.
- Glasses private alpha remains blocked until phone evidence, Meta DAT credentials, Ray-Ban Display proof, Ray-Ban Gen 1 fallback proof, Android XR projected proof, and strict glasses hardware validation exist.
- External beta and production remain blocked until support drills, policy/legal/store review, release signing, screenshots, production speaker model, and direction accuracy gates close.
`;

const commandsScript = `#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR}"
SESSION_DIR="$ROOT_DIR/${runDirProjectRelative}"
PHYSICAL_SESSION="$ROOT_DIR/${physicalSessionRelative}"
SUPPORT_SESSION="$ROOT_DIR/${supportSessionRelative}"
GLASSES_SESSION="$ROOT_DIR/${glassesSessionRelative}"

export JAVA_HOME="\${JAVA_HOME:-/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home}"
export ANDROID_HOME="\${ANDROID_HOME:-/Users/sonjunpyo/Library/Android/sdk}"

cd "$ROOT_DIR"

echo "1/14 Build and test debug APK"
(
  cd apps/voice-direction-glass
  ./gradlew --no-daemon test assembleDebug
)

echo "2/14 Validate physical test session structure"
node scripts/validate-physical-test-session.mjs "$PHYSICAL_SESSION" --json

echo "3/14 Validate support drill session structure"
node scripts/validate-support-drill-session.mjs "$SUPPORT_SESSION" --json

echo "4/14 Validate glasses hardware session structure"
node scripts/validate-glasses-hardware-session.mjs "$GLASSES_SESSION" --json

echo "5/14 Dry-run glasses hardware session apply"
node scripts/apply-glasses-hardware-session.mjs "$GLASSES_SESSION" --json

echo "6/14 Validate support drill draft gate"
node scripts/validate-support-drill-evidence.mjs --json

echo "7/14 Confirm strict support drill gate is blocked until real drill evidence exists"
if node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json; then
  echo "Strict support drill validation passed. Confirm this was intentional and evidence-backed."
else
  echo "Strict support drill validation remains blocked until operational drill evidence exists."
fi

echo "8/14 Validate glasses setup draft gate"
node scripts/validate-glasses-setup-readiness.mjs --json

echo "9/14 Confirm strict glasses setup gate is blocked until credentials exist"
if node scripts/validate-glasses-setup-readiness.mjs --require-credentials --json; then
  echo "Strict glasses setup validation passed. Confirm credentials are intentionally configured outside source control."
else
  echo "Strict glasses setup validation remains blocked until local Meta credentials exist."
fi

echo "10/14 Validate glasses hardware draft gate"
node scripts/validate-glasses-hardware-evidence.mjs --json

echo "11/14 Confirm strict glasses hardware gate is blocked until real hardware evidence exists"
if node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json; then
  echo "Strict glasses hardware validation passed. Confirm this was intentional and evidence-backed."
else
  echo "Strict glasses hardware validation remains blocked until Ray-Ban and Android XR evidence exists."
fi

echo "12/14 Generate service readiness audit"
node scripts/audit-service-readiness.mjs --write-report --report-dir "$SESSION_DIR/service-readiness-audit"

echo "13/14 Validate private alpha rehearsal folder"
node scripts/validate-private-alpha-rehearsal.mjs "$SESSION_DIR" --json

echo "14/14 Optional generated phone evidence validation"
if [[ -f "$PHYSICAL_SESSION/android-phone-smoke/device-evidence.md" ]]; then
  node scripts/validate-device-evidence.mjs "$PHYSICAL_SESSION/android-phone-smoke/device-evidence.md" --json
else
  echo "No physical device evidence yet. Attach a phone and run the physical session commands when ready."
fi

echo "Private alpha rehearsal evidence is under: $SESSION_DIR"
`;

const checklist = `# Private Alpha Rehearsal Checklist

Generated: ${generatedAt}

Record only status, booleans, counts, enum values, checklist ids, and workspace-relative paths. Do not include transcripts, speaker names, raw audio, PCM, embeddings, encrypted values, Bluetooth owner labels, exact locations, or private alert text.

## Phone Private Alpha

- [ ] Physical Android phone attached.
- [ ] Physical session \`commands.sh\` run.
- [ ] Generated \`device-evidence.md\` exists.
- [ ] Generated \`device-evidence.md\` passes validator.
- [ ] Microphone disclosure gate manually verified.
- [ ] Foreground service runtime manually verified.
- [ ] Notification stop action manually verified.
- [ ] Prototype enrollment and live match manually verified.
- [ ] Debug glasses cue seed script-pass.
- [ ] Debug Bluetooth route evidence script-pass.
- [ ] Debug local delete self-check script-pass.
- [ ] Debug alert output script-pass.
- [ ] Debug direction sample script-pass.
- [ ] Latest evidence snapshot includes \`latestCuePresent=true\`.
- [ ] Latest evidence snapshot includes \`latestDeliverySource=TEST_CUE\`.
- [ ] 30-minute false-positive run completed.

## Glasses Private Alpha

- [ ] Phone private alpha evidence complete first.
- [ ] Meta DAT credentials configured outside source control.
- [ ] Ray-Ban Display evidence file filled.
- [ ] Ray-Ban Gen 1 fallback evidence file filled or documented unavailable.
- [ ] Android XR projected evidence file filled.
- [ ] Haptics/fallback evidence file filled.
- [ ] Glasses hardware session validator passes after filled evidence.
- [ ] Glasses hardware apply dry-run passes.
- [ ] Strict glasses hardware validator passes only after real evidence exists.

## Support And External Beta

- [ ] Support drill session evidence filled.
- [ ] Deletion verification drill run.
- [ ] Mistaken-alert incident drill run.
- [ ] Strict support drill validator passes.
- [ ] Privacy policy public URL ready.
- [ ] Data Safety answers reviewed.
- [ ] Store review package reviewed.
- [ ] Release signing ready.

## Outcome

- Phone private alpha candidate: no
- Glasses private alpha candidate: no
- External beta candidate: no
- Blocking issue ids:
- Next run needed:
`;

const manifest = {
  schemaVersion: 1,
  packageName: "com.voicedirection.glass",
  status: "DRAFT_PRIVATE_ALPHA_REHEARSAL_NOT_RUN",
  generatedAt,
  externalSubmission: "not_performed",
  sessions: {
    physicalSession: physicalSessionRelative,
    supportDrillSession: supportSessionRelative,
    glassesHardwareSession: glassesSessionRelative,
  },
  expectedStrictFailuresUntilEvidence: [
    "support_drills_ready",
    "glasses_setup_credentials",
    "glasses_hardware_alpha_ready",
    "production_direction_ready",
    "production_speaker_model_ready",
    "release_upload_ready",
  ],
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

const privacyRules = `# Private Alpha Rehearsal Privacy Redaction Rules

Generated: ${generatedAt}

These rules apply to every file in this private alpha rehearsal folder.

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
- Enum values.
- Checklist ids.
- Command names.
- Workspace-relative evidence file paths.
- Public SDK/source URLs.

## If Private Data Appears

1. Stop copying that output.
2. Replace the private value with \`[redacted]\`.
3. Keep the surrounding count/status if it is useful.
4. Note which command produced private output so the script or process can be fixed.
`;

const files = [
  ["README.md", readme],
  ["commands.sh", commandsScript, 0o755],
  ["private-alpha-rehearsal-checklist.md", checklist],
  ["rehearsal-manifest.json", `${JSON.stringify(manifest, null, 2)}\n`],
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
  linkedSessions: manifest.sessions,
  nextCommands: [
    `${runDirProjectRelative}/commands.sh`,
    `scripts/validate-private-alpha-rehearsal.mjs ${runDirProjectRelative} --json`,
  ],
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Private alpha rehearsal created: ${runDirProjectRelative}`);
  for (const file of created) {
    console.log(` - ${file}`);
  }
}
