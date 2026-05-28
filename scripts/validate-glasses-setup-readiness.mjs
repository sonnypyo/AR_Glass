#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantsJson = args.includes("--json");
const showHelp = args.includes("--help") || args.includes("-h");
const requireCredentials = args.includes("--require-credentials");

const docPath = "docs/24-glasses-setup-readiness.md";
const templatePath = "apps/voice-direction-glass/local.properties.example";
const localPropertiesPath = "apps/voice-direction-glass/local.properties";
const preflightPath = "scripts/glasses-integration-preflight.sh";
const platformResearchPath = "docs/01-platform-research.md";
const preflightDocPath = "docs/11-glasses-integration-preflight.md";

const requiredDocSections = [
  "Purpose",
  "Official Source Snapshot",
  "Secret-Free Template",
  "Validation Command",
  "Hardware Setup Order",
  "Release Gate",
  "Trial/Error Notes",
];
const requiredUrls = [
  "https://wearables.developer.meta.com/docs/develop",
  "https://github.com/facebook/meta-wearables-dat-android",
  "https://developer.android.com/develop/xr/jetpack-xr-sdk",
  "https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity",
  "https://developer.android.com/develop/xr/jetpack-xr-sdk/access-hardware-projected-context",
  "https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/support-different-types",
];
const requiredTemplateKeys = [
  "meta_wearables_application_id",
  "github_token",
  "voice_direction_release_store_file",
  "voice_direction_release_store_password",
  "voice_direction_release_key_alias",
  "voice_direction_release_key_password",
];
const privateValuePatterns = [
  /github_pat_/i,
  /ghp_[A-Za-z0-9_]+/,
  /gho_[A-Za-z0-9_]+/,
  /ghu_[A-Za-z0-9_]+/,
  /ghs_[A-Za-z0-9_]+/,
  /ghr_[A-Za-z0-9_]+/,
  /AIza[0-9A-Za-z_-]+/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

function usage() {
  return [
    "Usage: scripts/validate-glasses-setup-readiness.mjs [--json] [--require-credentials]",
    "",
    "Validates the secret-free glasses setup runbook/template and optional local credential presence.",
    "Default mode does not require credentials. Strict mode checks presence without printing values.",
  ].join("\n");
}

if (showHelp) {
  console.log(usage());
  process.exit(0);
}

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT_DIR, relativePath));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasSection(markdown, title) {
  return new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`, "m").test(markdown);
}

function parseProperties(text) {
  const values = new Map();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    values.set(trimmed.slice(0, index).trim(), trimmed.slice(index + 1).trim());
  }
  return values;
}

function propertyExists(localValues, key) {
  return localValues.has(key) && String(localValues.get(key) ?? "").trim().length > 0;
}

const errors = [];
const warnings = [];

if (!fileExists(docPath)) {
  errors.push(`Missing glasses setup readiness doc: ${docPath}`);
} else {
  const markdown = readProjectFile(docPath);
  if (!markdown.startsWith("# Glasses Setup Readiness")) {
    errors.push("Document must start with '# Glasses Setup Readiness'.");
  }
  for (const section of requiredDocSections) {
    if (!hasSection(markdown, section)) errors.push(`Missing required section: ${section}`);
  }
  for (const url of requiredUrls) {
    if (!markdown.includes(url)) errors.push(`Missing official source URL: ${url}`);
  }
  if (!markdown.includes("Glasses setup readiness status: DRAFT_CREDENTIALS_NOT_CONFIGURED")) {
    errors.push("Document must keep draft credential status explicit.");
  }
}

if (!fileExists(templatePath)) {
  errors.push(`Missing local properties template: ${templatePath}`);
} else {
  const template = readProjectFile(templatePath);
  const templateValues = parseProperties(template);
  for (const key of requiredTemplateKeys) {
    if (!templateValues.has(key)) errors.push(`Template missing key: ${key}`);
    if (templateValues.has(key) && templateValues.get(key)) {
      errors.push(`Template key must not contain a value: ${key}`);
    }
  }
  for (const pattern of privateValuePatterns) {
    if (pattern.test(template)) {
      errors.push(`Template appears to contain a private value matching ${pattern}.`);
    }
  }
}

for (const sourcePath of [preflightPath, platformResearchPath, preflightDocPath]) {
  if (!fileExists(sourcePath)) {
    errors.push(`Missing source file: ${sourcePath}`);
    continue;
  }
  const source = readProjectFile(sourcePath);
  if (!source.includes("https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity")) {
    errors.push(`${sourcePath} must reference the current Android XR audio/display glasses first-activity URL.`);
  }
}

let localValues = new Map();
if (fileExists(localPropertiesPath)) {
  localValues = parseProperties(readProjectFile(localPropertiesPath));
} else {
  warnings.push("No apps/voice-direction-glass/local.properties file exists; use environment variables or copy the example before hardware setup.");
}

const hasMetaApplicationId = Boolean(process.env.META_WEARABLES_APPLICATION_ID) ||
  propertyExists(localValues, "meta_wearables_application_id") ||
  propertyExists(localValues, "metaWearablesApplicationId");
const hasGithubToken = Boolean(process.env.GITHUB_TOKEN) || propertyExists(localValues, "github_token");

if (requireCredentials) {
  if (!hasMetaApplicationId) errors.push("Strict mode requires META_WEARABLES_APPLICATION_ID or local meta_wearables_application_id.");
  if (!hasGithubToken) errors.push("Strict mode requires GITHUB_TOKEN or local github_token.");
} else {
  if (!hasMetaApplicationId) warnings.push("Meta Wearables application id is not configured locally.");
  if (!hasGithubToken) warnings.push("GitHub Packages token is not configured locally.");
}

const result = {
  ok: errors.length === 0,
  requireCredentials,
  template: templatePath,
  localPropertiesPresent: fileExists(localPropertiesPath),
  hasMetaApplicationId,
  hasGithubToken,
  warnings,
  errors,
};

if (wantsJson) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log("Glasses setup readiness validation passed.");
  for (const warning of warnings) console.log(`warning: ${warning}`);
} else {
  console.error("Glasses setup readiness validation failed.");
  for (const error of errors) console.error(`error: ${error}`);
  for (const warning of warnings) console.error(`warning: ${warning}`);
}

process.exit(result.ok ? 0 : 1);
