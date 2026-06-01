#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_RUN_DIR = "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack";
const DEFAULT_PHYSICAL_SESSION = "data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack";
const DEFAULT_SUPPORT_SESSION = "data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack";
const DEFAULT_GLASSES_SESSION = "data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack";
const DEFAULT_REHEARSAL_SESSION = "data/runs/20260528_voice_direction_mvp/79-private-alpha-rehearsal-pack";

const args = process.argv.slice(2);
const showHelp = args.includes("--help") || args.includes("-h");
const wantsJson = args.includes("--json");
const force = args.includes("--force");
const runDirArg = valueAfter("--run-dir") || DEFAULT_RUN_DIR;
const tester = valueAfter("--tester") || "hardware operator";
const physicalSession = valueAfter("--physical-session") || DEFAULT_PHYSICAL_SESSION;
const supportSession = valueAfter("--support-session") || DEFAULT_SUPPORT_SESSION;
const glassesSession = valueAfter("--glasses-session") || DEFAULT_GLASSES_SESSION;
const rehearsalSession = valueAfter("--rehearsal-session") || DEFAULT_REHEARSAL_SESSION;

function usage() {
  return [
    "Usage: scripts/create-hardware-test-operator-pack.mjs [--run-dir DIR] [--tester NAME] [--force] [--json]",
    "",
    "Creates a non-PII operator pack for a real hardware test day.",
    "The pack links phone, support, glasses, and private-alpha evidence commands without storing device identifiers.",
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

function resolveInsideWorkspace(value) {
  const absolute = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to access outside workspace: ${absolute}`);
  }
  return { absolute, relative };
}

function writeFile(runDir, fileName, content, mode) {
  const absolutePath = path.join(runDir.absolute, fileName);
  if (!force && fs.existsSync(absolutePath)) {
    throw new Error(`Refusing to overwrite without --force: ${path.relative(ROOT_DIR, absolutePath)}`);
  }
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
  if (mode) fs.chmodSync(absolutePath, mode);
  return path.relative(ROOT_DIR, absolutePath);
}

const generatedAt = kstTimestamp();
const runDir = resolveInsideWorkspace(runDirArg);
const physical = resolveInsideWorkspace(physicalSession);
const support = resolveInsideWorkspace(supportSession);
const glasses = resolveInsideWorkspace(glassesSession);
const rehearsal = resolveInsideWorkspace(rehearsalSession);
fs.mkdirSync(runDir.absolute, { recursive: true });

const sessionLinks = {
  schemaVersion: 1,
  generatedAt,
  tester,
  packDir: runDir.relative,
  physicalSession: physical.relative,
  supportSession: support.relative,
  glassesSession: glasses.relative,
  rehearsalSession: rehearsal.relative,
  defaultCommands: {
    noHardware: `${runDir.relative}/commands.sh`,
    phoneHardware: `RUN_PHONE=1 ${runDir.relative}/commands.sh`,
    glassesHardware: `RUN_GLASSES=1 ${runDir.relative}/commands.sh`,
    supportHardware: `RUN_SUPPORT=1 ${runDir.relative}/commands.sh`,
  },
  privacy: {
    rawAudioSaved: false,
    transcriptsIncluded: false,
    speakerNamesIncluded: false,
    bluetoothDeviceNamesIncluded: false,
    macAddressesIncluded: false,
    privateAlertTextIncluded: false,
  },
};

const readme = `# Hardware Test Operator Pack

Generated: ${generatedAt}

## Purpose

This pack is the day-of-test control surface for Voice Direction Glass. It ties together phone evidence, Ray-Ban Display evidence, Ray-Ban Meta Gen 1 fallback evidence, Android XR projected evidence, support drills, and private-alpha promotion gates.

It does not prove readiness by itself. It gives the operator one safe place to run default no-hardware checks, then opt into phone, glasses, or support evidence commands only when the matching hardware and owners are ready.

## Linked Sessions

- Physical phone session: \`${physical.relative}\`
- Support drill session: \`${support.relative}\`
- Glasses hardware session: \`${glasses.relative}\`
- Private-alpha rehearsal session: \`${rehearsal.relative}\`

## Default No-Hardware Run

Run this first:

\`\`\`bash
${runDir.relative}/commands.sh
\`\`\`

Expected current result:

- hardware readiness preflight runs
- current-safe service gate passes
- phone-private-alpha runner writes \`phonePrivateAlphaCandidate=false\` and no direction summary because no phone evidence exists
- glasses-private-alpha runner writes \`glassesPrivateAlphaCandidate=false\`
- service-readiness audit is regenerated under this pack
- evidence privacy scan runs against the full pack before promotion validation

## Hardware Opt-In Runs

Use one opt-in flag at a time unless every owner is present and ready:

\`\`\`bash
RUN_PHONE=1 ${runDir.relative}/commands.sh
RUN_GLASSES=1 ${runDir.relative}/commands.sh
RUN_SUPPORT=1 ${runDir.relative}/commands.sh
\`\`\`

Only use \`RUN_PHONE=1\` when exactly one authorized Android phone is attached over ADB.

Only use \`RUN_GLASSES=1\` when Ray-Ban Display, Ray-Ban Meta Gen 1, or Android XR evidence can actually be collected and the session files can be reviewed.

Only use \`RUN_SUPPORT=1\` when deletion and mistaken-alert drill evidence owners are ready.

## Promotion Rule

Phone private alpha requires validator-passing physical \`device-evidence.md\`, default direction evidence summary validation, and manual rows.

Glasses private alpha requires phone private alpha evidence, Meta DAT credentials/package access, real adapter proof, Ray-Ban Display proof, Gen 1 fallback proof or documented limitation, Android XR projected proof, haptics/fallback proof, strict glasses hardware validation, and a passing glasses-alpha service gate.

## Privacy Rule

Do not paste raw audio, PCM, transcripts, speaker names, contact names, voice embeddings, encrypted payload values, Bluetooth owner/device/product names, MAC addresses, private alert text, or exact locations into this pack.
`;

const checklist = `# Hardware Test Operator Checklist

Generated: ${generatedAt}

## Before Running

- [ ] Android phone available and charged.
- [ ] Ray-Ban Display available and paired when testing display proof.
- [ ] Ray-Ban Meta Gen 1 available and paired when testing fallback proof.
- [ ] Android XR device/emulator available only if testing XR projected proof.
- [ ] Meta DAT credentials are configured outside source control when testing DAT proof.
- [ ] No private speaker names, transcripts, audio files, embeddings, Bluetooth names, MAC addresses, or exact locations will be recorded.

## Default No-Hardware Check

- [ ] Run \`${runDir.relative}/commands.sh\`.
- [ ] Confirm hardware readiness preflight report is written.
- [ ] Confirm phone runner summary remains non-PII.
- [ ] Confirm glasses runner summary remains non-PII.
- [ ] Confirm \`current-safe\` service gate passes.
- [ ] Confirm phone/glasses alpha gates remain not-ready until real evidence exists.

## Phone Evidence

- [ ] Treat this as the final hardware step after pre-phone gates are current.
- [ ] Attach exactly one authorized Android phone.
- [ ] Run \`RUN_PHONE=1 ${runDir.relative}/commands.sh\`.
- [ ] Validate generated \`phone-alpha-evidence-summary.json\`.
- [ ] Validate generated \`device-evidence.md\`.
- [ ] Validate generated \`direction-evidence/direction-evidence-summary.json\`.
- [ ] Confirm \`productionDirectionCandidate=false\` unless strict controlled direction evidence exists.
- [ ] Fill manual phone rows in the physical session with aggregate pass/fail evidence only.

## Glasses Evidence

- [ ] Run Meta/Ray-Ban credential preflight.
- [ ] Run \`RUN_GLASSES=1 ${runDir.relative}/commands.sh\` only when real glasses evidence can be collected.
- [ ] Fill Ray-Ban Display evidence.
- [ ] Fill Ray-Ban Gen 1 fallback evidence.
- [ ] Fill Android XR projected evidence when available.
- [ ] Fill haptics/fallback evidence without claiming glasses haptics unless official API proof exists.
- [ ] Dry-run manifest apply before any canonical manifest write.

## Support Evidence

- [ ] Run \`RUN_SUPPORT=1 ${runDir.relative}/commands.sh\` only when support owners are ready.
- [ ] Fill deletion verification drill.
- [ ] Fill mistaken-alert incident drill.
- [ ] Validate strict support drill only after real evidence exists.

## After Running

- [ ] Regenerate service readiness audit.
- [ ] Confirm the pack-level evidence privacy scan passed with zero violations.
- [ ] Run \`scripts/assert-service-gates.mjs --profile current-safe --json\`.
- [ ] Run stricter promotion profiles only after matching evidence exists.
`;

const privacyRules = `# Privacy Redaction Rules

The operator pack may contain:

- command labels
- exit codes
- pass/fail/manual status
- booleans
- counts
- enum values
- checklist ids
- workspace-relative paths

The operator pack must not contain:

- audio recordings or PCM samples
- speech transcripts from real people
- speaker names
- contact names
- voice embedding values
- encrypted payload values
- Bluetooth owner/device/product names
- MAC addresses
- private alert message text
- exact locations
- account tokens, application ids, passwords, or signing key material
`;

const commandsScript = `#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR}"
PACK_DIR="$ROOT_DIR/${runDir.relative}"
PHYSICAL_SESSION="\${PHYSICAL_SESSION:-$ROOT_DIR/${physical.relative}}"
SUPPORT_SESSION="\${SUPPORT_SESSION:-$ROOT_DIR/${support.relative}}"
GLASSES_SESSION="\${GLASSES_SESSION:-$ROOT_DIR/${glasses.relative}}"
REHEARSAL_SESSION="\${REHEARSAL_SESSION:-$ROOT_DIR/${rehearsal.relative}}"

RUN_PHONE="\${RUN_PHONE:-0}"
RUN_GLASSES="\${RUN_GLASSES:-0}"
RUN_SUPPORT="\${RUN_SUPPORT:-0}"

export JAVA_HOME="\${JAVA_HOME:-/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home}"
export ANDROID_HOME="\${ANDROID_HOME:-/Users/sonjunpyo/Library/Android/sdk}"

cd "$ROOT_DIR"

echo "1/13 Check private-alpha hardware readiness"
node scripts/check-private-alpha-hardware-readiness.mjs --write-report --report-dir "$PACK_DIR/hardware-readiness" --json

echo "2/13 Assert current-safe service gate"
node scripts/assert-service-gates.mjs --profile current-safe --json

echo "3/13 Write phone-private-alpha workflow summary"
scripts/run-phone-private-alpha-evidence.mjs --skip-build --allow-no-device --evidence-dir "$PACK_DIR/android-phone-smoke-dry-run" --report-dir "$PACK_DIR/phone-alpha-runner" --json

echo "4/13 Validate phone-private-alpha workflow summary"
scripts/validate-phone-private-alpha-evidence-runner.mjs "$PACK_DIR/phone-alpha-runner/phone-alpha-evidence-summary.json" --json

echo "5/13 Write glasses-private-alpha workflow summary"
scripts/run-glasses-private-alpha-evidence.mjs --session-dir "$GLASSES_SESSION" --report-dir "$PACK_DIR/glasses-alpha-runner" --json

echo "6/13 Validate glasses-private-alpha workflow summary"
scripts/validate-glasses-private-alpha-evidence-runner.mjs "$PACK_DIR/glasses-alpha-runner/glasses-alpha-evidence-summary.json" --json

if [[ "$RUN_PHONE" == "1" ]]; then
  echo "7/13 RUN_PHONE=1: collect physical phone evidence"
  scripts/run-phone-private-alpha-evidence.mjs --evidence-dir "$PACK_DIR/android-phone-smoke" --report-dir "$PACK_DIR/phone-alpha-runner" --json
else
  echo "7/13 RUN_PHONE not set; skipping physical phone evidence collection"
fi

if [[ "$RUN_GLASSES" == "1" ]]; then
  echo "8/13 RUN_GLASSES=1: run glasses hardware session"
  scripts/run-glasses-private-alpha-evidence.mjs --session-dir "$GLASSES_SESSION" --report-dir "$PACK_DIR/glasses-alpha-runner" --run-session --json
else
  echo "8/13 RUN_GLASSES not set; skipping glasses hardware evidence collection"
fi

if [[ "$RUN_SUPPORT" == "1" ]]; then
  echo "9/13 RUN_SUPPORT=1: run support drill session"
  "$SUPPORT_SESSION/commands.sh"
else
  echo "9/13 RUN_SUPPORT not set; skipping support drill execution"
fi

echo "10/13 Regenerate pack service-readiness audit"
node scripts/audit-service-readiness.mjs --write-report --report-dir "$PACK_DIR/service-readiness-audit"

echo "11/13 Scan pack evidence privacy"
scripts/scan-evidence-privacy.mjs "$PACK_DIR" --write-report --report-dir "$PACK_DIR/evidence-privacy-scan" --json

echo "12/13 Validate operator pack"
node scripts/validate-hardware-test-operator-pack.mjs "$PACK_DIR" --json

echo "13/13 Validate workflow promotion"
node scripts/validate-hardware-test-promotion.mjs "$PACK_DIR" --profile workflow --write-report --report-dir "$PACK_DIR/promotion-validation" --json

echo "Operator pack run complete: $PACK_DIR"
`;

const files = [
  writeFile(runDir, "README.md", readme),
  writeFile(runDir, "operator-checklist.md", checklist),
  writeFile(runDir, "privacy-redaction-rules.md", privacyRules),
  writeFile(runDir, "session-links.json", `${JSON.stringify(sessionLinks, null, 2)}\n`),
  writeFile(runDir, "commands.sh", commandsScript, 0o755),
];

const result = {
  ok: true,
  generatedAt,
  runDir: runDir.relative,
  files,
  commands: {
    default: `${runDir.relative}/commands.sh`,
    phone: `RUN_PHONE=1 ${runDir.relative}/commands.sh`,
    glasses: `RUN_GLASSES=1 ${runDir.relative}/commands.sh`,
    support: `RUN_SUPPORT=1 ${runDir.relative}/commands.sh`,
  },
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Hardware test operator pack written: ${runDir.relative}`);
}
