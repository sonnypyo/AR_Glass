#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const requireAssets = args.includes("--require-assets");
const requireXrAssets = args.includes("--require-xr-assets");
const packageArg = args.find((arg) => !arg.startsWith("--")) || "apps/voice-direction-glass/store-assets/play-preview";

const runbookPath = "docs/20-play-screenshot-media-runbook.md";
const requiredSections = [
  "Purpose",
  "Official Source Snapshot",
  "Current Asset Package",
  "Asset Requirements",
  "Capture Workflow",
  "Privacy And Claim Guardrails",
  "Validation Command",
  "Release Gate",
  "Trial/Error Notes",
];
const requiredRunbookMarkers = [
  "Screenshot package status: STORE_ASSETS_DRAFT_ONLY",
  "Capture status: MISSING_PHYSICAL_CAPTURE",
  "External submission: not performed",
  "apps/voice-direction-glass/store-assets/play-preview/manifest.json",
  "scripts/capture-play-screenshots.sh --output-dir apps/voice-direction-glass/store-assets/play-preview",
  "node scripts/validate-play-screenshot-package.mjs --json",
  "node scripts/validate-play-screenshot-package.mjs --require-assets --json",
  "node scripts/validate-play-screenshot-package.mjs --require-assets --require-xr-assets --json",
  "1024px by 500px",
  "4 to 8 screenshots",
  "8:5 aspect ratio",
  "recommended 3840x2400",
  "minimum 1920x1200",
  "STORE_ASSETS_DRAFT_ONLY",
  "MISSING_PHYSICAL_CAPTURE",
  "store-and-sdk-policy-clearance",
  "front-back-direction-evidence",
  "production-speaker-model",
];
const requiredUrls = [
  "https://support.google.com/googleplay/android-developer/answer/1078870?hl=en",
  "https://support.google.com/googleplay/android-developer/answer/9898842?hl=en",
  "https://support.google.com/googleplay/android-developer/answer/13393723?hl=en",
  "https://support.google.com/googleplay/android-developer/answer/9859152?hl=en-EN",
];
const requiredAssetIds = [
  "phone-main-screen",
  "phone-alert-output",
  "phone-local-data-delete",
  "feature-graphic",
  "xr-projected-preview-1",
  "xr-projected-preview-2",
  "xr-projected-preview-3",
  "xr-projected-preview-4",
];
const prohibitedText = [
  "guaranteed speaker identity",
  "guaranteed front/back",
  "production speaker identification",
  "Android XR production support",
  "glasses haptics supported",
  "emergency service",
  "available on Google Play",
  "Play review approved",
];

function usage() {
  return [
    "Usage: scripts/validate-play-screenshot-package.mjs [package-dir] [--json] [--require-assets] [--require-xr-assets]",
    "",
    "Validates the Play screenshot/media runbook and draft asset manifest.",
    "Default mode validates the plan and may pass while assets are still missing.",
    "--require-assets requires phone screenshots plus feature graphic files.",
    "--require-xr-assets additionally requires 4-8 Android XR screenshots.",
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

function readPngDimensions(buffer) {
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== pngSignature) return null;
  return {
    type: "png",
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) break;
    const isSof = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
    if (isSof && length >= 7) {
      return {
        type: "jpeg",
        width: buffer.readUInt16BE(offset + 5),
        height: buffer.readUInt16BE(offset + 3),
      };
    }
    offset += length;
  }
  return null;
}

function readImageInfo(absolutePath) {
  const buffer = fs.readFileSync(absolutePath);
  const dimensions = readPngDimensions(buffer) ?? readJpegDimensions(buffer);
  if (!dimensions) return null;
  return {
    ...dimensions,
    bytes: buffer.length,
  };
}

function is8To5(width, height) {
  return width * 5 === height * 8 || height * 5 === width * 8;
}

const errors = [];
const warnings = [];
const { absolute: packageAbsolute, relative: packageRelative } = resolveInsideWorkspace(packageArg);
const runbookAbsolute = path.join(ROOT_DIR, runbookPath);

if (!fs.existsSync(runbookAbsolute)) {
  errors.push(`Missing runbook: ${runbookPath}`);
} else {
  const runbook = fs.readFileSync(runbookAbsolute, "utf8");
  if (!runbook.startsWith("# Play Screenshot And Media Runbook")) {
    errors.push("Runbook must start with '# Play Screenshot And Media Runbook'.");
  }
  for (const section of requiredSections) {
    if (!hasSection(runbook, section)) errors.push(`Missing runbook section: ${section}`);
  }
  for (const marker of requiredRunbookMarkers) {
    if (!runbook.includes(marker)) errors.push(`Missing runbook marker: ${marker}`);
  }
  for (const url of requiredUrls) {
    if (!runbook.includes(url)) errors.push(`Missing official source URL: ${url}`);
  }
}

const manifestPath = path.join(packageAbsolute, "manifest.json");
let manifest = null;
if (!fs.existsSync(manifestPath)) {
  errors.push(`Missing screenshot package manifest: ${path.join(packageRelative, "manifest.json")}`);
} else {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    errors.push(`Manifest JSON parse failed: ${error.message}`);
  }
}

