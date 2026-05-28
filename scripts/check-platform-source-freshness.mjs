#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/82-platform-source-freshness";
const CANONICAL_ANDROID_XR_FIRST_ACTIVITY = "https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity";
const DEPRECATED_ANDROID_XR_FIRST_ACTIVITY = "https://developer.android.com/develop/xr/jetpack-xr-sdk/ai-glasses/first-activity";
const META_DAT_LIFECYCLE = "https://wearables.developer.meta.com/docs/develop/dat/lifecycle-events/";

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const wantsWriteReport = args.includes("--write-report");
const showHelp = args.includes("--help") || args.includes("-h");
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;

const sources = [
  {
    id: "meta-wearables-develop",
    label: "Meta Wearables develop docs",
    url: "https://wearables.developer.meta.com/docs/develop",
    expectedFinalUrl: "https://wearables.developer.meta.com/docs/develop",
    allowLoginGate: true,
  },
  {
    id: "meta-dat-android-github",
    label: "Meta DAT Android GitHub",
    url: "https://github.com/facebook/meta-wearables-dat-android",
    expectedFinalUrl: "https://github.com/facebook/meta-wearables-dat-android",
    requiredText: ["meta-wearables-dat-android"],
  },
  {
    id: "meta-dat-lifecycle",
    label: "Meta DAT lifecycle",
    url: META_DAT_LIFECYCLE,
    expectedFinalUrl: META_DAT_LIFECYCLE,
    allowLoginGate: true,
  },
  {
    id: "android-xr-sdk",
    label: "Android XR Jetpack XR SDK",
    url: "https://developer.android.com/develop/xr/jetpack-xr-sdk?hl=en",
    expectedFinalUrl: "https://developer.android.com/develop/xr/jetpack-xr-sdk",
    requiredText: ["Android XR", "Jetpack XR SDK"],
  },
  {
    id: "android-xr-first-activity",
    label: "Android XR glasses first activity",
    url: `${CANONICAL_ANDROID_XR_FIRST_ACTIVITY}?hl=en`,
    expectedFinalUrl: CANONICAL_ANDROID_XR_FIRST_ACTIVITY,
    requiredText: ["createProjectedActivityOptions", "Glimmer"],
  },
  {
    id: "android-xr-first-activity-deprecated-alias",
    label: "Deprecated Android XR ai-glasses first activity alias",
    url: `${DEPRECATED_ANDROID_XR_FIRST_ACTIVITY}?hl=en`,
    expectedFinalUrl: CANONICAL_ANDROID_XR_FIRST_ACTIVITY,
    requiredText: ["createProjectedActivityOptions"],
    aliasOnly: true,
  },
  {
    id: "android-xr-projected-hardware",
    label: "Android XR projected hardware access",
    url: "https://developer.android.com/develop/xr/jetpack-xr-sdk/access-hardware-projected-context?hl=en",
    expectedFinalUrl: "https://developer.android.com/develop/xr/jetpack-xr-sdk/access-hardware-projected-context",
    requiredText: ["projected context", "hardware"],
  },
  {
    id: "android-xr-support-different-glasses",
    label: "Android XR support different glasses",
    url: "https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/support-different-types?hl=en",
    expectedFinalUrl: "https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/support-different-types",
    requiredText: ["audio glasses", "display glasses"],
  },
];

const filesThatMustUseCanonicalFirstActivity = [
  "docs/01-platform-research.md",
  "docs/11-glasses-integration-preflight.md",
  "docs/24-glasses-setup-readiness.md",
  "docs/25-glasses-hardware-evidence.md",
  "scripts/validate-glasses-setup-readiness.mjs",
  "scripts/validate-glasses-hardware-evidence.mjs",
  "scripts/glasses-integration-preflight.sh",
];

