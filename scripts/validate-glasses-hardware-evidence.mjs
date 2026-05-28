#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const requireGlassesAlphaReady = args.includes("--require-glasses-alpha-ready");
const manifestDirArg = args.find((arg) => !arg.startsWith("--")) || "apps/voice-direction-glass/glasses-evidence";

const docPath = "docs/25-glasses-hardware-evidence.md";
const requiredSections = [
  "Purpose",
  "Official Source Snapshot",
  "Current App State",
  "Hardware Evidence Manifest",
  "Meta Ray-Ban Display Proof",
  "Ray-Ban Meta Gen 1 Fallback Proof",
  "Android XR Projected Proof",
  "Haptics Evidence",
  "Validation Command",
  "Release Gate",
  "Trial/Error Notes",
];
const requiredMarkers = [
  "Glasses hardware evidence status: NOT_COLLECTED",
  "DRAFT_GLASSES_HARDWARE_EVIDENCE_NOT_COLLECTED",
  "apps/voice-direction-glass/glasses-evidence/manifest.json",
  "MetaDatDisplayStubAdapter",
  "AndroidXrDisplayStubAdapter",
  "node scripts/validate-glasses-hardware-evidence.mjs --json",
  "node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json",
  "Phone vibration fallback remains the current MVP output",
];
const requiredUrls = [
  "https://wearables.developer.meta.com/docs/develop",
  "https://github.com/facebook/meta-wearables-dat-android",
  "https://wearables.developer.meta.com/docs/develop/dat/lifecycle-events/",
  "https://developer.android.com/develop/xr/jetpack-xr-sdk",
  "https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity",
  "https://developer.android.com/develop/xr/jetpack-xr-sdk/access-hardware-projected-context",
  "https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/support-different-types",
];
const prohibitedClaims = [
  "Glasses hardware evidence status: READY",
  "glasses private alpha is ready",
  "Ray-Ban Display ready",
  "Android XR projected ready",
  "per-side haptics ready",
  "external submission performed",
];
const privacyFalseFields = [
  "rawAudioSaved",
  "pcmSaved",
  "transcriptsIncluded",
  "speakerNamesIncluded",
  "contactNamesIncluded",
  "voiceEmbeddingsIncluded",
  "encryptedPayloadsIncluded",
  "bluetoothOwnerNamesIncluded",
  "bluetoothProductNamesIncluded",
  "macAddressesIncluded",
  "privateAlertTextIncluded",
  "privateLocationsIncluded",
];
const allowedEvidenceStatuses = new Set(["not_collected", "passed", "failed", "documented_unavailable"]);
const allowedHapticsStatuses = new Set(["documented_not_available", "passed", "failed"]);

function usage() {
  return [
    "Usage: scripts/validate-glasses-hardware-evidence.mjs [manifest-dir] [--json] [--require-glasses-alpha-ready]",
    "",
    "Validates the glasses hardware evidence runbook and manifest.",
    "Default mode validates the draft. Strict mode requires real Meta/Ray-Ban/Android XR evidence paths and pass fields.",
  ].join("\n");
}

if (showHelp) {
  console.log(usage());
  process.exit(0);
}

function resolveInsideWorkspace(value) {
  const absolute = path.isAbsolute(value) ? value : path.join(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to read outside workspace: ${absolute}`);
  }
  return { absolute, relative };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasSection(markdown, title) {
  return new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`, "m").test(markdown);
}

function booleanValue(value) {
  return typeof value === "boolean" ? value : null;
}

function collectStringValues(value, values = []) {
  if (typeof value === "string") {
    values.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStringValues(item, values);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStringValues(item, values);
  }
  return values;
}

function resolveEvidencePath(value, label, errors) {
  if (!value) {
    errors.push(`${label} evidencePath is required in strict mode.`);
    return null;
  }
  if (path.isAbsolute(value) || String(value).includes("..")) {
    errors.push(`${label} evidencePath must be workspace-relative without '..'.`);
    return null;
  }
  const absolute = path.join(ROOT_DIR, value);
  const relative = path.relative(ROOT_DIR, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    errors.push(`${label} evidencePath must stay inside the workspace.`);
    return null;
  }
  if (!fs.existsSync(absolute)) {
    errors.push(`${label} evidence file does not exist: ${relative}`);
    return null;
  }
  return absolute;
}

function scanEvidenceFile(absolute, label, errors, warnings) {
  if (!absolute) return;
  const text = fs.readFileSync(absolute, "utf8");
  const privatePatterns = [
    /embedding:v1:/i,
    /enc:v\d+:/i,
    /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,
    /\braw\s*audio\b/i,
    /\bpcm\s*buffer\b/i,
    /\btranscript\s*:/i,
    /\bspeaker\s*name\s*:/i,
    /\bcontact\s*name\s*:/i,
    /\bbluetooth\s*(?:owner|device|product)\s*name\s*:/i,
    /\bprivate\s*location\s*:/i,
  ];
  for (const pattern of privatePatterns) {
    if (pattern.test(text)) {
      errors.push(`${label} evidence file appears to contain private or raw evidence matching ${pattern}.`);
    }
  }
  if (!/pass|passed|fail|failed|status|blocked/i.test(text)) {
    warnings.push(`${label} evidence file should record pass/fail/status fields.`);
  }
}

