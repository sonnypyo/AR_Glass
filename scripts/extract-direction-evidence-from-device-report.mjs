#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_DEVICE_EVIDENCE = "data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md";
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;
const evidenceArg = positionalArgs()[0] || DEFAULT_DEVICE_EVIDENCE;

const directionKeys = ["front", "back", "left", "right"];

function usage() {
  return [
    "Usage: scripts/extract-direction-evidence-from-device-report.mjs [device-evidence.md] [--report-dir DIR] [--json]",
    "",
    "Extracts non-PII direction evidence from an Android device-evidence report.",
    "Writes direction-evidence-summary.json, direction-evidence-summary.md, and manifest-update-template.json.",
    "",
    `Default device evidence: ${DEFAULT_DEVICE_EVIDENCE}`,
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
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date()).replace(" ", "T") + "+09:00";
}

function parseBroadcastData(markdown, heading) {
  const index = markdown.indexOf(heading);
  if (index === -1) return {};
  const tail = markdown.slice(index);
  const match = tail.match(/data="([^"]+)"/);
  if (!match) return {};
  return Object.fromEntries(
    match[1]
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        if (separator === -1) return [part, ""];
        return [part.slice(0, separator), part.slice(separator + 1)];
      })
  );
}

function parseBoolean(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function percent(numerator, denominator) {
  if (!denominator) return null;
  return Number((numerator / denominator).toFixed(4));
}

function parseDirectionTable(markdown) {
  const stats = {
    front: { total: 0, matched: 0, mismatched: 0, unknownOrUnusable: 0 },
    back: { total: 0, matched: 0, mismatched: 0, unknownOrUnusable: 0 },
    left: { total: 0, matched: 0, mismatched: 0, unknownOrUnusable: 0 },
    right: { total: 0, matched: 0, mismatched: 0, unknownOrUnusable: 0 },
  };
  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const columns = trimmed.split("|").map((column) => column.trim()).filter(Boolean);
    if (columns.length < 5) continue;
    const key = columns[0].toLowerCase();
    if (!directionKeys.includes(key)) continue;
    stats[key] = {
      total: parseNumber(columns[1]) ?? 0,
      matched: parseNumber(columns[2]) ?? 0,
      mismatched: parseNumber(columns[3]) ?? 0,
      unknownOrUnusable: parseNumber(columns[4]) ?? 0,
    };
  }
  return stats;
}

