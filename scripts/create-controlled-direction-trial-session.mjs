#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_RUN_PREFIX = "voice_direction_controlled_direction_trials";
const DIRECTIONS = ["FRONT", "BACK", "LEFT", "RIGHT"];
const ALLOWED_SOURCES = [
  "controlled-phone",
  "bluetooth-route",
  "rayban-display",
  "rayban-gen1-fallback",
  "android-xr-projected",
  "manual-adb-direction-validation",
];

const args = process.argv.slice(2);
const showHelp = args.includes("--help") || args.includes("-h");
const wantsJson = args.includes("--json");
const force = args.includes("--force");
const runDirArg = valueAfter("--run-dir");
const tester = valueAfter("--tester") || "direction trial tester";
const source = valueAfter("--source") || "controlled-phone";
const route = valueAfter("--route") || "phone-built-in-microphones";
const trialsPerDirection = parsePositiveInteger(valueAfter("--trials-per-direction") || "20", "--trials-per-direction");

function usage() {
  return [
    "Usage: scripts/create-controlled-direction-trial-session.mjs [--run-dir DIR] [--tester NAME] [--source SOURCE] [--route LABEL] [--trials-per-direction N] [--force] [--json]",
    "",
    "Creates a non-PII controlled direction-trial session folder with trial sheets, ADB command templates, and validation commands.",
    "It does not run direction trials or invent observed directions.",
    `Allowed sources: ${ALLOWED_SOURCES.join(", ")}`,
  ].join("\n");
}

if (showHelp) {
  console.log(usage());
  process.exit(0);
}

if (!ALLOWED_SOURCES.includes(source)) {
  console.error(`Invalid --source: ${source}`);
  console.error(`Allowed sources: ${ALLOWED_SOURCES.join(", ")}`);
  process.exit(1);
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

function parsePositiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 1000) {
    console.error(`${label} must be an integer from 1 to 1000.`);
    process.exit(1);
  }
  return parsed;
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

function trialId(direction, index) {
  return `${direction.toLowerCase()}-${String(index).padStart(2, "0")}`;
}

const generatedAt = kstTimestamp();
const runDirRelative = runDirArg || defaultRunDir();
const runDir = path.isAbsolute(runDirRelative) ? runDirRelative : path.join(ROOT_DIR, runDirRelative);
ensureInsideWorkspace(runDir);
const runDirProjectRelative = path.relative(ROOT_DIR, runDir);

const trialRows = DIRECTIONS.flatMap((direction) =>
  Array.from({ length: trialsPerDirection }, (_, index) => ({
    id: trialId(direction, index + 1),
    expectedDirection: direction,
    observedDirection: "TODO",
    status: "TODO",
    confidenceBucket: "TODO",
    source,
    route,
    latencyBucket: "TODO",
  })),
);

const readme = `# Controlled Direction Trial Session

Generated: ${generatedAt}

## Session

- Tester: ${tester}
- Source label: ${source}
- Route label: ${route}
- Trials per direction: ${trialsPerDirection}
- Total planned trials: ${trialRows.length}
- App: Voice Direction Glass

## Objective

Collect repeatable, non-PII expected-vs-observed direction trial rows for front, back, left, and right before any direction accuracy claim changes.

This session is a planning and evidence-entry aid. It does not prove direction accuracy until real controlled observations, microphone metadata, route proof, latency evidence, and privacy review exist.

## Required Order

1. Read \`privacy-redaction-rules.md\`.
2. Install the debug APK on one authorized Android phone.
3. Run \`commands.sh\` once with no ADB clear flag to validate the session shape.
4. Set \`RUN_ADB_CLEAR=1\` and rerun \`commands.sh\` only when the debug APK is installed and clearing old direction trial rows is intended.
5. Use \`adb-command-templates.md\` during each controlled trial and fill \`trial-run-sheet.md\` / \`trial-plan.csv\` with aggregate-safe values only.
6. Update \`aggregate-summary-template.json\` with reviewed aggregate counts only.
7. Run \`scripts/validate-controlled-direction-trial-session.mjs ${runDirProjectRelative} --json\`.
8. Generate phone evidence with \`scripts/android-device-smoke-test.sh --write-evidence\`, extract the direction summary, and keep strict production validation blocked unless the evidence truly meets the gate.

## Expected Files

- \`${runDirProjectRelative}/commands.sh\`
- \`${runDirProjectRelative}/adb-command-templates.md\`
- \`${runDirProjectRelative}/trial-run-sheet.md\`
- \`${runDirProjectRelative}/trial-plan.csv\`
- \`${runDirProjectRelative}/aggregate-summary-template.json\`
- \`${runDirProjectRelative}/privacy-redaction-rules.md\`

## Current Known Gaps

- No physical ADB direction trial output is recorded by this generated session.
- No microphone metadata, route proof, or latency evidence is filled yet.
- Production direction validation remains blocked.
`;