const errors = [];
const warnings = [];
const { absolute: manifestDirAbsolute, relative: manifestDirRelative } = resolveInsideWorkspace(manifestDirArg);
const docAbsolute = path.join(ROOT_DIR, docPath);

if (!fs.existsSync(docAbsolute)) {
  errors.push(`Missing glasses hardware evidence doc: ${docPath}`);
} else {
  const markdown = fs.readFileSync(docAbsolute, "utf8");
  if (!markdown.startsWith("# Glasses Hardware Evidence")) {
    errors.push("Document must start with '# Glasses Hardware Evidence'.");
  }
  for (const section of requiredSections) {
    if (!hasSection(markdown, section)) errors.push(`Missing required section: ${section}`);
  }
  for (const marker of requiredMarkers) {
    if (!markdown.includes(marker)) errors.push(`Missing required marker: ${marker}`);
  }
  for (const url of requiredUrls) {
    if (!markdown.includes(url)) errors.push(`Missing official source URL: ${url}`);
  }
  for (const claim of prohibitedClaims) {
    if (markdown.toLowerCase().includes(claim.toLowerCase())) {
      errors.push(`Document must not claim completed glasses readiness: ${claim}`);
    }
  }
}

const manifestPath = path.join(manifestDirAbsolute, "manifest.json");
let manifest = null;
if (!fs.existsSync(manifestPath)) {
  errors.push(`Missing glasses hardware evidence manifest: ${path.join(manifestDirRelative, "manifest.json")}`);
} else {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    errors.push(`Manifest JSON parse failed: ${error.message}`);
  }
}

