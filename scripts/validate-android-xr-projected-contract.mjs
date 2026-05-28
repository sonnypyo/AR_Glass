#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_REPORT_DIR = "data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract";
const PLATFORM_FRESHNESS_JSON = "data/runs/20260528_voice_direction_mvp/82-platform-source-freshness/platform-source-freshness.json";

const files = {
  manifest: "apps/voice-direction-glass/app/src/main/AndroidManifest.xml",
  projectedActivity: "apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/app/GlassesProjectedActivity.kt",
  mainActivity: "apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/app/MainActivity.kt",
  stubAdapter: "apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/devices/AndroidXrDisplayStubAdapter.kt",
  engineFactory: "apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/session/AndroidListeningEngineFactory.kt",
  appGradle: "apps/voice-direction-glass/app/build.gradle.kts",
  versionCatalog: "apps/voice-direction-glass/gradle/libs.versions.toml",
  platformFreshnessJson: PLATFORM_FRESHNESS_JSON,
};

const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const wantsWriteReport = args.includes("--write-report");
const requireRealAndroidXr = args.includes("--require-real-android-xr");
const showHelp = args.includes("--help") || args.includes("-h");
const reportDirArg = valueAfter("--report-dir") || DEFAULT_REPORT_DIR;

function usage() {
  return [
    "Usage: scripts/validate-android-xr-projected-contract.mjs [--write-report] [--report-dir DIR] [--require-real-android-xr] [--json]",
    "",
    "Validates the local Android XR projected activity contract without requiring XR hardware.",
    "Default mode accepts the current phone-preview/stub state when it is explicit and source-backed.",
    "Strict mode requires the real ProjectedContext/Glimmer path and should fail until real Android XR integration evidence exists.",
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

function readIfExists(relativePath) {
  const absolute = path.join(ROOT_DIR, relativePath);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute, "utf8") : "";
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT_DIR, relativePath));
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

function loadPlatformFreshness() {
  if (!exists(files.platformFreshnessJson)) {
    return {
      exists: false,
      ok: false,
      generatedAt: "",
      androidXrLastUpdatedUtc: "",
      requiredSourcesOk: false,
      errors: ["Platform freshness JSON is missing."],
    };
  }

  try {
    const parsed = JSON.parse(readIfExists(files.platformFreshnessJson));
    const requiredIds = [
      "android-xr-sdk",
      "android-xr-first-activity",
      "android-xr-projected-hardware",
      "android-xr-support-different-glasses",
    ];
    const sources = parsed.sources ?? [];
    const missing = requiredIds.filter((id) => !sources.some((source) => source.id === id));
    const failing = sources
      .filter((source) => requiredIds.includes(source.id) && source.ok !== true)
      .map((source) => source.id);
    const dates = sources
      .filter((source) => requiredIds.includes(source.id))
      .map((source) => source.lastUpdatedUtc)
      .filter(Boolean)
      .sort();
    return {
      exists: true,
      ok: parsed.ok === true && missing.length === 0 && failing.length === 0,
      generatedAt: parsed.generatedAt ?? "",
      androidXrLastUpdatedUtc: dates.at(-1) ?? "",
      requiredSourcesOk: missing.length === 0 && failing.length === 0,
      canonicalFirstActivity: parsed.canonicalAndroidXrFirstActivity ?? "",
      errors: [
        ...missing.map((id) => `Missing platform source summary: ${id}`),
        ...failing.map((id) => `Failing platform source summary: ${id}`),
        ...(parsed.ok === true ? [] : ["Platform freshness summary is not ok."]),
      ],
    };
  } catch (error) {
    return {
      exists: true,
      ok: false,
      generatedAt: "",
      androidXrLastUpdatedUtc: "",
      requiredSourcesOk: false,
      errors: [`Could not parse platform freshness JSON: ${error.message}`],
    };
  }
}

