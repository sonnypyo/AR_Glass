#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const filePath = args.find((arg) => !arg.startsWith("--"));

function usage() {
  return [
    "Usage: scripts/validate-device-evidence.mjs <device-evidence.md> [--json]",
    "",
    "Validates the generated physical-device evidence report for required script-pass rows",
    "and checks that snapshot/log evidence does not contain private voice data fields.",
  ].join("\n");
}

if (showHelp || !filePath) {
  console.log(usage());
  process.exit(showHelp ? 0 : 1);
}

const resolvedPath = path.resolve(filePath);
const markdown = fs.readFileSync(resolvedPath, "utf8");

const requiredSections = [
  "Test Metadata",
  "Setup Checks",
  "Functional Result",
  "Detection Feedback Checks",
  "Encrypted Storage Checks",
  "Non-PII Repository Evidence Snapshot",
  "Release Readiness Snapshot",
  "Glasses Readiness Snapshot",
  "Service Automation Bridge Checks",
  "`VoiceDirectionGlass` Log Evidence",
  "Direction Bridge Notes",
  "Direction Validation Trial Counts",
  "Privacy Check",
  "Outcome",
];

const requiredSetupRows = [
  { label: "ADB device visible", pattern: /-\s*ADB device visible:\s*yes\b/i },
  { label: "App installed", pattern: /-\s*App installed:\s*yes\b/i },
  { label: "Encrypted storage self-check", pattern: /-\s*Encrypted storage self-check:\s*script-pass\b/i },
  {
    label: "Repository direction-validation self-check",
    pattern: /-\s*Repository direction-validation self-check:\s*script-pass\b/i,
  },
  {
    label: "Non-PII repository evidence snapshot",
    pattern: /-\s*Non-PII repository evidence snapshot:\s*script-pass\b/i,
  },
  {
    label: "Processing latency metrics in snapshot",
    pattern: /-\s*Processing latency metrics in snapshot:\s*script-pass\b/i,
  },
  {
    label: "Alert delivery statuses in snapshot",
    pattern: /-\s*Alert delivery statuses in snapshot:\s*script-pass\b/i,
  },
  {
    label: "Direction microphone metadata in snapshot",
    pattern: /-\s*Direction microphone metadata in snapshot:\s*script-pass\b/i,
  },
  {
    label: "Debug alert output test",
    pattern: /-\s*Debug alert output test:\s*script-pass\b/i,
  },
  {
    label: "Debug direction sample test",
    pattern: /-\s*Debug direction sample test:\s*script-pass\b/i,
  },
  {
    label: "Debug glasses cue seed",
    pattern: /-\s*Debug glasses cue seed:\s*script-pass\b/i,
  },
  {
    label: "Debug Bluetooth route evidence",
    pattern: /-\s*Debug Bluetooth route evidence:\s*script-pass\b/i,
  },
  {
    label: "Debug local delete self-check",
    pattern: /-\s*Debug local delete self-check:\s*script-pass\b/i,
  },
  {
    label: "Release readiness snapshot",
    pattern: /-\s*Release readiness snapshot:\s*script-pass\b/i,
  },
  {
    label: "Glasses readiness snapshot",
    pattern: /-\s*Glasses readiness snapshot:\s*script-pass\b/i,
  },
];