const commands = `#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")/../../../.." && pwd)"
SESSION_DIR="$ROOT_DIR/${runDirProjectRelative}"

echo "1/6 Validate recorder script"
bash -n "$ROOT_DIR/scripts/record-direction-validation-trial.sh"
"$ROOT_DIR/scripts/record-direction-validation-trial.sh" --help >/dev/null 2>&1

echo "2/6 Build debug APK and run unit tests"
(
  cd "$ROOT_DIR/apps/voice-direction-glass"
  export JAVA_HOME="\${JAVA_HOME:-/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home}"
  export ANDROID_HOME="\${ANDROID_HOME:-/Users/sonjunpyo/Library/Android/sdk}"
  ./gradlew --no-daemon test assembleDebug
)

echo "3/6 Validate direction evidence draft gate"
node "$ROOT_DIR/scripts/validate-direction-accuracy-evidence.mjs" --json

echo "4/6 Optionally clear old debug direction trial rows"
if [[ "\${RUN_ADB_CLEAR:-0}" == "1" ]]; then
  "$ROOT_DIR/scripts/record-direction-validation-trial.sh" --clear
else
  echo "Skipped ADB clear. Set RUN_ADB_CLEAR=1 only after the debug APK is installed on the test phone."
fi

echo "5/6 Validate controlled direction trial session"
"$ROOT_DIR/scripts/validate-controlled-direction-trial-session.mjs" "$SESSION_DIR" --json

echo "6/6 Regenerate service readiness audit for this session"
node "$ROOT_DIR/scripts/audit-service-readiness.mjs" --write-report --report-dir "$SESSION_DIR/service-readiness-audit"

echo "Controlled direction trial session workflow finished."
`;

const commandTemplates = `# ADB Command Templates

Generated: ${generatedAt}

Use these templates only while running controlled physical trials. Replace \`OBSERVED\`, \`STATUS\`, and \`CONFIDENCE\` with the measured enum/status/value. Keep \`UNKNOWN\` when confidence is weak.

Allowed observed directions: \`FRONT\`, \`BACK\`, \`LEFT\`, \`RIGHT\`, \`UNKNOWN\`.

Allowed statuses: \`SAMPLED\`, \`NO_PERMISSION\`, \`NO_STEREO_INPUT\`, \`RECORDER_UNAVAILABLE\`, \`READ_FAILED\`, \`ERROR\`.

Clear old trial rows:

\`\`\`bash
scripts/record-direction-validation-trial.sh --clear
\`\`\`

## Per-Direction Templates

${DIRECTIONS.map((direction) => `### ${direction}

\`\`\`bash
scripts/record-direction-validation-trial.sh --expected ${direction} --observed OBSERVED --status STATUS --confidence CONFIDENCE --source ${source}
\`\`\`
`).join("\n")}

## Privacy Guardrail

Do not add person names, transcripts, room descriptions, Bluetooth names, MAC addresses, raw audio, PCM, embedding values, encrypted payload values, or private alert text to command arguments.
`;

const trialRunSheet = `# Trial Run Sheet

Generated: ${generatedAt}

