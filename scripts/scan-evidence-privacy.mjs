#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_TARGETS = [
  "data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack",
  "data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard",
  "data/runs/20260528_voice_direction_mvp/52-service-readiness-audit",
  "data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session",
  "data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md",
];
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan";
const TEXT_EXTENSIONS = new Set([".md", ".json", ".txt", ".sh", ".log"]);
const SKIP_DIRS = new Set([
  ".git",
  ".gradle",
  ".idea",
  "build",
  "node_modules",
  "derived-data",
]);
const REDACTED_VALUE_PATTERN = /^(?:\[?redacted\]?|redacted-by-script|redacted-by-fixture|fixture|unknown)$/i;
const SAFE_EMPTY_VALUE_PATTERN = /^(?:\[?redacted\]?|redacted-by-script|redacted-by-fixture|fixture|unknown|no|none|not\s+(?:captured|collected|present|stored|run|available|configured)|false|missing|manual(?:-required)?|unavailable|n\/a|-)?$/i;

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const wantsWrite = args.includes("--write-report");
const showHelp = args.includes("--help") || args.includes("-h");
const reportDirArg = valueAfter("--report-dir");
const targetArgs = args.filter((arg, index) => {
  if (arg.startsWith("--")) return false;
  return args[index - 1] !== "--report-dir";
});

function usage() {
  return [
    "Usage: scripts/scan-evidence-privacy.mjs [paths...] [--write-report] [--report-dir DIR] [--json]",
    "",
    "Scans generated evidence/report folders for private voice, device, Bluetooth, and token-like fields.",
    "The scan reports only file paths, line numbers, and rule ids; it does not print matched private text.",
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

function resolveTarget(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.join(ROOT_DIR, inputPath);
}

function displayPath(absolutePath) {
  const relative = path.relative(ROOT_DIR, absolutePath);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
    return relative;
  }
  return absolutePath;
}

function isTextLikeFile(absolutePath) {
  return TEXT_EXTENSIONS.has(path.extname(absolutePath).toLowerCase());
}

function listTextFiles(startPath, warnings) {
  if (!fs.existsSync(startPath)) {
    warnings.push({
      target: displayPath(startPath),
      warning: "target-missing",
    });
    return [];
  }

  const stat = fs.statSync(startPath);
  if (startPath.startsWith("/dev/fd/")) {
    return [startPath];
  }

  if (stat.isFile()) {
    if (isTextLikeFile(startPath)) {
      return [startPath];
    }
    warnings.push({
      target: displayPath(startPath),
      warning: "target-not-text-like",
    });
    return [];
  }

  if (!stat.isDirectory()) {
    warnings.push({
      target: displayPath(startPath),
      warning: "target-not-file-or-directory",
    });
    return [];
  }

  const files = [];
  const stack = [startPath];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          stack.push(absolute);
        }
      } else if (entry.isFile() && isTextLikeFile(absolute)) {
        files.push(absolute);
      }
    }
  }
  return files.sort((a, b) => displayPath(a).localeCompare(displayPath(b)));
}

function fieldValue(line, pattern) {
  const match = line.match(pattern);
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : null;
}

function hasUnsafeStructuredValue(line, pattern) {
  const value = fieldValue(line, pattern);
  return value !== null && !SAFE_EMPTY_VALUE_PATTERN.test(value);
}

function violation(file, line, ruleId) {
  return {
    file: displayPath(file),
    line,
    ruleId,
  };
}

