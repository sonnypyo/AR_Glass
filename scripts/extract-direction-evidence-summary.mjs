#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_EVIDENCE = "data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md";
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;
const evidenceArg = positionalArgs()[0] || DEFAULT_EVIDENCE;

function usage() {
  return [
    "Usage: scripts/extract-direction-evidence-summary.mjs [device-evidence.md] [--report-dir DIR] [--json]",
    "",
    "Extracts non-PII direction trial counts, microphone metadata, latency, and route probes",
    "from a generated device-evidence.md file. It writes a summary and manifest update template.",
    "",
    `Default evidence: ${DEFAULT_EVIDENCE}`,
    `Default report dir: ${DEFAULT_REPORT_DIR}`,
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
    if (arg === "--report-dir") {
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

function extractFencedBlockAfter(markdown, marker) {
  const markerIndex = markdown.indexOf(marker);
  if (markerIndex === -1) return "";
  const fenceStart = markdown.indexOf("```", markerIndex);
  if (fenceStart === -1) return "";
  const contentStart = markdown.indexOf("\n", fenceStart);
  if (contentStart === -1) return "";
  const fenceEnd = markdown.indexOf("```", contentStart + 1);
  if (fenceEnd === -1) return "";
  return markdown.slice(contentStart + 1, fenceEnd).trim();
}

function parseBroadcastPayload(block) {
  const match = block.match(/data="([^"]*)"/);
  if (!match) return {};
  const payload = {};
  for (const part of match[1].split(";")) {
    const equalIndex = part.indexOf("=");
    if (equalIndex === -1) continue;
    const key = part.slice(0, equalIndex).trim();
    const value = part.slice(equalIndex + 1).trim();
    if (key) payload[key] = value;
  }
  return payload;
}

function boolValue(value) {
  if (value === true || value === "true" || value === "yes" || value === "pass" || value === "passed") return true;
  if (value === false || value === "false" || value === "no" || value === "fail" || value === "failed") return false;
  return null;
}

function numberValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstNumber(...values) {
  for (const value of values) {
    const parsed = numberValue(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return null;
}

function firstBoolean(...values) {
  for (const value of values) {
    const parsed = boolValue(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function safeRate(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return Number((numerator / denominator).toFixed(4));
}

function linePrivacyNo(markdown, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`-\\s*${escaped}:\\s*([^\\n]+)`, "i"));
  if (!match) return null;
  const value = match[1].trim().toLowerCase();
  if (["no", "false", "none", "not saved", "not included"].includes(value)) return false;
  if (["yes", "true"].includes(value)) return true;
  return null;
}

function parseDirectionTable(markdown) {
  const table = {};
  const headingIndex = markdown.indexOf("## Direction Validation Trial Counts");
  if (headingIndex === -1) return table;
  const block = markdown.slice(headingIndex);
  for (const line of block.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((cell) => cell.trim()).filter(Boolean);
    if (cells.length < 5 || cells[0] === "---" || cells[0] === "Expected Direction") continue;
    const direction = cells[0].toLowerCase();
    if (!["front", "back", "left", "right"].includes(direction)) continue;
    table[direction] = {
      trials: numberValue(cells[1]) ?? 0,
      matched: numberValue(cells[2]) ?? 0,
      mismatched: numberValue(cells[3]) ?? 0,
      unknownOrUnusable: numberValue(cells[4]) ?? 0,
    };
  }
  return table;
}

function directionCounts(direction, snapshot, table) {
  const pascal = direction[0].toUpperCase() + direction.slice(1);
  const tableValue = table[direction] ?? {};
  return {
    trials: firstNumber(snapshot[`direction${pascal}Trials`], tableValue.trials, 0) ?? 0,
    matched: firstNumber(snapshot[`direction${pascal}Matched`], tableValue.matched, 0) ?? 0,
    mismatched: firstNumber(snapshot[`direction${pascal}Mismatched`], tableValue.mismatched, 0) ?? 0,
    unknownOrUnusable: firstNumber(snapshot[`direction${pascal}UnknownOrUnusable`], tableValue.unknownOrUnusable, 0) ?? 0,
  };
}

function missingDirectionTrials(direction, snapshot, requiredTrialsPerDirection, counts) {
  const pascal = direction[0].toUpperCase() + direction.slice(1);
  return firstNumber(
    snapshot[`direction${pascal}MissingTrials`],
    Math.max(requiredTrialsPerDirection - (counts[direction]?.trials ?? 0), 0),
  ) ?? 0;
}

function evidenceHasExplicitControlledMarker(markdown, key) {
  const patterns = [
    new RegExp(`${key}\\s*=\\s*true`, "i"),
    new RegExp(`${key}\\s*:\\s*yes`, "i"),
    new RegExp(`${key}\\s*:\\s*passed`, "i"),
  ];
  return patterns.some((pattern) => pattern.test(markdown));
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# Direction Evidence Summary");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Source evidence: ${summary.sourceEvidencePath}`);
  lines.push(`Fixture evidence: ${summary.fixtureEvidence}`);
  lines.push(`Production direction candidate: ${summary.productionDirectionCandidate}`);
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  if (summary.productionDirectionCandidate) {
    lines.push("The extracted evidence satisfies the local production-direction candidate criteria. Review the manifest update template before copying any field into the canonical manifest.");
  } else {
    lines.push("This summary is not production direction evidence. It must not be used to claim front/back or four-direction readiness.");
  }
  lines.push("");
  lines.push("## Direction Counts");
  lines.push("");
  lines.push("| Direction | Trials | Matched | Mismatched | Unknown/Unusable |");
  lines.push("| --- | ---: | ---: | ---: | ---: |");
  for (const direction of ["front", "back", "left", "right"]) {
    const counts = summary.directionTrialCounts[direction];
    lines.push(`| ${direction.toUpperCase()} | ${counts.trials} | ${counts.matched} | ${counts.mismatched} | ${counts.unknownOrUnusable} |`);
  }
  lines.push("");
  lines.push("## Aggregate Evaluation");
  lines.push("");
  lines.push(`- Total trials: ${summary.aggregateEvaluation.totalTrials}`);
  lines.push(`- All-direction match rate: ${summary.aggregateEvaluation.allDirectionMatchRate ?? "null"}`);
  lines.push(`- Front/back match rate: ${summary.aggregateEvaluation.frontBackMatchRate ?? "null"}`);
  lines.push(`- Left/right match rate: ${summary.aggregateEvaluation.leftRightMatchRate ?? "null"}`);
  lines.push(`- False direction rate: ${summary.aggregateEvaluation.falseDirectionRate ?? "null"}`);
  lines.push(`- Unknown/unusable rate: ${summary.aggregateEvaluation.unknownOrUnusableRate ?? "null"}`);
  lines.push(`- p95 latency millis: ${summary.aggregateEvaluation.p95DirectionLatencyMillis ?? "null"}`);
  lines.push(`- Confidence bucketed: ${summary.aggregateEvaluation.confidenceBucketed}`);
  lines.push(`- Wearable controlled route: ${summary.aggregateEvaluation.wearableRouteWithControlledEvidence ?? "null"}`);
  lines.push("");
  lines.push("## Controlled Target Progress");
  lines.push("");
  lines.push(`- Required trials per direction: ${summary.targetProgress.requiredTrialsPerDirection}`);
  lines.push(`- Required total trials: ${summary.targetProgress.requiredTotalTrials}`);
  lines.push(`- Missing total trials: ${summary.targetProgress.missingTotalTrials}`);
  lines.push(`- Target complete: ${summary.targetProgress.controlledTrialTargetComplete}`);
  lines.push(`- Missing front: ${summary.targetProgress.missingByDirection.front}`);
  lines.push(`- Missing back: ${summary.targetProgress.missingByDirection.back}`);
  lines.push(`- Missing left: ${summary.targetProgress.missingByDirection.left}`);
  lines.push(`- Missing right: ${summary.targetProgress.missingByDirection.right}`);
  lines.push("");
  lines.push("## Microphone Metadata");
  lines.push("");
  lines.push(`- Inventory captured: ${summary.microphoneMetadata.inventoryCaptured}`);
  lines.push(`- Active microphones captured: ${summary.microphoneMetadata.activeMicrophonesCaptured}`);
  lines.push(`- Channel mapping captured: ${summary.microphoneMetadata.channelMappingCaptured}`);
  lines.push(`- Hardware pose or mounting documented: ${summary.microphoneMetadata.hardwarePoseOrMountingDocumented}`);
  lines.push("");
  lines.push("## Privacy");
  lines.push("");
  lines.push(`- Raw audio persisted: ${summary.privacy.rawAudioPersisted}`);
  lines.push(`- PCM persisted: ${summary.privacy.pcmPersisted}`);
  lines.push(`- Transcripts in evidence: ${summary.privacy.transcriptsInEvidence}`);
  lines.push(`- Speaker names in evidence: ${summary.privacy.speakerNamesInEvidence}`);
  lines.push(`- Raw embedding values in evidence: ${summary.privacy.rawEmbeddingValuesInEvidence}`);
  lines.push(`- Raw output persisted: ${summary.privacy.rawOutputPersisted}`);
  lines.push("");
  lines.push("## Outputs");
  lines.push("");
  lines.push(`- Summary JSON: ${summary.outputs.summaryJson}`);
  lines.push(`- Summary Markdown: ${summary.outputs.summaryMarkdown}`);
  lines.push(`- Manifest update template: ${summary.outputs.manifestUpdateTemplate}`);
  lines.push("");
  lines.push("## Next Commands");
  lines.push("");
  lines.push("```bash");
  lines.push(`scripts/validate-direction-evidence-summary.mjs ${summary.outputs.summaryJson} --json`);
  lines.push(`scripts/validate-direction-evidence-summary.mjs ${summary.outputs.summaryJson} --require-production-direction-candidate --json`);
  lines.push("```");
  return `${lines.join("\n")}\n`;
}

const errors = [];
let summary = null;

try {
  const evidence = resolveInsideWorkspace(evidenceArg);
  const reportDir = resolveInsideWorkspace(reportDirArg);
  if (!fs.existsSync(evidence.absolute)) {
    throw new Error(`Evidence file does not exist: ${evidence.relative}`);
  }
  const markdown = fs.readFileSync(evidence.absolute, "utf8");
  const generatedAt = kstTimestamp();
  const sourceHash = crypto.createHash("sha256").update(markdown).digest("hex");

  const directionSample = parseBroadcastPayload(extractFencedBlockAfter(markdown, "Debug direction sample test broadcast output"));
  const bluetoothRoute = parseBroadcastPayload(extractFencedBlockAfter(markdown, "Debug Bluetooth route evidence broadcast output"));
  const glassesCueSeed = parseBroadcastPayload(extractFencedBlockAfter(markdown, "Debug glasses cue seed broadcast output"));
  const snapshot = parseBroadcastPayload(extractFencedBlockAfter(markdown, "Non-PII Repository Evidence Snapshot"));
  const tableCounts = parseDirectionTable(markdown);

  const counts = {
    front: directionCounts("front", snapshot, tableCounts),
    back: directionCounts("back", snapshot, tableCounts),
    left: directionCounts("left", snapshot, tableCounts),
    right: directionCounts("right", snapshot, tableCounts),
  };
  const summedTrials = Object.values(counts).reduce((sum, value) => sum + value.trials, 0);
  const summedMatched = Object.values(counts).reduce((sum, value) => sum + value.matched, 0);
  const summedMismatched = Object.values(counts).reduce((sum, value) => sum + value.mismatched, 0);
  const summedUnknown = Object.values(counts).reduce((sum, value) => sum + value.unknownOrUnusable, 0);
  const totalTrials = firstNumber(snapshot.directionTrialCount, summedTrials) ?? 0;
  const matched = firstNumber(snapshot.directionMatched, summedMatched) ?? 0;
  const mismatched = firstNumber(snapshot.directionMismatched, summedMismatched) ?? 0;
  const unknownOrUnusable = firstNumber(snapshot.directionUnknownOrUnusable, summedUnknown) ?? 0;

  const frontBackTrials = counts.front.trials + counts.back.trials;
  const frontBackMatched = counts.front.matched + counts.back.matched;
  const leftRightTrials = counts.left.trials + counts.right.trials;
  const leftRightMatched = counts.left.matched + counts.right.matched;

  const latestLatency = firstNumber(snapshot.latestProcessingLatencyMillis);
  const averageLatency = firstNumber(snapshot.averageProcessingLatencyMillis);
  const p95Latency = firstNumber(
    snapshot.p95DirectionLatencyMillis,
    snapshot.directionP95LatencyMillis,
    snapshot.p95ProcessingLatencyMillis,
  );

  const fixtureEvidence = /validator-fixture|Fixture only|Device serial:\s*fixture|Device model:\s*fixture/i.test(`${evidence.relative}\n${markdown}`);
  const inventoryCaptured = firstBoolean(
    snapshot.latestAudioDirectionMicrophoneInventoryCaptured,
    directionSample.microphoneInventoryCaptured,
  ) === true;
  const activeMicrophonesCaptured = firstBoolean(
    snapshot.latestAudioDirectionActiveMicrophoneCaptured,
    directionSample.activeMicrophoneCaptured,
  ) === true;
  const channelMappingCaptured = (
    firstNumber(snapshot.latestAudioDirectionActiveChannelMappingCount, directionSample.activeChannelMappingCount, 0) ?? 0
  ) > 0;
  const hardwarePoseOrMountingDocumented = evidenceHasExplicitControlledMarker(markdown, "hardwarePoseOrMountingDocumented")
    || evidenceHasExplicitControlledMarker(markdown, "mountingOrientationDocumented");
  const phoneControlledEvidence = evidenceHasExplicitControlledMarker(markdown, "phoneControlledDirectionEvidence");
  const wearableRouteWithControlledEvidence = firstString(snapshot.wearableRouteWithControlledEvidence)
    || (/wearableRouteWithControlledEvidence\s*[:=]\s*([A-Za-z0-9_-]+)/i.exec(markdown)?.[1] ?? null);
  const requiredTrialsPerDirection = firstNumber(snapshot.directionRequiredTrialsPerDirection, 20) ?? 20;
  const requiredTotalTrials = firstNumber(snapshot.directionRequiredTotalTrials, requiredTrialsPerDirection * 4) ?? (requiredTrialsPerDirection * 4);
  const missingByDirection = {
    front: missingDirectionTrials("front", snapshot, requiredTrialsPerDirection, counts),
    back: missingDirectionTrials("back", snapshot, requiredTrialsPerDirection, counts),
    left: missingDirectionTrials("left", snapshot, requiredTrialsPerDirection, counts),
    right: missingDirectionTrials("right", snapshot, requiredTrialsPerDirection, counts),
  };
  const missingTotalTrials = firstNumber(
    snapshot.directionMissingTotalTrials,
    Object.values(missingByDirection).reduce((sum, value) => sum + value, 0),
  ) ?? 0;
  const controlledTrialTargetComplete = firstBoolean(snapshot.directionControlledTrialTargetComplete)
    ?? (missingTotalTrials === 0 && totalTrials >= requiredTotalTrials);
  const targetProgress = {
    requiredTrialsPerDirection,
    requiredTotalTrials,
    missingTotalTrials,
    controlledTrialTargetComplete,
    missingByDirection,
  };

  const privacy = {
    rawAudioPersisted: linePrivacyNo(markdown, "Raw audio saved") ?? false,
    pcmPersisted: (linePrivacyNo(markdown, "Raw enrollment PCM saved") ?? false) || (linePrivacyNo(markdown, "Raw match PCM saved") ?? false),
    transcriptsInEvidence: linePrivacyNo(markdown, "Transcript pasted into report") ?? false,
    rawEmbeddingValuesInEvidence: linePrivacyNo(markdown, "Voice embeddings exported") ?? false,
    speakerNamesInEvidence: linePrivacyNo(markdown, "Speaker names pasted into log section") ?? false,
    localOnly: true,
    rawOutputPersisted: false,
  };

  const aggregateEvaluation = {
    status: "summarized_not_production_ready",
    totalTrials,
    matched,
    mismatched,
    unknownOrUnusable,
    frontTrials: counts.front.trials,
    backTrials: counts.back.trials,
    leftTrials: counts.left.trials,
    rightTrials: counts.right.trials,
    allDirectionMatchRate: safeRate(matched, totalTrials),
    frontBackMatchRate: safeRate(frontBackMatched, frontBackTrials),
    leftRightMatchRate: safeRate(leftRightMatched, leftRightTrials),
    falseDirectionRate: safeRate(mismatched, totalTrials),
    unknownOrUnusableRate: safeRate(unknownOrUnusable, totalTrials),
    p95DirectionLatencyMillis: p95Latency,
    latestProcessingLatencyMillis: latestLatency,
    averageProcessingLatencyMillis: averageLatency,
    confidenceBucketed: Boolean(firstString(snapshot.latestAudioDirectionConfidenceBucket, directionSample.confidenceBucket)),
    lowestTargetDevice: fixtureEvidence ? "fixture" : "android-phone",
    wearableRouteWithControlledEvidence,
    targetProgress,
  };

  const thresholds = {
    totalTrialsMet: totalTrials >= requiredTotalTrials,
    frontTrialsMet: counts.front.trials >= requiredTrialsPerDirection,
    backTrialsMet: counts.back.trials >= requiredTrialsPerDirection,
    leftTrialsMet: counts.left.trials >= requiredTrialsPerDirection,
    rightTrialsMet: counts.right.trials >= requiredTrialsPerDirection,
    controlledTargetProgressMet: controlledTrialTargetComplete && missingTotalTrials === 0,
    allDirectionMatchRateMet: (aggregateEvaluation.allDirectionMatchRate ?? 0) >= 0.85,
    frontBackMatchRateMet: (aggregateEvaluation.frontBackMatchRate ?? 0) >= 0.80,
    leftRightMatchRateMet: (aggregateEvaluation.leftRightMatchRate ?? 0) >= 0.90,
    falseDirectionRateMet: (aggregateEvaluation.falseDirectionRate ?? 1) <= 0.10,
    unknownOrUnusableRateMet: (aggregateEvaluation.unknownOrUnusableRate ?? 1) <= 0.15,
    p95LatencyMet: Number.isFinite(p95Latency) && p95Latency <= 500,
    confidenceBucketed: aggregateEvaluation.confidenceBucketed,
    microphoneMetadataMet: inventoryCaptured && activeMicrophonesCaptured && channelMappingCaptured && hardwarePoseOrMountingDocumented,
    phoneControlledEvidence,
    wearableRouteWithControlledEvidence: Boolean(wearableRouteWithControlledEvidence),
    privacyMet: Object.entries(privacy).every(([key, value]) => key === "localOnly" ? value === true : value === false),
  };

  const productionDirectionCandidate = !fixtureEvidence
    && Object.values(thresholds).every((value) => value === true);

  aggregateEvaluation.status = productionDirectionCandidate ? "passed_controlled_evaluation" : "summarized_not_production_ready";

  const summaryJsonRelative = path.join(reportDir.relative, "direction-evidence-summary.json");
  const summaryMarkdownRelative = path.join(reportDir.relative, "direction-evidence-summary.md");
  const manifestTemplateRelative = path.join(reportDir.relative, "manifest-update-template.json");

  const manifestUpdateTemplate = {
    packageName: "com.voicedirection.glass",
    status: productionDirectionCandidate ? "DIRECTION_EVIDENCE_EVALUATED" : "DRAFT_DIRECTION_EVIDENCE_NOT_COLLECTED",
    updatedAt: generatedAt,
    externalSubmission: "not_performed",
    privacy: {
      rawAudioPersisted: privacy.rawAudioPersisted,
      pcmPersisted: privacy.pcmPersisted,
      transcriptsInEvidence: privacy.transcriptsInEvidence,
      rawEmbeddingValuesInEvidence: privacy.rawEmbeddingValuesInEvidence,
      speakerNamesInEvidence: privacy.speakerNamesInEvidence,
      localOnly: privacy.localOnly,
    },
    currentAlgorithm: {
      id: "stereo-energy-balance-v0",
      implementation: "app/src/main/kotlin/com/voicedirection/glass/direction/StereoPcmDirectionEstimator.kt",
      claimLevel: productionDirectionCandidate ? "FOUR_DIRECTION_CONTROLLED_EVIDENCE" : "LEFT_RIGHT_REFERENCE_ONLY",
      frontBackClaim: productionDirectionCandidate ? "supported_by_controlled_evidence" : "blocked",
      notes: productionDirectionCandidate
        ? "Candidate summary extracted from controlled non-PII device evidence. Review before copying to the canonical manifest."
        : "Summary extracted for workflow review only. Controlled production direction criteria are not satisfied.",
    },
    microphoneMetadata: {
      inventoryCaptured,
      activeMicrophonesCaptured,
      channelMappingCaptured,
      hardwarePoseOrMountingDocumented,
    },
    targetHardware: {
      androidPhone: {
        required: true,
        status: phoneControlledEvidence ? "passed_controlled_evidence" : "missing_controlled_evidence",
      },
      metaRayBanGen1BluetoothHfp: {
        requiredForFallback: true,
        status: wearableRouteWithControlledEvidence === "metaRayBanGen1BluetoothHfp" ? "passed_controlled_evidence" : "missing_bluetooth_route_evidence",
      },
      metaRayBanDisplay: {
        requiredForClaim: true,
        status: wearableRouteWithControlledEvidence === "metaRayBanDisplay" ? "passed_controlled_evidence" : "missing_sdk_runtime_evidence",
      },
      androidXrProjected: {
        requiredForClaim: false,
        status: wearableRouteWithControlledEvidence === "androidXrProjected" ? "passed_controlled_evidence" : "missing_projected_context_evidence",
      },
    },
    claimedPlatforms: {
      androidPhone: productionDirectionCandidate,
      metaRayBanGen1BluetoothHfp: productionDirectionCandidate && wearableRouteWithControlledEvidence === "metaRayBanGen1BluetoothHfp",
      metaRayBanDisplay: productionDirectionCandidate && wearableRouteWithControlledEvidence === "metaRayBanDisplay",
      androidXrProjected: productionDirectionCandidate && wearableRouteWithControlledEvidence === "androidXrProjected",
    },
    aggregateEvaluation: {
      ...aggregateEvaluation,
      targetProgress,
      evidenceFile: productionDirectionCandidate ? "aggregate-direction-evidence-summary.json" : null,
    },
  };

  summary = {
    schemaVersion: 1,
    generatedAt,
    reportDir: reportDir.relative,
    sourceEvidencePath: evidence.relative,
    sourceEvidenceSha256: sourceHash,
    fixtureEvidence,
    productionDirectionCandidate,
    directionSample: {
      present: Object.keys(directionSample).length > 0,
      passed: firstBoolean(directionSample.passed),
      status: firstString(directionSample.status, snapshot.latestAudioDirectionStatus),
      evidenceLevel: firstString(directionSample.evidenceLevel, snapshot.latestAudioDirectionEvidenceLevel),
      direction: firstString(directionSample.direction, snapshot.latestAudioDirectionDirection),
      confidenceBucket: firstString(directionSample.confidenceBucket, snapshot.latestAudioDirectionConfidenceBucket),
      sampleRateHz: firstNumber(directionSample.sampleRateHz, snapshot.latestAudioDirectionSampleRateHz),
      samplesRead: firstNumber(directionSample.samplesRead, snapshot.latestAudioDirectionSamplesRead),
      microphoneInventoryCaptured: inventoryCaptured,
      availableMicrophoneCount: firstNumber(directionSample.availableMicrophoneCount, snapshot.latestAudioDirectionAvailableMicrophoneCount, 0) ?? 0,
      availablePositionKnownCount: firstNumber(directionSample.availablePositionKnownCount, snapshot.latestAudioDirectionAvailablePositionKnownCount, 0) ?? 0,
      availableOrientationKnownCount: firstNumber(directionSample.availableOrientationKnownCount, snapshot.latestAudioDirectionAvailableOrientationKnownCount, 0) ?? 0,
      activeMicrophoneCaptured: activeMicrophonesCaptured,
      activeMicrophoneCount: firstNumber(directionSample.activeMicrophoneCount, snapshot.latestAudioDirectionActiveMicrophoneCount, 0) ?? 0,
      activeChannelMappingCount: firstNumber(directionSample.activeChannelMappingCount, snapshot.latestAudioDirectionActiveChannelMappingCount, 0) ?? 0,
    },
    directionTrialCounts: counts,
    aggregateEvaluation,
    targetProgress,
    thresholds,
    microphoneMetadata: {
      inventoryCaptured,
      activeMicrophonesCaptured,
      channelMappingCaptured,
      hardwarePoseOrMountingDocumented,
    },
    routeEvidence: {
      bluetooth: {
        present: Object.keys(bluetoothRoute).length > 0,
        passed: firstBoolean(bluetoothRoute.passed),
        communicationRoutingSupported: firstBoolean(bluetoothRoute.communicationRoutingSupported),
        recordAudioPermissionGranted: firstBoolean(bluetoothRoute.recordAudioPermissionGranted),
        bluetoothConnectPermissionGranted: firstBoolean(bluetoothRoute.bluetoothConnectPermissionGranted),
        deviceCount: firstNumber(bluetoothRoute.deviceCount, 0) ?? 0,
        bluetoothInputAvailable: firstBoolean(bluetoothRoute.bluetoothInputAvailable),
        bluetoothInputCandidateCount: firstNumber(bluetoothRoute.bluetoothInputCandidateCount, 0) ?? 0,
        selectedBluetoothInputPresent: firstBoolean(bluetoothRoute.selectedBluetoothInputPresent),
        selectedBluetoothInputType: firstString(bluetoothRoute.selectedBluetoothInputType),
        controlledDirectionEvidence: wearableRouteWithControlledEvidence === "metaRayBanGen1BluetoothHfp",
      },
      glassesCueSeed: {
        present: Object.keys(glassesCueSeed).length > 0,
        passed: firstBoolean(glassesCueSeed.passed),
        direction: firstString(glassesCueSeed.direction),
        confidenceBucket: firstString(glassesCueSeed.confidenceBucket),
        labelPresent: firstBoolean(glassesCueSeed.labelPresent),
      },
    },
    privacy,
    outputs: {
      summaryJson: summaryJsonRelative,
      summaryMarkdown: summaryMarkdownRelative,
      manifestUpdateTemplate: manifestTemplateRelative,
    },
    manifestUpdateTemplate,
    errors,
    warnings: [
      fixtureEvidence ? "Fixture evidence cannot be used for production direction claims." : "",
      productionDirectionCandidate ? "" : "Controlled production direction criteria are not satisfied.",
      p95Latency === null ? "p95 direction latency is missing; strict direction readiness must fail." : "",
      wearableRouteWithControlledEvidence ? "" : "No wearable route with controlled direction evidence was found.",
    ].filter(Boolean),
  };

  fs.mkdirSync(reportDir.absolute, { recursive: true });
  fs.writeFileSync(path.join(reportDir.absolute, "direction-evidence-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(path.join(reportDir.absolute, "manifest-update-template.json"), `${JSON.stringify(manifestUpdateTemplate, null, 2)}\n`);
  fs.writeFileSync(path.join(reportDir.absolute, "direction-evidence-summary.md"), renderMarkdown(summary));
} catch (error) {
  errors.push(error.message);
}

const result = summary ?? {
  ok: false,
  errors,
};

if (summary) {
  result.ok = errors.length === 0;
}

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Direction evidence summary written: ${summary.outputs.summaryJson}`);
  for (const warning of summary.warnings) console.log(`warning: ${warning}`);
} else {
  console.error("Direction evidence extraction failed.");
  for (const error of errors) console.error(`error: ${error}`);
}

process.exit(result.ok ? 0 : 1);