const requiredSnapshotKeys = [
  "passed=true",
  "profileCount=",
  "eventCount=",
  "actionableEventCount=",
  "microphoneDisclosureAccepted=",
  "microphoneDisclosureVersion=",
  "enabledAlertChannelCount=",
  "phoneNotificationEnabled=",
  "phoneVibrationEnabled=",
  "ttsEnabled=",
  "metaDisplayEnabled=",
  "androidXrDisplayEnabled=",
  "latencyEventCount=",
  "latestProcessingLatencyMillis=",
  "averageProcessingLatencyMillis=",
  "latencyOverTargetCount=",
  "feedbackCount=",
  "directionTrialCount=",
  "directionRequiredTrialsPerDirection=20",
  "directionRequiredTotalTrials=80",
  "directionMissingTotalTrials=",
  "directionControlledTrialTargetComplete=",
  "directionMatched=",
  "directionMismatched=",
  "directionUnknownOrUnusable=",
  "directionFrontTrials=",
  "directionBackTrials=",
  "directionLeftTrials=",
  "directionRightTrials=",
  "directionFrontMissingTrials=",
  "directionBackMissingTrials=",
  "directionLeftMissingTrials=",
  "directionRightMissingTrials=",
  "directionFrontMatched=",
  "directionFrontMismatched=",
  "directionFrontUnknownOrUnusable=",
  "directionBackMatched=",
  "directionBackMismatched=",
  "directionBackUnknownOrUnusable=",
  "directionLeftMatched=",
  "directionLeftMismatched=",
  "directionLeftUnknownOrUnusable=",
  "directionRightMatched=",
  "directionRightMismatched=",
  "directionRightUnknownOrUnusable=",
  "latestCuePresent=true",
  "latestCueDirection=",
  "latestDeliveryPresent=true",
  "latestDeliverySource=TEST_CUE",
  "latestDeliveryTotalCount=",
  "latestDeliveryDeliveredCount=",
  "latestDeliveryPhoneNotification=",
  "latestDeliveryPhoneVibration=",
  "latestDeliveryTts=",
  "latestDeliveryMetaDisplay=",
  "latestDeliveryAndroidXrDisplay=",
  "latestAudioDirectionSamplePresent=",
  "latestAudioDirectionStatus=",
  "latestAudioDirectionEvidenceLevel=",
  "latestAudioDirectionDirection=",
  "latestAudioDirectionConfidenceBucket=",
  "latestAudioDirectionSampleRateHz=",
  "latestAudioDirectionSamplesRead=",
  "latestAudioDirectionMicrophoneInventoryCaptured=",
  "latestAudioDirectionAvailableMicrophoneCount=",
  "latestAudioDirectionAvailablePositionKnownCount=",
  "latestAudioDirectionAvailableOrientationKnownCount=",
  "latestAudioDirectionActiveMicrophoneCaptured=",
  "latestAudioDirectionActiveMicrophoneCount=",
  "latestAudioDirectionActiveChannelMappingCount=",
  "serviceBridgePresent=",
  "falsePositiveRunPresent=",
  "message=pass",
];

const privacyRows = [
  "Raw audio saved",
  "Transcript pasted into report",
  "Speaker names pasted into log section",
  "Voice embeddings exported",
  "Raw enrollment PCM saved",
  "Raw match PCM saved",
];

const privateFieldPatterns = [
  /\btranscript\s*=/i,
  /\bspeaker(?:Name|Label|Text)?\s*=/i,
  /\bcaller(?:Name|Label)\s*=/i,
  /\bprofile(?:Name|Label)\s*=/i,
  /\bphrase\s*=/i,
  /\bembedding\s*[:=]/i,
  /\benc:v\d+:/i,
  /\bpcm\s*[:=]/i,
  /\braw(?:Audio|Pcm)\s*[:=]/i,
  /\baudioBytes\s*=/i,
];

const bluetoothPrivateFieldPatterns = [
  /\bproductName\s*=/i,
  /\bdeviceName\s*=/i,
  /\bowner\s*=/i,
  /\bmac(?:Address)?\s*=/i,
  /\baddress\s*=/i,
];

const privateIdentifierPatterns = [
  /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,
];