function createSummary(evidencePath, markdown) {
  const snapshot = parseBroadcastData(markdown, "## Non-PII Repository Evidence Snapshot");
  const directionSample = parseBroadcastData(markdown, "Debug direction sample test broadcast output");
  const directionStats = parseDirectionTable(markdown);
  const isFixture = /validator fixture|Fixture only|37-device-evidence-validator-fixture/i.test(markdown) || evidencePath.includes("validator-fixture");

  const totalTrials = directionKeys.reduce((sum, key) => sum + directionStats[key].total, 0);
  const matched = directionKeys.reduce((sum, key) => sum + directionStats[key].matched, 0);
  const mismatched = directionKeys.reduce((sum, key) => sum + directionStats[key].mismatched, 0);
  const unknownOrUnusable = directionKeys.reduce((sum, key) => sum + directionStats[key].unknownOrUnusable, 0);
  const frontBackTrials = directionStats.front.total + directionStats.back.total;
  const frontBackMatched = directionStats.front.matched + directionStats.back.matched;
  const leftRightTrials = directionStats.left.total + directionStats.right.total;
  const leftRightMatched = directionStats.left.matched + directionStats.right.matched;

  const microphoneMetadata = {
    inventoryCaptured: parseBoolean(snapshot.latestAudioDirectionMicrophoneInventoryCaptured) === true || parseBoolean(directionSample.microphoneInventoryCaptured) === true,
    activeMicrophonesCaptured: parseBoolean(snapshot.latestAudioDirectionActiveMicrophoneCaptured) === true || parseBoolean(directionSample.activeMicrophoneCaptured) === true,
    channelMappingCaptured: (parseNumber(snapshot.latestAudioDirectionActiveChannelMappingCount) ?? parseNumber(directionSample.activeChannelMappingCount) ?? 0) > 0,
    availableMicrophoneCount: parseNumber(snapshot.latestAudioDirectionAvailableMicrophoneCount) ?? parseNumber(directionSample.availableMicrophoneCount),
    activeMicrophoneCount: parseNumber(snapshot.latestAudioDirectionActiveMicrophoneCount) ?? parseNumber(directionSample.activeMicrophoneCount),
    activeChannelMappingCount: parseNumber(snapshot.latestAudioDirectionActiveChannelMappingCount) ?? parseNumber(directionSample.activeChannelMappingCount),
  };

  const aggregateEvaluation = {
    status: "extracted_from_device_evidence",
    evidenceFile: evidencePath,
    totalTrials,
    frontTrials: directionStats.front.total,
    backTrials: directionStats.back.total,
    leftTrials: directionStats.left.total,
    rightTrials: directionStats.right.total,
    allDirectionMatchRate: percent(matched, totalTrials),
    frontBackMatchRate: percent(frontBackMatched, frontBackTrials),
    leftRightMatchRate: percent(leftRightMatched, leftRightTrials),
    falseDirectionRate: percent(mismatched, totalTrials),
    unknownOrUnusableRate: percent(unknownOrUnusable, totalTrials),
    p95DirectionLatencyMillis: null,
    latestProcessingLatencyMillis: parseNumber(snapshot.latestProcessingLatencyMillis),
    averageProcessingLatencyMillis: parseNumber(snapshot.averageProcessingLatencyMillis),
    confidenceBucketed: Boolean(snapshot.latestAudioDirectionConfidenceBucket || directionSample.confidenceBucket),
    latestAudioDirectionEvidenceLevel: snapshot.latestAudioDirectionEvidenceLevel || directionSample.evidenceLevel || "",
    latestAudioDirectionStatus: snapshot.latestAudioDirectionStatus || directionSample.status || "",
    latestAudioDirectionDirection: snapshot.latestAudioDirectionDirection || directionSample.direction || "",
    wearableRouteWithControlledEvidence: null,
    lowestTargetDevice: "android-phone",
  };

  const productionDirectionCandidate = (
    !isFixture &&
    microphoneMetadata.inventoryCaptured &&
    microphoneMetadata.activeMicrophonesCaptured &&
    microphoneMetadata.channelMappingCaptured &&
    totalTrials >= 80 &&
    directionStats.front.total >= 20 &&
    directionStats.back.total >= 20 &&
    directionStats.left.total >= 20 &&
    directionStats.right.total >= 20 &&
    (aggregateEvaluation.allDirectionMatchRate ?? 0) >= 0.85 &&
    (aggregateEvaluation.frontBackMatchRate ?? 0) >= 0.8 &&
    (aggregateEvaluation.leftRightMatchRate ?? 0) >= 0.9 &&
    (aggregateEvaluation.falseDirectionRate ?? 1) <= 0.1 &&
    (aggregateEvaluation.unknownOrUnusableRate ?? 1) <= 0.15
  );

  return {
    schemaVersion: 1,
    generatedAt: kstTimestamp(),
    deviceEvidencePath: evidencePath,
    sourceIsFixture: isFixture,
    privacy: {
      rawAudioPersisted: false,
      pcmPersisted: false,
      transcriptsIncluded: false,
      speakerNamesIncluded: false,
      rawEmbeddingsIncluded: false,
    },
    microphoneMetadata,
    directionStats,
    aggregateEvaluation,
    productionDirectionCandidate,
    nextActions: productionDirectionCandidate
      ? [
          "Review the source device evidence for privacy before copying aggregate values into the direction evidence manifest.",
          "Run scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json after updating the manifest with reviewed aggregate evidence.",
        ]
      : [
          "Collect real controlled front/back/left/right trials on a physical phone and wearable route.",
          "Require at least 20 trials per direction and reviewed microphone metadata before any front/back or four-direction claim.",
          "Do not copy fixture or no-hardware evidence into the production direction manifest.",
        ],
  };
}