if (manifest) {
  if (manifest.schemaVersion !== 1) errors.push(`Unexpected schemaVersion: ${manifest.schemaVersion}`);
  if (manifest.packageName !== "com.voicedirection.glass") errors.push(`Unexpected packageName: ${manifest.packageName}`);
  if (manifest.externalSubmission !== "not_performed") errors.push("Manifest externalSubmission must be not_performed.");
  if (manifest.status !== "DRAFT_GLASSES_HARDWARE_EVIDENCE_NOT_COLLECTED" && !requireGlassesAlphaReady) {
    warnings.push(`Manifest status is ${manifest.status}; default validation expects a draft unless strict mode is used.`);
  }
  if (!allowedEvidenceStatuses.has(manifest.metaRayBanDisplay?.status)) errors.push(`Unexpected metaRayBanDisplay.status: ${manifest.metaRayBanDisplay?.status}`);
  if (!allowedEvidenceStatuses.has(manifest.rayBanGen1BluetoothFallback?.status)) errors.push(`Unexpected rayBanGen1BluetoothFallback.status: ${manifest.rayBanGen1BluetoothFallback?.status}`);
  if (!allowedEvidenceStatuses.has(manifest.androidXrProjected?.status)) errors.push(`Unexpected androidXrProjected.status: ${manifest.androidXrProjected?.status}`);
  if (!allowedHapticsStatuses.has(manifest.haptics?.status)) errors.push(`Unexpected haptics.status: ${manifest.haptics?.status}`);

  for (const field of privacyFalseFields) {
    if (manifest.privacy?.[field] !== false) {
      errors.push(`Manifest privacy.${field} must be false.`);
    }
  }

  const privateValuePatterns = [
    /embedding:v1:/i,
    /enc:v\d+:/i,
    /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,
  ];
  for (const value of collectStringValues(manifest)) {
    for (const pattern of privateValuePatterns) {
      if (pattern.test(value)) errors.push(`Manifest contains private structured value matching ${pattern}.`);
    }
  }

  if (requireGlassesAlphaReady) {
    if (manifest.status !== "GLASSES_HARDWARE_EVIDENCE_COLLECTED") errors.push("Strict mode requires status GLASSES_HARDWARE_EVIDENCE_COLLECTED.");

    const meta = manifest.metaRayBanDisplay ?? {};
    if (meta.status !== "passed") errors.push("Strict mode requires metaRayBanDisplay.status passed.");
    if (meta.adapterStatus !== "real_adapter") errors.push("Strict mode requires Meta DAT real adapter.");
    if (booleanValue(meta.datCredentialsConfigured) !== true) errors.push("Strict mode requires DAT credentials configured.");
    if (booleanValue(meta.datPackageAccessVerified) !== true) errors.push("Strict mode requires DAT package access verified.");
    if (booleanValue(meta.sessionLifecycleObserved) !== true) errors.push("Strict mode requires DAT session lifecycle observed.");
    if (booleanValue(meta.cueRenderedOnDisplay) !== true) errors.push("Strict mode requires cueRenderedOnDisplay=true.");
    if (booleanValue(meta.directionVisible) !== true) errors.push("Strict mode requires directionVisible=true.");
    if (booleanValue(meta.displayLabelPrivacyReviewed) !== true) errors.push("Strict mode requires displayLabelPrivacyReviewed=true.");
    if (booleanValue(meta.failureStateDocumented) !== true) errors.push("Strict mode requires Meta failureStateDocumented=true.");

    const gen1 = manifest.rayBanGen1BluetoothFallback ?? {};
    if (gen1.status !== "passed" && gen1.status !== "documented_unavailable") errors.push("Strict mode requires Ray-Ban Gen 1 fallback passed or documented_unavailable.");
    if (gen1.status === "passed") {
      if (booleanValue(gen1.routeProbeRun) !== true) errors.push("Strict mode requires Ray-Ban routeProbeRun=true.");
      if (typeof gen1.bluetoothInputCandidateVisible !== "boolean") errors.push("Strict mode requires bluetoothInputCandidateVisible boolean.");
      if (booleanValue(gen1.routeSelectClearTested) !== true) errors.push("Strict mode requires routeSelectClearTested=true.");
      if (booleanValue(gen1.privateRouteNamesRedacted) !== true) errors.push("Strict mode requires privateRouteNamesRedacted=true.");
      if (booleanValue(gen1.ttsDirectionCueHeard) !== true && booleanValue(gen1.phoneVibrationFallbackObserved) !== true) {
        errors.push("Strict mode requires TTS cue heard or phone vibration fallback observed for Gen 1 fallback.");
      }
    }

    const xr = manifest.androidXrProjected ?? {};
    if (xr.status !== "passed") errors.push("Strict mode requires androidXrProjected.status passed.");
    if (xr.adapterStatus !== "real_adapter") errors.push("Strict mode requires Android XR real adapter.");
    if (booleanValue(xr.runtimeAvailable) !== true) errors.push("Strict mode requires Android XR runtime available.");
    if (booleanValue(xr.jetpackProjectedDependenciesResolved) !== true) errors.push("Strict mode requires Jetpack Projected dependencies resolved.");
    if (booleanValue(xr.projectedActivityLaunched) !== true) errors.push("Strict mode requires projectedActivityLaunched=true.");
    if (booleanValue(xr.projectedContextUsed) !== true) errors.push("Strict mode requires projectedContextUsed=true.");
    if (booleanValue(xr.cueVisibleOnProjectedDisplay) !== true) errors.push("Strict mode requires cueVisibleOnProjectedDisplay=true.");
    if (booleanValue(xr.emptyStateVisible) !== true) errors.push("Strict mode requires emptyStateVisible=true.");
    if (booleanValue(xr.microphoneAccessTested) !== true && booleanValue(xr.bluetoothFallbackTested) !== true) {
      errors.push("Strict mode requires projected microphone access tested or Bluetooth fallback tested.");
    }
    if (booleanValue(xr.failureStateDocumented) !== true) errors.push("Strict mode requires Android XR failureStateDocumented=true.");

    const haptics = manifest.haptics ?? {};
    if (haptics.status === "passed" && booleanValue(haptics.perSideHapticsVerified) !== true) {
      errors.push("Strict mode cannot mark haptics passed without perSideHapticsVerified=true.");
    }
    if (haptics.status === "documented_not_available" && booleanValue(haptics.phoneVibrationFallbackRemainsMvp) !== true) {
      errors.push("Strict mode requires phoneVibrationFallbackRemainsMvp=true when haptics are documented unavailable.");
    }
    if (booleanValue(manifest.serviceReadinessAuditRegenerated) !== true) {
      errors.push("Strict mode requires serviceReadinessAuditRegenerated=true.");
    }

    const evidenceFiles = [
      ["Meta Ray-Ban Display", meta.evidencePath],
      ["Ray-Ban Gen 1 fallback", gen1.evidencePath],
      ["Android XR projected", xr.evidencePath],
    ];
    for (const [label, evidencePath] of evidenceFiles) {
      const absolute = resolveEvidencePath(evidencePath ?? "", label, errors);
      scanEvidenceFile(absolute, label, errors, warnings);
    }
    if (haptics.evidencePath) {
      const absolute = resolveEvidencePath(haptics.evidencePath, "Haptics", errors);
      scanEvidenceFile(absolute, "Haptics", errors, warnings);
    }
  } else {
    if (manifest.metaRayBanDisplay?.status === "not_collected") warnings.push("Meta Ray-Ban Display evidence has not been collected.");
    if (manifest.rayBanGen1BluetoothFallback?.status === "not_collected") warnings.push("Ray-Ban Gen 1 fallback evidence has not been collected.");
    if (manifest.androidXrProjected?.status === "not_collected") warnings.push("Android XR projected evidence has not been collected.");
  }
}

const result = {
  ok: errors.length === 0,
  manifestDir: manifestDirRelative,
  requireGlassesAlphaReady,
  warnings,
  errors,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Glasses hardware evidence validation passed: ${manifestDirRelative}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Glasses hardware evidence validation failed: ${manifestDirRelative}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
