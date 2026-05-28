#!/usr/bin/env node
import childProcess from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const requireUploadReady = args.includes("--require-upload-ready");
const docArg = args.find((arg) => !arg.startsWith("--")) || "docs/18-release-artifact-signing-runbook.md";

const buildGradlePath = "apps/voice-direction-glass/app/build.gradle.kts";
const debugApkPath = "apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk";
const releaseBundlePath = "apps/voice-direction-glass/app/build/outputs/bundle/release/app-release.aab";

const requiredSections = [
  "Purpose",
  "Official Source Snapshot",
  "Current Artifact State",
  "Gradle Signing Configuration",
  "Local Build Commands",
  "Upload-Ready Checklist",
  "Security Guardrails",
  "Release Gate",
  "Trial/Error Notes",
];

const requiredMarkers = [
  "Release artifact status: STRUCTURAL_DRAFT_ONLY",
  "Upload-ready status: BLOCKED_NO_UPLOAD_KEY",
  "External submission: not performed",
  "VOICE_DIRECTION_RELEASE_STORE_FILE",
  "VOICE_DIRECTION_RELEASE_STORE_PASSWORD",
  "VOICE_DIRECTION_RELEASE_KEY_ALIAS",
  "VOICE_DIRECTION_RELEASE_KEY_PASSWORD",
  "voiceDirectionUpload",
  "./gradlew --no-daemon bundleRelease",
  "node scripts/validate-release-artifact-readiness.mjs --json",
  "node scripts/validate-release-artifact-readiness.mjs --require-upload-ready --json",
  "Do not commit `.jks`, `.keystore`, `.p12`, `.pem`, `.pk8`, or signing password files.",
  "store-and-sdk-policy-clearance",
  "privacy-consent-copy",
  "production-speaker-model",
  "front-back-direction-evidence",
  "A generated `app-release.aab` is not automatically upload-ready",
];

const requiredUrls = [
  "https://developer.android.com/build/building-cmdline?hl=en",
  "https://developer.android.com/guide/publishing/app-signing.html",
  "https://support.google.com/googleplay/android-developer/answer/9842756/use-play-app-signing?hl=en-GB",
  "https://support.google.com/googleplay/android-developer/answer/9859348?hl=en",
  "https://support.google.com/googleplay/android-developer/answer/9859152?hl=en-EN",
];

const buildGradleMarkers = [
  "VOICE_DIRECTION_RELEASE_STORE_FILE",
  "VOICE_DIRECTION_RELEASE_STORE_PASSWORD",
  "VOICE_DIRECTION_RELEASE_KEY_ALIAS",
  "VOICE_DIRECTION_RELEASE_KEY_PASSWORD",
  "releaseSigningConfigured",
  "voiceDirectionUpload",
  "buildTypes",
  "release",
];

const prohibitedDocClaims = [
  "Upload-ready status: READY",
  "External submission: performed",
  "Play upload complete",
  "Play App Signing configured",
  "production ready",
];

const secretFileExtensions = [".jks", ".keystore", ".p12", ".pfx", ".pem", ".pk8"];