const assetResults = [];
if (manifest) {
  if (manifest.packageName !== "com.voicedirection.glass") errors.push(`Unexpected packageName: ${manifest.packageName}`);
  if (manifest.versionName !== "0.1.0") errors.push(`Unexpected versionName: ${manifest.versionName}`);
  if (manifest.versionCode !== 1) errors.push(`Unexpected versionCode: ${manifest.versionCode}`);
  if (manifest.status !== "DRAFT_MISSING_PHYSICAL_CAPTURE") errors.push(`Manifest status must be DRAFT_MISSING_PHYSICAL_CAPTURE.`);
  if (manifest.externalSubmission !== "not_performed") errors.push(`Manifest externalSubmission must be not_performed.`);
  if (!Array.isArray(manifest.assets)) errors.push("Manifest assets must be an array.");

  const manifestText = JSON.stringify(manifest);
  for (const prohibited of prohibitedText) {
    if (manifestText.toLowerCase().includes(prohibited.toLowerCase())) {
      errors.push(`Manifest must not contain unsupported/private claim text: ${prohibited}`);
    }
  }

  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  for (const id of requiredAssetIds) {
    if (!assets.some((asset) => asset.id === id)) errors.push(`Manifest missing required asset id: ${id}`);
  }

  for (const asset of assets) {
    const assetErrors = [];
    if (!asset.id || !asset.type || !asset.path || !asset.status || !asset.privacyGuardrail) {
      assetErrors.push("asset_missing_required_field");
    }
    if (String(asset.path ?? "").includes("..") || path.isAbsolute(String(asset.path ?? ""))) {
      assetErrors.push("asset_path_must_be_package_relative");
    }
    const assetAbsolute = path.join(packageAbsolute, asset.path ?? "");
    const exists = fs.existsSync(assetAbsolute);
    let imageInfo = null;
    if (exists) {
      imageInfo = readImageInfo(assetAbsolute);
      if (!imageInfo) assetErrors.push("unsupported_or_invalid_image_file");
    }

    if (asset.type === "phone_screenshot") {
      if (requireAssets && !exists) assetErrors.push("required_phone_screenshot_missing");
      if (imageInfo) {
        const minSide = Math.min(imageInfo.width, imageInfo.height);
        const maxSide = Math.max(imageInfo.width, imageInfo.height);
        if (minSide < 320) assetErrors.push("phone_screenshot_min_side_under_320");
        if (maxSide > 3840) assetErrors.push("phone_screenshot_max_side_over_3840");
        if (maxSide > minSide * 2) assetErrors.push("phone_screenshot_ratio_over_2_to_1");
      }
    } else if (asset.type === "feature_graphic") {
      if (requireAssets && !exists) assetErrors.push("required_feature_graphic_missing");
      if (imageInfo && (imageInfo.width !== 1024 || imageInfo.height !== 500)) {
        assetErrors.push("feature_graphic_must_be_1024x500");
      }
    } else if (asset.type === "android_xr_screenshot") {
      if (requireXrAssets && !exists) assetErrors.push("required_xr_screenshot_missing");
      if (imageInfo) {
        if (imageInfo.bytes > 8 * 1024 * 1024) assetErrors.push("xr_screenshot_over_8mb");
        if (!is8To5(imageInfo.width, imageInfo.height)) assetErrors.push("xr_screenshot_must_be_8_to_5");
        if (Math.max(imageInfo.width, imageInfo.height) < 1920 || Math.min(imageInfo.width, imageInfo.height) < 1200) {
          assetErrors.push("xr_screenshot_below_1920x1200_minimum");
        }
      }
    } else if (asset.type === "video") {
      warnings.push(`Video asset is optional and not validated: ${asset.id}`);
    } else {
      assetErrors.push(`unknown_asset_type_${asset.type}`);
    }

    assetResults.push({
      id: asset.id,
      type: asset.type,
      path: asset.path,
      status: asset.status,
      exists,
      image: imageInfo,
      errors: assetErrors,
    });
    errors.push(...assetErrors.map((error) => `${asset.id}: ${error}`));
  }

  const existingPhoneScreenshots = assetResults.filter((asset) => asset.type === "phone_screenshot" && asset.exists && asset.errors.length === 0);
  if (requireAssets && existingPhoneScreenshots.length < 2) {
    errors.push(`Strict mode requires at least 2 valid phone screenshots; found ${existingPhoneScreenshots.length}.`);
  }
  const validFeatureGraphic = assetResults.some((asset) => asset.type === "feature_graphic" && asset.exists && asset.errors.length === 0);
  if (requireAssets && !validFeatureGraphic) {
    errors.push("Strict mode requires one valid feature graphic.");
  }
  const validXrScreenshots = assetResults.filter((asset) => asset.type === "android_xr_screenshot" && asset.exists && asset.errors.length === 0);
  if (requireXrAssets && (validXrScreenshots.length < 4 || validXrScreenshots.length > 8)) {
    errors.push(`XR strict mode requires 4-8 valid Android XR screenshots; found ${validXrScreenshots.length}.`);
  }
}

const result = {
  ok: errors.length === 0,
  packageDir: packageRelative,
  requireAssets,
  requireXrAssets,
  assets: assetResults,
  warnings,
  errors,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Play screenshot package validation passed: ${packageRelative}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error(`Play screenshot package validation failed: ${packageRelative}`);
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