function usage() {
  return [
    "Usage: scripts/check-platform-source-freshness.mjs [--write-report] [--report-dir DIR] [--json]",
    "",
    "Checks critical Meta Wearables and Android XR source URLs without storing source page bodies.",
    "The report stores status, final URL, redirect state, optional Last updated text, and local canonical-reference checks only.",
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

function normalizeUrl(value) {
  const text = String(value ?? "");
  let parsed = null;
  try {
    parsed = new URL(text);
  } catch {
    return text.replace(/\/$/, "");
  }
  parsed.searchParams.delete("hl");
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

function extractTitle(text) {
  const match = text.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function extractLastUpdated(text) {
  return text.match(/Last updated\s+([0-9]{4}-[0-9]{2}-[0-9]{2})\s+UTC/i)?.[1] ?? "";
}

async function fetchSource(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(source.url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "VoiceDirectionGlassSourceFreshness/1.0",
      },
    });
    const text = await response.text();
    const finalUrl = response.url;
    const finalMatches = !source.expectedFinalUrl ||
      normalizeUrl(finalUrl) === normalizeUrl(source.expectedFinalUrl);
    const requiredTextMissing = (source.requiredText ?? []).filter((marker) => !text.includes(marker));
    const loginGateDetected = /#\s*Not Logged In|Please log in to see this page/i.test(text);
    const ok = response.ok &&
      finalMatches &&
      requiredTextMissing.length === 0 &&
      (!loginGateDetected || source.allowLoginGate === true);
    return {
      id: source.id,
      label: source.label,
      url: source.url,
      expectedFinalUrl: source.expectedFinalUrl,
      finalUrl,
      status: response.status,
      redirected: normalizeUrl(finalUrl) !== normalizeUrl(source.url),
      loginGateDetected,
      aliasOnly: source.aliasOnly === true,
      title: extractTitle(text),
      lastUpdatedUtc: extractLastUpdated(text),
      ok,
      errors: [
        ...(response.ok ? [] : [`HTTP ${response.status}`]),
        ...(finalMatches ? [] : [`Final URL mismatch: ${finalUrl}`]),
        ...requiredTextMissing.map((marker) => `Missing marker: ${marker}`),
        ...(!source.allowLoginGate && loginGateDetected ? ["Unexpected login gate."] : []),
      ],
    };
  } catch (error) {
    return {
      id: source.id,
      label: source.label,
      url: source.url,
      expectedFinalUrl: source.expectedFinalUrl,
      finalUrl: "",
      status: 0,
      redirected: false,
      loginGateDetected: false,
      aliasOnly: source.aliasOnly === true,
      title: "",
      lastUpdatedUtc: "",
      ok: false,
      errors: [error.name === "AbortError" ? "Request timed out." : error.message],
    };
  } finally {
    clearTimeout(timeout);
  }
}

function localReferenceChecks() {
  return filesThatMustUseCanonicalFirstActivity.map((relativePath) => {
    const absolute = path.join(ROOT_DIR, relativePath);
    if (!fs.existsSync(absolute)) {
      return {
        path: relativePath,
        exists: false,
        hasCanonicalFirstActivity: false,
        hasDeprecatedFullFirstActivityUrl: false,
        ok: false,
        errors: ["File missing."],
      };
    }
    const text = fs.readFileSync(absolute, "utf8");
    const hasCanonicalFirstActivity = text.includes(CANONICAL_ANDROID_XR_FIRST_ACTIVITY);
    const hasDeprecatedFullFirstActivityUrl = text.includes(DEPRECATED_ANDROID_XR_FIRST_ACTIVITY);
    return {
      path: relativePath,
      exists: true,
      hasCanonicalFirstActivity,
      hasDeprecatedFullFirstActivityUrl,
      ok: hasCanonicalFirstActivity && !hasDeprecatedFullFirstActivityUrl,
      errors: [
        ...(hasCanonicalFirstActivity ? [] : ["Missing canonical Android XR first-activity URL."]),
        ...(hasDeprecatedFullFirstActivityUrl ? ["Contains deprecated ai-glasses first-activity URL."] : []),
      ],
    };
  });
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function renderReport(summary) {
  const lines = [];
  lines.push("# Platform Source Freshness");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push("");
  lines.push("## Purpose");
  lines.push("");
  lines.push("This report checks critical official Meta Wearables and Android XR source URLs used by Voice Direction Glass. It stores only status, redirect, final URL, page title, Last updated date when available, and local canonical-reference checks. It does not store source page bodies or credentials.");
  lines.push("");
  lines.push("## Source Checks");
  lines.push("");
  lines.push("| Source | OK | HTTP | Redirected | Login Gate | Last Updated UTC | Final URL |");
  lines.push("| --- | --- | ---: | --- | --- | --- | --- |");
  for (const source of summary.sources) {
    lines.push(`| ${escapeCell(source.label)} | ${source.ok ? "yes" : "no"} | ${source.status} | ${source.redirected ? "yes" : "no"} | ${source.loginGateDetected ? "yes" : "no"} | ${source.lastUpdatedUtc || "-"} | ${escapeCell(source.finalUrl || "-")} |`);
  }
  lines.push("");
  lines.push("## Local Canonical Reference Checks");
  lines.push("");
  lines.push("| File | OK | Canonical URL | Deprecated Full URL |");
  lines.push("| --- | --- | --- | --- |");
  for (const check of summary.localReferenceChecks) {
    lines.push(`| ${escapeCell(check.path)} | ${check.ok ? "yes" : "no"} | ${check.hasCanonicalFirstActivity ? "yes" : "no"} | ${check.hasDeprecatedFullFirstActivityUrl ? "yes" : "no"} |`);
  }
  lines.push("");
  lines.push("## Current Finding");
  lines.push("");
  lines.push(`- Android XR first-activity canonical URL: ${CANONICAL_ANDROID_XR_FIRST_ACTIVITY}`);
  lines.push(`- Deprecated alias checked: ${DEPRECATED_ANDROID_XR_FIRST_ACTIVITY}`);
  lines.push("- Meta Wearables pages may return a login gate; that is acceptable only for Meta authenticated documentation checks and still means account review is required before live DAT work.");
  lines.push("");
  lines.push("## Next Actions");
  lines.push("");
  for (const action of summary.nextActions) {
    lines.push(`- ${action}`);
  }
  return `${lines.join("\n")}\n`;
}

function nextActions(summary) {
  const actions = [];
  if (!summary.ok) {
    actions.push("Fix failed source or local canonical-reference rows before editing Meta DAT or Android XR integration code.");
  }
  if (summary.sources.some((source) => source.loginGateDetected)) {
    actions.push("Review Meta Wearables authenticated docs in the logged-in developer account before replacing stub adapters.");
  }
  actions.push("Regenerate this report after platform docs, source URLs, SDK dependencies, or release-gate assumptions change.");
  actions.push("Keep `docs/01-platform-research.md`, `docs/24-glasses-setup-readiness.md`, and `docs/25-glasses-hardware-evidence.md` synchronized with this report.");
  return actions;
}

const fetchedSources = await Promise.all(sources.map(fetchSource));
const references = localReferenceChecks();
const summary = {
  ok: fetchedSources.every((source) => source.ok) && references.every((check) => check.ok),
  generatedAt: kstTimestamp(),
  reportDir: reportDirArg,
  reportPath: path.join(reportDirArg, "platform-source-freshness.md"),
  summaryJsonPath: path.join(reportDirArg, "platform-source-freshness.json"),
  canonicalAndroidXrFirstActivity: CANONICAL_ANDROID_XR_FIRST_ACTIVITY,
  deprecatedAndroidXrFirstActivityAlias: DEPRECATED_ANDROID_XR_FIRST_ACTIVITY,
  sources: fetchedSources,
  localReferenceChecks: references,
};
summary.nextActions = nextActions(summary);

if (wantsWriteReport) {
  const { absolute } = resolveInsideWorkspace(reportDirArg);
  fs.mkdirSync(absolute, { recursive: true });
  fs.writeFileSync(path.join(absolute, "platform-source-freshness.md"), renderReport(summary));
  fs.writeFileSync(path.join(absolute, "platform-source-freshness.json"), `${JSON.stringify(summary, null, 2)}\n`);
  if (!wantsJson) {
    console.log(`Platform source freshness report written: ${path.join(absolute, "platform-source-freshness.md")}`);
  }
}

if (wantsJson) {
  console.log(JSON.stringify(summary, null, 2));
} else if (!wantsWriteReport) {
  process.stdout.write(renderReport(summary));
}

process.exit(summary.ok ? 0 : 1);