function createManifestTemplate(summary) {
  return {
    status: summary.productionDirectionCandidate ? "DIRECTION_EVIDENCE_REVIEW_REQUIRED" : "DRAFT_DIRECTION_EVIDENCE_NOT_COLLECTED",
    updatedAt: summary.generatedAt,
    currentAlgorithm: {
      claimLevel: summary.productionDirectionCandidate ? "FOUR_DIRECTION_CONTROLLED_EVIDENCE" : "LEFT_RIGHT_REFERENCE_ONLY",
      frontBackClaim: summary.productionDirectionCandidate ? "review_required" : "blocked",
    },
    microphoneMetadata: {
      inventoryCaptured: summary.microphoneMetadata.inventoryCaptured,
      activeMicrophonesCaptured: summary.microphoneMetadata.activeMicrophonesCaptured,
      channelMappingCaptured: summary.microphoneMetadata.channelMappingCaptured,
      hardwarePoseOrMountingDocumented: false,
    },
    aggregateEvaluation: {
      ...summary.aggregateEvaluation,
      evidenceFile: path.relative("apps/voice-direction-glass/direction-evidence", summary.deviceEvidencePath).replace(/\\/g, "/"),
      status: summary.productionDirectionCandidate ? "review_required" : "not_ready",
    },
    notes: [
      "Template only. Review privacy and hardware setup before copying into apps/voice-direction-glass/direction-evidence/manifest.json.",
      "Do not mark DIRECTION_EVIDENCE_EVALUATED until strict validation requirements are deliberately met.",
    ],
  };
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push("# Direction Evidence Summary");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Device evidence: ${summary.deviceEvidencePath}`);
  lines.push(`Source is fixture: ${summary.sourceIsFixture}`);
  lines.push(`Production direction candidate: ${summary.productionDirectionCandidate}`);
  lines.push("");
  lines.push("## Aggregate");
  lines.push("");
  lines.push(`- Total trials: ${summary.aggregateEvaluation.totalTrials}`);
  lines.push(`- Front/back match rate: ${summary.aggregateEvaluation.frontBackMatchRate ?? "n/a"}`);
  lines.push(`- Left/right match rate: ${summary.aggregateEvaluation.leftRightMatchRate ?? "n/a"}`);
  lines.push(`- Overall match rate: ${summary.aggregateEvaluation.allDirectionMatchRate ?? "n/a"}`);
  lines.push(`- False direction rate: ${summary.aggregateEvaluation.falseDirectionRate ?? "n/a"}`);
  lines.push(`- Unknown/unusable rate: ${summary.aggregateEvaluation.unknownOrUnusableRate ?? "n/a"}`);
  lines.push("");
  lines.push("## Direction Counts");
  lines.push("");
  lines.push("| Direction | Total | Matched | Mismatched | Unknown/Unusable |");
  lines.push("| --- | ---: | ---: | ---: | ---: |");
  for (const key of directionKeys) {
    const row = summary.directionStats[key];
    lines.push(`| ${key.toUpperCase()} | ${row.total} | ${row.matched} | ${row.mismatched} | ${row.unknownOrUnusable} |`);
  }
  lines.push("");
  lines.push("## Microphone Metadata");
  lines.push("");
  lines.push(`- Inventory captured: ${summary.microphoneMetadata.inventoryCaptured}`);
  lines.push(`- Active microphones captured: ${summary.microphoneMetadata.activeMicrophonesCaptured}`);
  lines.push(`- Channel mapping captured: ${summary.microphoneMetadata.channelMappingCaptured}`);
  lines.push(`- Available microphone count: ${summary.microphoneMetadata.availableMicrophoneCount ?? "n/a"}`);
  lines.push(`- Active microphone count: ${summary.microphoneMetadata.activeMicrophoneCount ?? "n/a"}`);
  lines.push(`- Active channel mapping count: ${summary.microphoneMetadata.activeChannelMappingCount ?? "n/a"}`);
  lines.push("");
  lines.push("## Next Actions");
  lines.push("");
  for (const action of summary.nextActions) lines.push(`- ${action}`);
  lines.push("");
  lines.push("## Privacy Guardrail");
  lines.push("");
  lines.push("This summary stores only aggregate counts, booleans, enums, rates, latency numbers, and workspace-relative paths. It must not include raw audio, PCM, transcripts, speaker names, raw embeddings, Bluetooth device names, MAC addresses, private alert text, or exact locations.");
  return `${lines.join("\n")}\n`;
}

const errors = [];
let summary = null;
let reportDir = null;

try {
  const evidence = resolveInsideWorkspace(evidenceArg);
  reportDir = resolveInsideWorkspace(reportDirArg);
  if (!fs.existsSync(evidence.absolute)) {
    errors.push(`Device evidence file does not exist: ${evidence.relative}`);
  } else {
    const markdown = fs.readFileSync(evidence.absolute, "utf8");
    summary = createSummary(evidence.relative, markdown);
  }
} catch (error) {
  errors.push(error.message);
}

if (summary && reportDir) {
  fs.mkdirSync(reportDir.absolute, { recursive: true });
  fs.writeFileSync(path.join(reportDir.absolute, "direction-evidence-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(path.join(reportDir.absolute, "direction-evidence-summary.md"), renderMarkdown(summary));
  fs.writeFileSync(path.join(reportDir.absolute, "manifest-update-template.json"), `${JSON.stringify(createManifestTemplate(summary), null, 2)}\n`);
}

const result = {
  ok: errors.length === 0,
  reportDir: reportDir?.relative ?? reportDirArg,
  summaryPath: reportDir ? path.join(reportDir.relative, "direction-evidence-summary.json") : "",
  manifestTemplatePath: reportDir ? path.join(reportDir.relative, "manifest-update-template.json") : "",
  productionDirectionCandidate: summary?.productionDirectionCandidate ?? false,
  sourceIsFixture: summary?.sourceIsFixture ?? false,
  errors,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Direction evidence summary written: ${result.summaryPath}`);
} else {
  console.error("Direction evidence extraction failed.");
  for (const error of errors) console.error(`error: ${error}`);
}

process.exit(result.ok ? 0 : 1);