const structuredRules = [
  { ruleId: "private-transcript-field", pattern: /["']?\btranscript\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-speaker-field", pattern: /["']?\bspeaker(?:Name|Label|Text)?\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-caller-field", pattern: /["']?\bcaller(?:Name|Label)\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-profile-field", pattern: /["']?\bprofile(?:Name|Label)\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-phrase-field", pattern: /["']?\bphrase\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-embedding-field", pattern: /["']?\bembedding\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-pcm-field", pattern: /["']?\bpcm\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-raw-audio-field", pattern: /["']?\braw(?:Audio|Pcm)\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-audio-bytes-field", pattern: /["']?\baudioBytes\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-bluetooth-product-name-field", pattern: /["']?\bproductName\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-bluetooth-device-name-field", pattern: /["']?\bdeviceName\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-bluetooth-owner-field", pattern: /["']?\bowner\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-bluetooth-mac-field", pattern: /["']?\bmac(?:Address)?\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-bluetooth-address-field", pattern: /["']?\baddress\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-application-id-field", pattern: /["']?\bapplicationId\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
  { ruleId: "private-token-field", pattern: /["']?\b(?:githubToken|token)\b["']?\s*[:=]\s*([^,\]|}#]+)/i },
];

function scanFile(file) {
  const violations = [];
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);

  const legacyPathDeviceLabel = displayPath(file).match(/[\\/]\d{8}_\d{6}_([^\\/]+)_android_phone_smoke[\\/]/)?.[1];
  if (legacyPathDeviceLabel) {
    violations.push(violation(file, 0, "legacy-adb-labeled-evidence-path"));
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    const serialValue = fieldValue(line, /-\s*Device serial:\s*([^\n]+)/i);
    if (serialValue !== null && !REDACTED_VALUE_PATTERN.test(serialValue)) {
      violations.push(violation(file, lineNumber, "device-serial-metadata"));
    }

    const fingerprintValue = fieldValue(line, /-\s*Build fingerprint:\s*([^\n]+)/i);
    if (fingerprintValue !== null && !REDACTED_VALUE_PATTERN.test(fingerprintValue)) {
      violations.push(violation(file, lineNumber, "build-fingerprint-metadata"));
    }

    if (/\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i.test(line)) {
      violations.push(violation(file, lineNumber, "mac-address"));
    }

    if (/\benc:v\d+:/i.test(line)) {
      violations.push(violation(file, lineNumber, "private-encrypted-payload"));
    }

    for (const rule of structuredRules) {
      if (hasUnsafeStructuredValue(line, rule.pattern)) {
        violations.push(violation(file, lineNumber, rule.ruleId));
      }
    }
  });

  return violations;
}

function renderMarkdown(result) {
  const lines = [];
  lines.push("# Evidence Privacy Scan");
  lines.push("");
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("This scan checks generated evidence and report folders for private device, voice, Bluetooth, account, and raw-audio fields before those artifacts are used in promotion review.");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Result: ${result.ok ? "pass" : "fail"}`);
  lines.push(`- Files scanned: ${result.filesScanned}`);
  lines.push(`- Violations: ${result.violations.length}`);
  lines.push(`- Warnings: ${result.warnings.length}`);
  lines.push("");
  lines.push("## Targets");
  lines.push("");
  for (const target of result.targets) {
    lines.push(`- ${target}`);
  }
  lines.push("");
  lines.push("## Violations");
  lines.push("");
  if (result.violations.length === 0) {
    lines.push("- none");
  } else {
    lines.push("| File | Line | Rule |");
    lines.push("| --- | ---: | --- |");
    for (const item of result.violations) {
      lines.push(`| ${escapeCell(item.file)} | ${item.line} | ${item.ruleId} |`);
    }
  }
  lines.push("");
  lines.push("## Warnings");
  lines.push("");
  if (result.warnings.length === 0) {
    lines.push("- none");
  } else {
    lines.push("| Target | Warning |");
    lines.push("| --- | --- |");
    for (const item of result.warnings) {
      lines.push(`| ${escapeCell(item.target)} | ${escapeCell(item.warning)} |`);
    }
  }
  lines.push("");
  lines.push("## Privacy Guardrail");
  lines.push("");
  lines.push(result.privacyGuardrail);
  lines.push("");
  lines.push("## Trial/Error Notes");
  lines.push("");
  lines.push("- The device evidence validator catches a single generated `device-evidence.md`; this scan catches copied identifiers or private fields that appear in surrounding operator, dashboard, audit, or summary folders.");
  lines.push("- The report intentionally omits matched text so the privacy report cannot become a second copy of the private value.");
  return `${lines.join("\n")}\n`;
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|");
}

function createResult() {
  const targets = (targetArgs.length > 0 ? targetArgs : DEFAULT_TARGETS).map(resolveTarget);
  const warnings = [];
  const files = [...new Set(targets.flatMap((target) => listTextFiles(target, warnings)))];
  const violations = files.flatMap(scanFile);
  return {
    ok: violations.length === 0,
    generatedAt: kstTimestamp(),
    targets: targets.map(displayPath),
    filesScanned: files.length,
    violations,
    warnings,
    reportPath: wantsWrite ? path.join(displayPath(resolveTarget(reportDirArg || DEFAULT_REPORT_DIR)), "evidence-privacy-scan.md") : null,
    summaryJsonPath: wantsWrite ? path.join(displayPath(resolveTarget(reportDirArg || DEFAULT_REPORT_DIR)), "evidence-privacy-scan.json") : null,
    privacyGuardrail: "Scanner output includes only file paths, line numbers, rule ids, counts, and missing-target warnings. It does not print matched private strings, transcripts, speaker names, embeddings, encrypted payloads, Bluetooth names, MAC addresses, tokens, or raw audio values.",
  };
}

const result = createResult();

if (wantsWrite) {
  const reportDir = resolveTarget(reportDirArg || DEFAULT_REPORT_DIR);
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, "evidence-privacy-scan.md");
  const summaryJsonPath = path.join(reportDir, "evidence-privacy-scan.json");
  fs.writeFileSync(reportPath, renderMarkdown(result));
  fs.writeFileSync(summaryJsonPath, `${JSON.stringify(result, null, 2)}\n`);
  result.reportPath = displayPath(reportPath);
  result.summaryJsonPath = displayPath(summaryJsonPath);
  if (!wantsJson) {
    console.log(`Evidence privacy scan written: ${reportPath}`);
  }
}

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (!wantsWrite) {
  process.stdout.write(renderMarkdown(result));
}

process.exit(result.ok ? 0 : 1);