function usage() {
  return [
    "Usage: scripts/validate-release-artifact-readiness.mjs [runbook.md] [--json] [--require-upload-ready]",
    "",
    "Validates the release artifact/signing runbook, Gradle signing hooks, private-key hygiene, and generated release artifact status.",
    "Default mode validates the process and may pass while upload-ready status remains blocked.",
    "--require-upload-ready fails unless a signed release AAB and signing configuration evidence exist.",
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

function hasSection(markdown, title) {
  return new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`, "m").test(markdown);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function listFilesRecursive(relativeDir) {
  const root = path.join(ROOT_DIR, relativeDir);
  const files = [];
  if (!fs.existsSync(root)) return files;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(ROOT_DIR, absolute);
      if (relative.includes(`${path.sep}build${path.sep}`)) continue;
      if (entry.isDirectory()) {
        stack.push(absolute);
      } else {
        files.push(relative);
      }
    }
  }
  return files.sort();
}

function signingEnvConfigured() {
  return [
    "VOICE_DIRECTION_RELEASE_STORE_FILE",
    "VOICE_DIRECTION_RELEASE_STORE_PASSWORD",
    "VOICE_DIRECTION_RELEASE_KEY_ALIAS",
    "VOICE_DIRECTION_RELEASE_KEY_PASSWORD",
  ].every((name) => (process.env[name] ?? "").trim().length > 0);
}

function jarsignerPath() {
  const javaHome = process.env.JAVA_HOME;
  if (javaHome) {
    const candidate = path.join(javaHome, "bin", "jarsigner");
    if (fs.existsSync(candidate)) return candidate;
  }
  const bundledCandidate = path.join(os.homedir(), ".codex", "toolchains", "jdk-17", "Contents", "Home", "bin", "jarsigner");
  if (fs.existsSync(bundledCandidate)) return bundledCandidate;
  return "jarsigner";
}

function verifyJarSignature(absolutePath) {
  if (!fs.existsSync(absolutePath)) {
    return { checked: false, signed: false, detail: "artifact_missing" };
  }
  const result = childProcess.spawnSync(jarsignerPath(), ["-verify", "-strict", absolutePath], {
    encoding: "utf8",
    timeout: 15000,
  });
  if (result.error) {
    return { checked: false, signed: false, detail: result.error.message };
  }
  const output = `${result.stdout}\n${result.stderr}`.trim();
  const unsigned = /jar is unsigned|not signed|unsigned/i.test(output);
  return {
    checked: true,
    signed: result.status === 0 && !unsigned,
    detail: output.split("\n").slice(0, 6).join("\n"),
  };
}

const errors = [];
const warnings = [];
const { absolute: docAbsolute, relative: docRelative } = resolveInsideWorkspace(docArg);

if (!fs.existsSync(docAbsolute)) {
  errors.push(`Release artifact signing runbook does not exist: ${docRelative}`);
} else {
  const markdown = fs.readFileSync(docAbsolute, "utf8");

  if (!markdown.startsWith("# Release Artifact And Signing Runbook")) {
    errors.push("Runbook must start with '# Release Artifact And Signing Runbook'.");
  }

  for (const section of requiredSections) {
    if (!hasSection(markdown, section)) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  for (const marker of requiredMarkers) {
    if (!markdown.includes(marker)) {
      errors.push(`Missing required marker: ${marker}`);
    }
  }

  for (const url of requiredUrls) {
    if (!markdown.includes(url)) {
      errors.push(`Missing required official source URL: ${url}`);
    }
  }

  for (const claim of prohibitedDocClaims) {
    if (markdown.toLowerCase().includes(claim.toLowerCase())) {
      errors.push(`Runbook must not claim upload/release completion: ${claim}`);
    }
  }
}

const buildGradleAbsolute = path.join(ROOT_DIR, buildGradlePath);
if (!fs.existsSync(buildGradleAbsolute)) {
  errors.push(`Missing Gradle app file: ${buildGradlePath}`);
} else {
  const buildGradle = fs.readFileSync(buildGradleAbsolute, "utf8");
  for (const marker of buildGradleMarkers) {
    if (!buildGradle.includes(marker)) {
      errors.push(`Gradle release signing hook missing marker: ${marker}`);
    }
  }
}

const privateKeyFiles = listFilesRecursive(".").filter((file) => {
  const lower = file.toLowerCase();
  return secretFileExtensions.some((extension) => lower.endsWith(extension));
});
if (privateKeyFiles.length > 0) {
  errors.push(`Private signing/key-like files must not be committed: ${privateKeyFiles.join(", ")}`);
}

const debugApkAbsolute = path.join(ROOT_DIR, debugApkPath);
const releaseBundleAbsolute = path.join(ROOT_DIR, releaseBundlePath);
const debugApkExists = fs.existsSync(debugApkAbsolute);
const releaseBundleExists = fs.existsSync(releaseBundleAbsolute);
const releaseBundleSignature = verifyJarSignature(releaseBundleAbsolute);
const uploadEnvConfigured = signingEnvConfigured();
const uploadReady = uploadEnvConfigured && releaseBundleExists && releaseBundleSignature.signed;

if (!debugApkExists) {
  warnings.push(`Debug APK is missing; run ./gradlew --no-daemon test assembleDebug before device QA: ${debugApkPath}`);
}

if (!releaseBundleExists) {
  warnings.push(`Release AAB is missing; run ./gradlew --no-daemon bundleRelease for structural artifact inspection: ${releaseBundlePath}`);
}

if (!uploadEnvConfigured) {
  warnings.push("Release signing environment variables are not fully configured; upload-ready status remains blocked.");
}

if (releaseBundleExists && releaseBundleSignature.checked && !releaseBundleSignature.signed) {
  warnings.push("Release AAB exists but jarsigner did not verify it as upload-signed.");
}

if (requireUploadReady) {
  if (!uploadEnvConfigured) errors.push("Upload-ready mode requires all VOICE_DIRECTION_RELEASE_* signing environment variables.");
  if (!releaseBundleExists) errors.push(`Upload-ready mode requires release AAB: ${releaseBundlePath}`);
  if (!releaseBundleSignature.signed) errors.push("Upload-ready mode requires a jarsigner-verified release AAB.");
}

const result = {
  file: docRelative,
  ok: errors.length === 0,
  uploadReady,
  requireUploadReady,
  releaseSigning: {
    envConfigured: uploadEnvConfigured,
    gradleHookPresent: errors.every((error) => !error.startsWith("Gradle release signing hook missing marker")),
  },
  artifacts: {
    debugApk: { path: debugApkPath, exists: debugApkExists },
    releaseBundle: {
      path: releaseBundlePath,
      exists: releaseBundleExists,
      signature: releaseBundleSignature,
    },
  },
  privateKeyFiles,
  errors,
  warnings,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(`Release artifact readiness validation passed: ${docRelative}`);
  console.log(`uploadReady=${uploadReady}`);
  for (const warning of warnings) {
    console.log(`warning: ${warning}`);
  }
} else {
  console.error(`Release artifact readiness validation failed: ${docRelative}`);
  for (const error of errors) {
    console.error(`error: ${error}`);
  }
  for (const warning of warnings) {
    console.error(`warning: ${warning}`);
  }
}

process.exit(result.ok ? 0 : 1);
