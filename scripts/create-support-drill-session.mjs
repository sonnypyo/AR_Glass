#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_RUN_PREFIX = "voice_direction_support_drill_session";

const args = process.argv.slice(2);
const showHelp = args.includes("--help") || args.includes("-h");
const wantsJson = args.includes("--json");
const force = args.includes("--force");
const runDirArg = valueAfter("--run-dir");
const tester = valueAfter("--tester") || "support drill tester";
const phase = valueAfter("--phase") || "internal_prototype";
const supportChannel = valueAfter("--support-channel") || "private test channel";

function usage() {
  return [
    "Usage: scripts/create-support-drill-session.mjs [--run-dir DIR] [--tester NAME] [--phase PHASE] [--support-channel LABEL] [--force] [--json]",
    "",
    "Creates a non-PII support/deletion/mistaken-alert drill evidence session folder.",
    "It does not update the canonical support-drills manifest; copy reviewed aggregate results deliberately after the drill.",
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

const readme = `# Support Drill Session Summary

Generated: ${generatedAt}

## Session

- Tester: ${tester}
- Phase: ${phase}
- Support channel: ${supportChannel}
- App: Voice Direction Glass
- Canonical manifest: apps/voice-direction-glass/support-drills/manifest.json

## Objective

Collect non-PII operational evidence for the deletion verification drill and mistaken-alert incident drill before any production support claim.

## Required Order

1. Read \`privacy-redaction-rules.md\`.
2. Run \`commands.sh\` before the drill to confirm the current draft gate.
3. Complete \`deletion-verification-drill.md\`.
4. Complete \`mistaken-alert-incident-drill.md\`.
5. Fill \`manifest-update-template.json\` with aggregate pass/fail/count/enum values only.
6. Review the files for private data.
7. Deliberately copy approved aggregate values into \`apps/voice-direction-glass/support-drills/manifest.json\`.
8. Run \`node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json\`.
9. Regenerate service readiness audit.

## Expected Evidence Files

- \`${runDirProjectRelative}/deletion-verification-drill.md\`
- \`${runDirProjectRelative}/mistaken-alert-incident-drill.md\`
- \`${runDirProjectRelative}/manifest-update-template.json\`
- \`${runDirProjectRelative}/service-readiness-audit/service-readiness-audit.md\`

## Current Known Gaps

- This folder is a template until the checklist rows are filled.
- The canonical manifest remains draft until reviewed aggregate values are copied deliberately.
- Strict support drill validation is expected to fail before a configured channel and completed drill evidence exist.
`;

const commandsScript = `#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR}"
SESSION_DIR="$ROOT_DIR/${runDirProjectRelative}"

cd "$ROOT_DIR"

echo "1/6 Validate support incident process"
node scripts/validate-support-incident-process.mjs --json

echo "2/6 Validate support drill draft gate"
node scripts/validate-support-drill-evidence.mjs --json

echo "3/6 Confirm strict drill gate is blocked until evidence exists"
if node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json; then
  echo "Strict support drill validation passed. Confirm this was intentional and evidence-backed."
else
  echo "Strict support drill validation remains blocked until support channel and drill evidence exist."
fi

echo "4/6 Validate this support drill session folder"
node scripts/validate-support-drill-session.mjs "$SESSION_DIR" --json

echo "5/6 Generate service readiness audit"
node scripts/audit-service-readiness.mjs --write-report --report-dir "$SESSION_DIR/service-readiness-audit"

echo "6/6 Re-validate this support drill session folder"
node scripts/validate-support-drill-session.mjs "$SESSION_DIR" --json

echo "Support drill session evidence is under: $SESSION_DIR"
`;

const deletionDrill = `# Deletion Verification Drill

Generated: ${generatedAt}

Record only status, booleans, counts, command names, and checklist ids. Do not include private names, speech text, vectors, encrypted values, Bluetooth owner labels, or exact locations.

## Setup

- [ ] Support channel configured for this phase.
- [ ] Test build installed.
- [ ] Test profile created with non-private placeholder label.
- [ ] Pre-delete profile count recorded as number only.
- [ ] Pre-delete event count recorded as number only.
- [ ] Pre-delete feedback count recorded as number only.
- [ ] Pre-delete direction validation count recorded as number only.

## Execution

- [ ] Deletion request received through allowed support channel.
- [ ] User-facing local delete action executed.
- [ ] App force-stopped.
- [ ] App reopened.
- [ ] Post-delete profile count is 0.
- [ ] Post-delete event count is 0.
- [ ] Post-delete feedback count is 0.
- [ ] Post-delete direction validation count is 0.
- [ ] Post-delete latest cue present is false.
- [ ] Post-delete latest delivery present is false.
- [ ] Settings reset after delete is true.

## Evidence Summary

- status: not_run
- executedAt:
- appVersion: 0.1.0
- buildType: debug
- verifiedLocalDelete: false
- appRestartVerified: false
- postDeleteProfileCount:
- postDeleteEventCount:
- postDeleteFeedbackCount:
- postDeleteDirectionValidationCount:
- postDeleteLatestCuePresent:
- postDeleteLatestDeliveryPresent:
- postDeleteSettingsReset: false
- validatorCommand: node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json

## Outcome

- Drill result: blocked / passed / failed
- Blocking issue ids:
- Next run needed:
`;

const mistakenAlertDrill = `# Mistaken-Alert Incident Drill

Generated: ${generatedAt}

Record only status, booleans, enums, count fields, confidence buckets, command names, and checklist ids. Do not include private names, speech text, vectors, encrypted values, Bluetooth owner labels, or exact locations.

## Setup

- [ ] Support channel configured for this phase.
- [ ] Controlled mistaken-alert scenario created with non-private placeholder records.
- [ ] Private material redaction checked before writing evidence.

## Classification

- [ ] Severity reviewed: S0 / S1 / S2 / S3.
- [ ] Primary type selected: false_positive / wrong_speaker / wrong_direction / missed_alert / output_failure / unsafe_distraction.
- [ ] Expected direction enum recorded: left / right / front / back / unknown / blank.
- [ ] Observed direction enum recorded: left / right / front / back / unknown / blank.
- [ ] Confidence bucket recorded: high / medium / low / unknown / blank.
- [ ] Feedback recorded.
- [ ] Follow-up action recorded.
- [ ] Retest requirement recorded.
- [ ] Private data redacted.

## Evidence Summary

- status: not_run
- executedAt:
- appVersion: 0.1.0
- buildType: debug
- severity:
- primaryType:
- expectedDirection:
- observedDirection:
- confidenceBucket:
- severityReviewed: false
- feedbackRecorded: false
- followUpActionRecorded: false
- retestRequirementRecorded: false
- privateDataRedacted: false
- validatorCommand: node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json

## Outcome

- Drill result: blocked / passed / failed
- Follow-up action:
- Retest required: yes / no
- Blocking issue ids:
- Next run needed:
`;

const manifestTemplate = {
  schemaVersion: 1,
  packageName: "com.voicedirection.glass",
  status: "DRAFT_SUPPORT_DRILLS_NOT_RUN",
  externalSubmission: "not_performed",
  supportChannel: {
    status: "not_configured",
    phase,
    publicContactConfigured: false,
    privacyPolicyContactConfigured: false,
    notes: supportChannel,
  },
  deletionDrill: {
    status: "not_run",
    evidencePath: `${runDirProjectRelative}/deletion-verification-drill.md`,
    executedAt: "",
    appVersion: "0.1.0",
    buildType: "debug",
    verifiedLocalDelete: false,
    appRestartVerified: false,
    postDeleteProfileCount: null,
    postDeleteEventCount: null,
    postDeleteFeedbackCount: null,
    postDeleteDirectionValidationCount: null,
    postDeleteLatestCuePresent: null,
    postDeleteLatestDeliveryPresent: null,
    postDeleteSettingsReset: false,
    validatorCommand: "node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json",
  },
  mistakenAlertDrill: {
    status: "not_run",
    evidencePath: `${runDirProjectRelative}/mistaken-alert-incident-drill.md`,
    executedAt: "",
    appVersion: "0.1.0",
    buildType: "debug",
    severity: "",
    primaryType: "",
    expectedDirection: "",
    observedDirection: "",
    confidenceBucket: "",
    severityReviewed: false,
    feedbackRecorded: false,
    followUpActionRecorded: false,
    retestRequirementRecorded: false,
    privateDataRedacted: false,
    validatorCommand: "node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json",
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

const privacyRules = `# Support Drill Privacy Redaction Rules

Generated: ${generatedAt}

These rules apply to every file in this support drill session folder.

## Never Paste

- Audio recordings or sample buffers.
- Speech text from real people.
- Person names, caller names, profile labels, or contact names.
- Model vectors or biometric reference values.
- Encrypted payload values or storage ciphertext prefixes.
- Bluetooth owner/device names if they reveal a person.
- Private alert message text.
- Home/work location details.

## Allowed Evidence

- Pass/fail/manual/blocking status.
- Counts.
- Booleans.
- Enum values such as \`false_positive\`, \`wrong_direction\`, \`left\`, \`right\`, or \`unknown\`.
- Confidence buckets.
- Checklist ids.
- Command names.
- Workspace-relative evidence file paths.

## If Private Data Appears

1. Stop copying that output.
2. Replace the private value with \`[redacted]\`.
3. Keep the surrounding count/status if it is useful.
4. Note which command produced private output so the script or process can be fixed.
`;

const files = [
  ["README.md", readme],
  ["commands.sh", commandsScript, 0o755],
  ["deletion-verification-drill.md", deletionDrill],
  ["mistaken-alert-incident-drill.md", mistakenAlertDrill],
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
    `scripts/validate-support-drill-session.mjs ${runDirProjectRelative} --json`,
    "node scripts/validate-support-drill-evidence.mjs --json",
    "node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json",
  ],
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Support drill session created: ${runDirProjectRelative}`);
  for (const file of created) {
    console.log(` - ${file}`);
  }
}
