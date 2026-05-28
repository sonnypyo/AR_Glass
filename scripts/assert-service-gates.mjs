#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const profile = valueAfter("--profile") || "current-safe";

const targetAliases = {
  internal: "INTERNAL_PROTOTYPE",
  "internal-prototype": "INTERNAL_PROTOTYPE",
  phone: "PHONE_PRIVATE_ALPHA",
  "phone-alpha": "PHONE_PRIVATE_ALPHA",
  "phone-private-alpha": "PHONE_PRIVATE_ALPHA",
  glasses: "GLASSES_PRIVATE_ALPHA",
  "glasses-alpha": "GLASSES_PRIVATE_ALPHA",
  "glasses-private-alpha": "GLASSES_PRIVATE_ALPHA",
  beta: "EXTERNAL_BETA",
  "external-beta": "EXTERNAL_BETA",
  production: "PRODUCTION_SERVICE",
  "production-service": "PRODUCTION_SERVICE",
};

const profiles = {
  "current-safe": {
    description: "Current repository state: internal prototype ready, no external/hardware promotion ready.",
    expectedTargets: {
      INTERNAL_PROTOTYPE: true,
      PHONE_PRIVATE_ALPHA: false,
      GLASSES_PRIVATE_ALPHA: false,
      EXTERNAL_BETA: false,
      PRODUCTION_SERVICE: false,
    },
    requireDeviceEvidenceOk: false,
    requireNoOpenPhoneIds: false,
    requireAllGlassesPlatformsReady: false,
  },
  "internal-prototype": {
    description: "Internal prototype gate only.",
    expectedTargets: {
      INTERNAL_PROTOTYPE: true,
    },
    requireDeviceEvidenceOk: false,
    requireNoOpenPhoneIds: false,
    requireAllGlassesPlatformsReady: false,
  },
  "phone-alpha": {
    description: "Phone private alpha promotion gate.",
    expectedTargets: {
      INTERNAL_PROTOTYPE: true,
      PHONE_PRIVATE_ALPHA: true,
    },
    requireDeviceEvidenceOk: true,
    requireNoOpenPhoneIds: true,
    requireAllGlassesPlatformsReady: false,
  },
  "glasses-alpha": {
    description: "Glasses private alpha promotion gate.",
    expectedTargets: {
      INTERNAL_PROTOTYPE: true,
      PHONE_PRIVATE_ALPHA: true,
      GLASSES_PRIVATE_ALPHA: true,
    },
    requireDeviceEvidenceOk: true,
    requireNoOpenPhoneIds: true,
    requireAllGlassesPlatformsReady: true,
  },
  "production": {
    description: "Production service promotion gate.",
    expectedTargets: {
      INTERNAL_PROTOTYPE: true,
      PHONE_PRIVATE_ALPHA: true,
      GLASSES_PRIVATE_ALPHA: true,
      EXTERNAL_BETA: true,
      PRODUCTION_SERVICE: true,
    },
    requireDeviceEvidenceOk: true,
    requireNoOpenPhoneIds: true,
    requireAllGlassesPlatformsReady: true,
  },
};

function usage() {
  return [
    "Usage: scripts/assert-service-gates.mjs [--profile current-safe|internal-prototype|phone-alpha|glasses-alpha|production] [--json]",
    "",
    "Asserts service promotion gates from scripts/audit-service-readiness.mjs --json.",
    "",
    "Default profile: current-safe",
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

function runAudit() {
  const result = spawnSync(process.execPath, [
    path.join(ROOT_DIR, "scripts/audit-service-readiness.mjs"),
    "--json",
  ], { cwd: ROOT_DIR, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `audit-service-readiness exited with status ${result.status}`);
  }
  return JSON.parse(result.stdout);
}

function targetSummary(audit, target) {
  return audit.releaseTargets.find((summary) => summary.target === target);
}

function platformSummary(audit, platform) {
  return audit.glassesPlatforms.find((summary) => summary.platform === platform);
}

function validateProfile(audit, selectedProfile) {
  const errors = [];
  const warnings = [];
  for (const [target, expectedReady] of Object.entries(selectedProfile.expectedTargets)) {
    const summary = targetSummary(audit, target);
    if (!summary) {
      errors.push(`Missing release target in audit: ${target}`);
      continue;
    }
    if (summary.ready !== expectedReady) {
      errors.push(`${target} ready expected ${expectedReady}, got ${summary.ready}. Open ids: ${summary.openIds.join(", ") || "-"}`);
    }
  }

  const phone = targetSummary(audit, "PHONE_PRIVATE_ALPHA");
  if (selectedProfile.requireNoOpenPhoneIds && phone?.openIds?.length > 0) {
    errors.push(`PHONE_PRIVATE_ALPHA still has open ids: ${phone.openIds.join(", ")}`);
  }

  if (selectedProfile.requireDeviceEvidenceOk && audit.deviceEvidence?.validation?.ok !== true) {
    errors.push(`Device evidence validator is not passing: ${(audit.deviceEvidence?.validation?.errors ?? []).join("; ") || audit.deviceEvidence?.path || "missing"}`);
  }

  if (!selectedProfile.requireDeviceEvidenceOk && audit.deviceEvidence?.validation?.ok !== true) {
    warnings.push("Device evidence is missing or not validator-passing; hardware promotion profiles should fail.");
  }

  if (selectedProfile.requireAllGlassesPlatformsReady) {
    for (const platform of ["META_DAT", "ANDROID_XR"]) {
      const summary = platformSummary(audit, platform);
      if (!summary) {
        errors.push(`Missing glasses platform in audit: ${platform}`);
      } else if (!summary.ready) {
        errors.push(`${platform} is not ready. Open ids: ${summary.openIds.join(", ") || "-"}`);
      }
    }
  }

  return { errors, warnings };
}

if (!profiles[profile]) {
  console.error(`Unknown profile: ${profile}`);
  console.error(usage());
  process.exit(1);
}

let audit = null;
const errors = [];
const warnings = [];

try {
  audit = runAudit();
  const validation = validateProfile(audit, profiles[profile]);
  errors.push(...validation.errors);
  warnings.push(...validation.warnings);
} catch (error) {
  errors.push(error.message);
}

const result = {
  ok: errors.length === 0,
  profile,
  description: profiles[profile].description,
  generatedAt: audit?.generatedAt ?? "",
  releaseTargets: audit?.releaseTargets ?? [],
  deviceEvidence: audit?.deviceEvidence ?? null,
  glassesPlatforms: audit?.glassesPlatforms ?? [],
  warnings,
  errors,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Service gate assertion passed: ${profile}`);
  if (warnings.length > 0) {
    console.log(`Warnings: ${warnings.join("; ")}`);
  }
} else {
  console.error(`Service gate assertion failed: ${profile}`);
  for (const error of errors) console.error(`- ${error}`);
}

process.exit(result.ok ? 0 : 1);