Record only enum/status/count/bucket values. Use \`TODO\` until the value is observed. Do not paste private notes.

| Trial ID | Expected | Observed | Status | Confidence Bucket | Source | Route | Latency Bucket | Recorder Command Ran |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${trialRows.map((row) => `| ${row.id} | ${row.expectedDirection} | TODO | TODO | TODO | ${row.source} | ${row.route} | TODO | no |`).join("\n")}
`;

const csv = [
  "trialId,expectedDirection,observedDirection,status,confidenceBucket,source,route,latencyBucket,recorderCommandRan",
  ...trialRows.map((row) => [
    row.id,
    row.expectedDirection,
    row.observedDirection,
    row.status,
    row.confidenceBucket,
    row.source,
    row.route,
    row.latencyBucket,
    "no",
  ].join(",")),
].join("\n") + "\n";

const aggregateTemplate = {
  generatedAt,
  sessionDir: runDirProjectRelative,
  packageName: "com.voicedirection.glass",
  status: "CONTROLLED_DIRECTION_TRIALS_NOT_RUN",
  source,
  route,
  expected: {
    trialsPerDirection,
    totalTrials: trialRows.length,
  },
  aggregateEvaluation: {
    totalTrials: 0,
    matched: 0,
    mismatched: 0,
    unknownOrUnusable: 0,
    frontTrials: 0,
    backTrials: 0,
    leftTrials: 0,
    rightTrials: 0,
    allDirectionMatchRate: null,
    frontBackMatchRate: null,
    leftRightMatchRate: null,
    falseDirectionRate: null,
    unknownOrUnusableRate: null,
    p95DirectionLatencyMillis: null,
    confidenceBucketed: false,
  },
  microphoneMetadata: {
    inventoryCaptured: false,
    activeMicrophonesCaptured: false,
    channelMappingCaptured: false,
    hardwarePoseOrMountingDocumented: false,
  },
  privacy: {
    rawAudioPersisted: false,
    pcmPersisted: false,
    transcriptsInEvidence: false,
    rawEmbeddingValuesInEvidence: false,
    speakerNamesInEvidence: false,
    bluetoothNamesInEvidence: false,
    privateAlertTextInEvidence: false,
  },
  productionDirectionCandidate: false,
  notes: "Review aggregate counts only. Do not copy TODO rows into canonical direction evidence.",
};

const privacyRules = `# Privacy Redaction Rules

These rules apply to every controlled direction-trial session file.

Do not record:

- Raw audio files or PCM samples.
- Speech text from real people.
- Person names or speaker labels.
- Voice embedding values.
- Encrypted payload values.
- Bluetooth owner/device names or MAC addresses.
- Private alert message text.
- Exact room descriptions or exact locations.

Allowed evidence values:

- Direction enums.
- Status enums.
- Confidence buckets.
- Latency buckets.
- Counts and rates.
- Device-class or route-class labels.
- Workspace-relative evidence paths.

If a private value is accidentally pasted, remove it locally before running validators or referencing this folder in reports.
`;

const created = [
  writeFile(path.join(runDir, "README.md"), readme),
  writeFile(path.join(runDir, "commands.sh"), commands, 0o755),
  writeFile(path.join(runDir, "adb-command-templates.md"), commandTemplates),
  writeFile(path.join(runDir, "trial-run-sheet.md"), trialRunSheet),
  writeFile(path.join(runDir, "trial-plan.csv"), csv),
  writeFile(path.join(runDir, "aggregate-summary-template.json"), `${JSON.stringify(aggregateTemplate, null, 2)}\n`),
  writeFile(path.join(runDir, "privacy-redaction-rules.md"), privacyRules),
];

const result = {
  runDir: runDirProjectRelative,
  generatedAt,
  source,
  route,
  trialsPerDirection,
  totalTrials: trialRows.length,
  created,
  nextCommands: [
    `scripts/validate-controlled-direction-trial-session.mjs ${runDirProjectRelative} --json`,
    `${runDirProjectRelative}/commands.sh`,
  ],
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Controlled direction trial session written: ${runDirProjectRelative}`);
  for (const command of result.nextCommands) console.log(command);
}