function buildSummary() {
  const manifest = readIfExists(files.manifest);
  const projectedActivity = readIfExists(files.projectedActivity);
  const mainActivity = readIfExists(files.mainActivity);
  const stubAdapter = readIfExists(files.stubAdapter);
  const engineFactory = readIfExists(files.engineFactory);
  const gradleText = `${readIfExists(files.appGradle)}\n${readIfExists(files.versionCatalog)}`;
  const platformFreshness = loadPlatformFreshness();

  const manifestDeclaresProjectedActivity = manifest.includes(".app.GlassesProjectedActivity");
  const manifestHasProjectedCategory = manifest.includes('android:requiredDisplayCategory="xr_projected"');
  const projectedActivityExists = exists(files.projectedActivity) &&
    projectedActivity.includes("class GlassesProjectedActivity") &&
    projectedActivity.includes("GlassesCueScreen");
  const localPreviewLaunchExists = mainActivity.includes("startActivity(Intent(this, GlassesProjectedActivity::class.java))");
  const projectedOptionsUsed = mainActivity.includes("ProjectedContext.createProjectedActivityOptions") ||
    projectedActivity.includes("ProjectedContext.createProjectedActivityOptions") ||
    engineFactory.includes("ProjectedContext.createProjectedActivityOptions");
  const projectedDeviceContextUsed = mainActivity.includes("ProjectedContext.createProjectedDeviceContext") ||
    projectedActivity.includes("ProjectedContext.createProjectedDeviceContext") ||
    engineFactory.includes("ProjectedContext.createProjectedDeviceContext");
  const xrDependencyConfigured = /androidx\.xr|jetpack.*xr|xr[-.]projected/i.test(gradleText);
  const glimmerDependencyConfigured = /glimmer/i.test(gradleText);
  const stubAdapterExists = exists(files.stubAdapter) && stubAdapter.includes("class AndroidXrDisplayStubAdapter");
  const factoryUsesStubAdapter = engineFactory.includes("AndroidXrDisplayStubAdapter()");
  const realAdapterCandidate = xrDependencyConfigured &&
    glimmerDependencyConfigured &&
    projectedOptionsUsed &&
    projectedDeviceContextUsed &&
    !factoryUsesStubAdapter;
  const phonePreviewOnly = manifestDeclaresProjectedActivity &&
    manifestHasProjectedCategory &&
    projectedActivityExists &&
    localPreviewLaunchExists &&
    stubAdapterExists &&
    factoryUsesStubAdapter &&
    !realAdapterCandidate;

  const errors = [];
  if (!manifestDeclaresProjectedActivity) errors.push("AndroidManifest.xml does not declare GlassesProjectedActivity.");
  if (!manifestHasProjectedCategory) errors.push('AndroidManifest.xml is missing android:requiredDisplayCategory="xr_projected".');
  if (!projectedActivityExists) errors.push("GlassesProjectedActivity source or cue screen render path is missing.");
  if (!stubAdapterExists) errors.push("AndroidXrDisplayStubAdapter source is missing.");
  if (!factoryUsesStubAdapter && !realAdapterCandidate) {
    errors.push("AndroidListeningEngineFactory no longer uses the Android XR stub, but real ProjectedContext criteria are not satisfied.");
  }
  if (!platformFreshness.ok) errors.push(...platformFreshness.errors);

  const strictErrors = [];
  if (!xrDependencyConfigured) strictErrors.push("Jetpack XR dependency is not configured.");
  if (!glimmerDependencyConfigured) strictErrors.push("Compose Glimmer dependency is not configured.");
  if (!projectedOptionsUsed) strictErrors.push("ProjectedContext.createProjectedActivityOptions is not used by the app launch path.");
  if (!projectedDeviceContextUsed) strictErrors.push("ProjectedContext.createProjectedDeviceContext is not used for projected-device hardware access.");
  if (factoryUsesStubAdapter) strictErrors.push("AndroidXrDisplayStubAdapter is still active in AndroidListeningEngineFactory.");

  if (requireRealAndroidXr) {
    errors.push(...strictErrors);
  }

  const warnings = [
    ...(phonePreviewOnly
      ? ["Current Android XR path is phone-hosted preview plus stub adapter; it is valid workflow evidence, not real XR runtime proof."]
      : []),
    ...(!projectedOptionsUsed
      ? ["Real projected launch must use ProjectedContext.createProjectedActivityOptions before Android XR alpha claims."]
      : []),
    ...(!projectedDeviceContextUsed
      ? ["Real glasses microphone/camera access must use ProjectedContext.createProjectedDeviceContext or a documented Bluetooth fallback before Android XR hardware claims."]
      : []),
  ];

  return {
    ok: errors.length === 0,
    generatedAt: kstTimestamp(),
    reportDir: reportDirArg,
    strictRealAndroidXrRequired: requireRealAndroidXr,
    currentMode: realAdapterCandidate ? "real_projected_candidate" : "phone_preview_stub",
    phonePreviewOnly,
    realAndroidXrCandidate: realAdapterCandidate && strictErrors.length === 0,
    platformFreshness,
    localContract: {
      manifest: files.manifest,
      projectedActivity: files.projectedActivity,
      mainActivity: files.mainActivity,
      stubAdapter: files.stubAdapter,
      engineFactory: files.engineFactory,
      manifestDeclaresProjectedActivity,
      manifestHasProjectedCategory,
      projectedActivityExists,
      localPreviewLaunchExists,
      projectedOptionsUsed,
      projectedDeviceContextUsed,
      xrDependencyConfigured,
      glimmerDependencyConfigured,
      stubAdapterExists,
      factoryUsesStubAdapter,
    },
    strictRealAndroidXrMissing: strictErrors,
    warnings,
    errors,
    privacyGuardrail: "This summary stores only booleans, paths, source ids, and dates. It must not include raw audio, transcripts, speaker names, Bluetooth names, MAC addresses, private alert text, embeddings, or projected display screenshots.",
  };
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function renderMarkdown(summary) {
  const rows = [
    ["Manifest declares GlassesProjectedActivity", summary.localContract.manifestDeclaresProjectedActivity],
    ['Manifest has android:requiredDisplayCategory="xr_projected"', summary.localContract.manifestHasProjectedCategory],
    ["GlassesProjectedActivity renders cue screen", summary.localContract.projectedActivityExists],
    ["Phone preview launch exists", summary.localContract.localPreviewLaunchExists],
    ["ProjectedContext.createProjectedActivityOptions used", summary.localContract.projectedOptionsUsed],
    ["ProjectedContext.createProjectedDeviceContext used", summary.localContract.projectedDeviceContextUsed],
    ["Jetpack XR dependency configured", summary.localContract.xrDependencyConfigured],
    ["Compose Glimmer dependency configured", summary.localContract.glimmerDependencyConfigured],
    ["Android XR stub adapter active", summary.localContract.factoryUsesStubAdapter],
    ["Platform freshness summary ok", summary.platformFreshness.ok],
  ];

  const lines = [];
  lines.push("# Android XR Projected Contract Validation");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Mode: ${summary.currentMode}`);
  lines.push(`Result: ${summary.ok ? "pass" : "fail"}`);
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  if (summary.realAndroidXrCandidate) {
    lines.push("The local project satisfies the strict real Android XR projected-contract shape. Hardware evidence is still required before a glasses alpha claim.");
  } else {
    lines.push("The local project is a phone-hosted projected preview with an Android XR stub adapter. This is valid workflow evidence only, not real Android XR runtime proof.");
  }
  lines.push("");
  lines.push("## Contract Checks");
  lines.push("");
  lines.push("| Check | Status |");
  lines.push("| --- | --- |");
  for (const [label, pass] of rows) {
    lines.push(`| ${escapeCell(label)} | ${pass ? "pass" : "not ready"} |`);
  }
  lines.push("");
  lines.push("## Platform Source Basis");
  lines.push("");
  lines.push(`- Freshness report: \`${files.platformFreshnessJson}\``);
  lines.push(`- Freshness generated: ${summary.platformFreshness.generatedAt || "missing"}`);
  lines.push(`- Android XR latest source date: ${summary.platformFreshness.androidXrLastUpdatedUtc || "missing"}`);
  lines.push(`- Canonical first activity: ${summary.platformFreshness.canonicalFirstActivity || "missing"}`);
  lines.push("");
  lines.push("## Strict Android XR Missing Items");
  lines.push("");
  if (summary.strictRealAndroidXrMissing.length === 0) {
    lines.push("- None.");
  } else {
    for (const item of summary.strictRealAndroidXrMissing) {
      lines.push(`- ${item}`);
    }
  }
  lines.push("");
  lines.push("## Warnings");
  lines.push("");
  if (summary.warnings.length === 0) {
    lines.push("- None.");
  } else {
    for (const warning of summary.warnings) {
      lines.push(`- ${warning}`);
    }
  }
  lines.push("");
  lines.push("## Errors");
  lines.push("");
  if (summary.errors.length === 0) {
    lines.push("- None.");
  } else {
    for (const error of summary.errors) {
      lines.push(`- ${error}`);
    }
  }
  lines.push("");
  lines.push("## Privacy Guardrail");
  lines.push("");
  lines.push(summary.privacyGuardrail);
  lines.push("");
  return lines.join("\n");
}

const reportDir = resolveInsideWorkspace(reportDirArg);
const summary = buildSummary();
summary.reportPath = path.join(reportDir.relative, "android-xr-projected-contract.md");
summary.summaryJsonPath = path.join(reportDir.relative, "android-xr-projected-contract.json");

if (wantsWriteReport) {
  fs.mkdirSync(reportDir.absolute, { recursive: true });
  fs.writeFileSync(path.join(reportDir.absolute, "android-xr-projected-contract.md"), renderMarkdown(summary));
  fs.writeFileSync(path.join(reportDir.absolute, "android-xr-projected-contract.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

if (wantsJson) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(renderMarkdown(summary));
}

process.exit(summary.ok ? 0 : 1);