function hasSection(title) {
  return new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`, "m").test(markdown);
}

function sectionText(title) {
  const escaped = escapeRegExp(title);
  const heading = new RegExp(`^##\\s+${escaped}\\s*$`, "m");
  const match = heading.exec(markdown);
  if (!match) {
    return "";
  }
  const rest = markdown.slice(match.index + match[0].length);
  const nextSectionIndex = rest.search(/\n##\s+/);
  return nextSectionIndex === -1 ? rest : rest.slice(0, nextSectionIndex);
}

function firstTextCodeBlock(text) {
  const match = text.match(/```text\s*([\s\S]*?)```/);
  return match ? match[1].trim() : "";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const errors = [];
const warnings = [];

for (const section of requiredSections) {
  if (!hasSection(section)) {
    errors.push(`Missing required section: ${section}`);
  }
}

for (const row of requiredSetupRows) {
  if (!row.pattern.test(markdown)) {
    errors.push(`Missing required setup script-pass row: ${row.label}`);
  }
}

const metadataSection = sectionText("Test Metadata");
const serialMatch = metadataSection.match(/-\s*Device serial:\s*([^\n]+)/i);
if (!serialMatch) {
  errors.push("Missing Test Metadata redaction row: Device serial.");
} else {
  const serialValue = serialMatch[1].trim();
  if (!/^(redacted(?:-by-script|-by-fixture)?|fixture|unknown)$/i.test(serialValue)) {
    errors.push("Device serial must be redacted in generated evidence.");
  }
}

const fingerprintMatch = metadataSection.match(/-\s*Build fingerprint:\s*([^\n]+)/i);
if (!fingerprintMatch) {
  errors.push("Missing Test Metadata redaction row: Build fingerprint.");
} else {
  const fingerprintValue = fingerprintMatch[1].trim();
  if (!/^(redacted(?:-by-script|-by-fixture)?|fixture|unknown)$/i.test(fingerprintValue)) {
    errors.push("Build fingerprint must be redacted in generated evidence.");
  }
}

const legacyPathDeviceLabel = resolvedPath.match(/[\\/]\d{8}_\d{6}_([^\\/]+)_android_phone_smoke[\\/]/)?.[1];
if (legacyPathDeviceLabel) {
  errors.push("Evidence directory path must not include an ADB device label; use the redacted default `<timestamp>_android_phone_smoke` path or an explicit non-identifying evidence directory.");
}

if (!/\|\s*Main Activity launches\s*\|\s*script-pass\s*\|/i.test(markdown)) {
  errors.push("Missing Functional Result script-pass row for Main Activity launch.");
}

if (!/\|\s*Debug alert output test broadcast runs\s*\|\s*script-pass\s*\|/i.test(markdown)) {
  errors.push("Missing Functional Result script-pass row for debug alert output test broadcast.");
}

if (!/\|\s*Debug direction sample test broadcast runs\s*\|\s*script-pass\s*\|/i.test(markdown)) {
  errors.push("Missing Functional Result script-pass row for debug direction sample test broadcast.");
}

if (!/\|\s*Debug glasses cue seed broadcast runs\s*\|\s*script-pass\s*\|/i.test(markdown)) {
  errors.push("Missing Functional Result script-pass row for debug glasses cue seed broadcast.");
}

if (!/\|\s*Debug Bluetooth route evidence broadcast runs\s*\|\s*script-pass\s*\|/i.test(markdown)) {
  errors.push("Missing Functional Result script-pass row for debug Bluetooth route evidence broadcast.");
}

if (!/\|\s*Debug local delete self-check broadcast runs\s*\|\s*script-pass\s*\|/i.test(markdown)) {
  errors.push("Missing Functional Result script-pass row for debug local delete self-check broadcast.");
}

const alertOutputBlockMatch = markdown.match(/Debug alert output test broadcast output:\s*```text\s*([\s\S]*?)```/);
if (!alertOutputBlockMatch) {
  errors.push("Missing debug alert output test broadcast output block.");
} else {
  const alertOutputBlock = alertOutputBlockMatch[1].trim();
  for (const marker of [
    "passed=true",
    "enabledAlertChannelCount=",
    "deliveryCount=",
    "deliveredCount=",
    "latestDeliverySource=TEST_CUE",
    "vibrationPatternDirection=",
    "vibrationPatternSignature=",
    "vibrationPatternPulseCount=",
    "vibrationPatternTotalMillis=",
    "phoneVibrationSideSpecific=false",
    "cueContractDirection=",
    "cueContractConfidencePercent=",
    "cueContractNotificationDirection=",
    "cueContractTtsDirectionOnly=true",
    "cueContractTtsSpeakerLabelIncluded=false",
    "cueContractGlassesHapticTarget=",
    "cueContractGlassesHapticIntensity=",
    "cueContractGlassesHapticPulseCount=",
    "cueContractGlassesHapticRequiresApiProof=",
    "cueContractGlassesHapticEvidence=direction=",
    "cueContractDisplayEvidence=direction=",
    "message=pass",
  ]) {
    if (!alertOutputBlock.includes(marker)) {
      errors.push(`Alert output test output is missing key/value marker: ${marker}`);
    }
  }
  for (const pattern of privateFieldPatterns) {
    if (pattern.test(alertOutputBlock)) {
      errors.push(`Alert output test output appears to include private field pattern: ${pattern}`);
    }
  }
}

const directionSampleBlockMatch = markdown.match(/Debug direction sample test broadcast output:\s*```text\s*([\s\S]*?)```/);
if (!directionSampleBlockMatch) {
  errors.push("Missing debug direction sample test broadcast output block.");
} else {
  const directionSampleBlock = directionSampleBlockMatch[1].trim();
  for (const marker of [
    "result=100",
    "status=",
    "evidenceLevel=",
    "microphoneInventoryCaptured=",
    "activeMicrophoneCaptured=",
    "activeChannelMappingCount=",
  ]) {
    if (!directionSampleBlock.includes(marker)) {
      errors.push(`Direction sample test output is missing key/value marker: ${marker}`);
    }
  }
  for (const pattern of privateFieldPatterns) {
    if (pattern.test(directionSampleBlock)) {
      errors.push(`Direction sample test output appears to include private field pattern: ${pattern}`);
    }
  }
}

const glassesCueSeedBlockMatch = markdown.match(/Debug glasses cue seed broadcast output:\s*```text\s*([\s\S]*?)```/);
if (!glassesCueSeedBlockMatch) {
  errors.push("Missing debug glasses cue seed broadcast output block.");
} else {
  const glassesCueSeedBlock = glassesCueSeedBlockMatch[1].trim();
  for (const marker of [
    "result=100",
    "passed=true",
    "direction=",
    "confidenceBucket=",
    "confidencePercent=",
    "labelPresent=false",
    "payloadEvidence=direction=",
    "message=pass",
  ]) {
    if (!glassesCueSeedBlock.includes(marker)) {
      errors.push(`Glasses cue seed output is missing key/value marker: ${marker}`);
    }
  }
  for (const pattern of privateFieldPatterns) {
    if (pattern.test(glassesCueSeedBlock)) {
      errors.push(`Glasses cue seed output appears to include private field pattern: ${pattern}`);
    }
  }
}

const bluetoothRouteBlockMatch = markdown.match(/Debug Bluetooth route evidence broadcast output:\s*```text\s*([\s\S]*?)```/);
if (!bluetoothRouteBlockMatch) {
  errors.push("Missing debug Bluetooth route evidence broadcast output block.");
} else {
  const bluetoothRouteBlock = bluetoothRouteBlockMatch[1].trim();
  for (const marker of [
    "result=100",
    "passed=true",
    "mode=probe",
    "communicationRoutingSupported=",
    "recordAudioPermissionGranted=",
    "bluetoothConnectPermissionGranted=",
    "deviceCount=",
    "bluetoothInputAvailable=",
    "bluetoothInputCandidateCount=",
    "selectedBluetoothInputPresent=",
    "selectedBluetoothInputType=",
    "routeTypeCounts=",
    "errorPresent=",
    "message=pass",
  ]) {
    if (!bluetoothRouteBlock.includes(marker)) {
      errors.push(`Bluetooth route evidence output is missing key/value marker: ${marker}`);
    }
  }
  for (const pattern of [...privateFieldPatterns, ...bluetoothPrivateFieldPatterns]) {
    if (pattern.test(bluetoothRouteBlock)) {
      errors.push(`Bluetooth route evidence output appears to include private field pattern: ${pattern}`);
    }
  }
}

const localDeleteBlockMatch = markdown.match(/Debug local delete self-check broadcast output:\s*```text\s*([\s\S]*?)```/);
if (!localDeleteBlockMatch) {
  errors.push("Missing debug local delete self-check broadcast output block.");
} else {
  const localDeleteBlock = localDeleteBlockMatch[1].trim();
  for (const marker of [
    "result=100",
    "passed=true",
    "seededBeforeDelete=true",
    "profileCountBefore=",
    "eventCountBefore=",
    "feedbackCountBefore=",
    "directionTrialCountBefore=",
    "profileCountAfter=0",
    "eventCountAfter=0",
    "feedbackCountAfter=0",
    "directionTrialCountAfter=0",
    "latestCuePresentAfter=false",
    "latestDeliveryPresentAfter=false",
    "serviceBridgePresentAfter=false",
    "audioDirectionSamplePresentAfter=false",
    "falsePositiveRunPresentAfter=false",
    "settingsResetAfter=true",
    "message=pass",
  ]) {
    if (!localDeleteBlock.includes(marker)) {
      errors.push(`Local delete self-check output is missing key/value marker: ${marker}`);
    }
  }
  for (const pattern of privateFieldPatterns) {
    if (pattern.test(localDeleteBlock)) {
      errors.push(`Local delete self-check output appears to include private field pattern: ${pattern}`);
    }
  }
}

const snapshotBlock = firstTextCodeBlock(sectionText("Non-PII Repository Evidence Snapshot"));
if (!snapshotBlock) {
  errors.push("Missing snapshot text code block.");
} else {
  for (const key of requiredSnapshotKeys) {
    if (!snapshotBlock.includes(key)) {
      errors.push(`Snapshot output is missing key/value marker: ${key}`);
    }
  }
  for (const pattern of privateFieldPatterns) {
    if (pattern.test(snapshotBlock)) {
      errors.push(`Snapshot output appears to include private field pattern: ${pattern}`);
    }
  }
}

const releaseReadinessBlock = firstTextCodeBlock(sectionText("Release Readiness Snapshot"));
if (!releaseReadinessBlock) {
  errors.push("Missing release readiness snapshot text code block.");
} else {
  for (const marker of [
    "passed=true",
    "internalReady=true",
    "phoneReady=false",
    "phoneManual=",
    "phoneBlocked=0",
    "phoneOpenIds=",
    "debug-alert-output-device-qa",
    "debug-direction-sample-device-qa",
    "debug-glasses-cue-seed-device-qa",
    "debug-bluetooth-route-evidence-device-qa",
    "debug-local-delete-self-check-device-qa",
    "glassesReady=false",
    "glassesBlocked=",
    "externalReady=false",
    "productionReady=false",
    "message=pass",
  ]) {
    if (!releaseReadinessBlock.includes(marker)) {
      errors.push(`Release readiness snapshot is missing key/value marker: ${marker}`);
    }
  }
  for (const pattern of privateFieldPatterns) {
    if (pattern.test(releaseReadinessBlock)) {
      errors.push(`Release readiness snapshot appears to include private field pattern: ${pattern}`);
    }
  }
}

const glassesReadinessBlock = firstTextCodeBlock(sectionText("Glasses Readiness Snapshot"));
if (!glassesReadinessBlock) {
  errors.push("Missing glasses readiness snapshot text code block.");
} else {
  for (const marker of [
    "passed=true",
    "glassesAlphaReady=false",
    "openItemCount=",
    "metaReady=false",
    "metaTotal=",
    "metaBlocked=",
    "metaOpenIds=",
    "meta-dat-credentials",
    "glasses-haptics-api-proof",
    "androidXrReady=false",
    "androidXrTotal=",
    "androidXrBlocked=",
    "androidXrOpenIds=",
    "android-xr-real-adapter",
    "message=pass",
  ]) {
    if (!glassesReadinessBlock.includes(marker)) {
      errors.push(`Glasses readiness snapshot is missing key/value marker: ${marker}`);
    }
  }
  for (const pattern of privateFieldPatterns) {
    if (pattern.test(glassesReadinessBlock)) {
      errors.push(`Glasses readiness snapshot appears to include private field pattern: ${pattern}`);
    }
  }
}

const logBlock = firstTextCodeBlock(sectionText("`VoiceDirectionGlass` Log Evidence"));
if (!logBlock) {
  warnings.push("Log evidence text code block is empty or missing.");
} else {
  for (const pattern of privateFieldPatterns) {
    if (pattern.test(logBlock)) {
      errors.push(`Log evidence appears to include private field pattern: ${pattern}`);
    }
  }
  for (const pattern of [...bluetoothPrivateFieldPatterns, ...privateIdentifierPatterns]) {
    if (pattern.test(logBlock)) {
      errors.push(`Log evidence appears to include private identifier pattern: ${pattern}`);
    }
  }
  if (/No matching logcat lines found/i.test(logBlock)) {
    warnings.push("No matching VoiceDirectionGlass logcat lines were captured.");
  }
}

const privacySection = sectionText("Privacy Check");
for (const row of privacyRows) {
  const pattern = new RegExp(`-\\s*${escapeRegExp(row)}:\\s*no\\b`, "i");
  if (!pattern.test(privacySection)) {
    errors.push(`Privacy check must be marked no: ${row}`);
  }
}

const result = {
  file: resolvedPath,
  ok: errors.length === 0,
  errors,
  warnings,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Device evidence validation passed: ${resolvedPath}`);
  for (const warning of warnings) {
    console.log(`warning: ${warning}`);
  }
} else {
  console.error(`Device evidence validation failed: ${resolvedPath}`);
  for (const error of errors) {
    console.error(`error: ${error}`);
  }
  for (const warning of warnings) {
    console.error(`warning: ${warning}`);
  }
}

process.exit(result.ok ? 0 : 1);
