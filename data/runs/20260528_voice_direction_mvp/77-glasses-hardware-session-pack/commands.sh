#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/Users/sonjunpyo/Documents/Project/glass"
SESSION_DIR="$ROOT_DIR/data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack"

export JAVA_HOME="${JAVA_HOME:-/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/Users/sonjunpyo/Library/Android/sdk}"

cd "$ROOT_DIR"

echo "1/8 Build and test debug APK"
(
  cd apps/voice-direction-glass
  ./gradlew --no-daemon test assembleDebug
)

echo "2/8 Validate glasses setup draft gate"
node scripts/validate-glasses-setup-readiness.mjs --json

echo "3/8 Validate glasses hardware draft gate"
node scripts/validate-glasses-hardware-evidence.mjs --json

echo "4/8 Confirm strict glasses hardware gate is blocked until evidence exists"
if node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json; then
  echo "Strict glasses hardware validation passed. Confirm this was intentional and evidence-backed."
else
  echo "Strict glasses hardware validation remains blocked until real Ray-Ban Display, Ray-Ban Gen 1 fallback, and Android XR evidence exists."
fi

echo "5/8 Collect glasses integration preflight evidence"
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir "$SESSION_DIR/glasses-preflight"

echo "6/8 Validate this glasses hardware session folder"
node scripts/validate-glasses-hardware-session.mjs "$SESSION_DIR" --json

echo "7/8 Generate service readiness audit"
node scripts/audit-service-readiness.mjs --write-report --report-dir "$SESSION_DIR/service-readiness-audit"

echo "8/8 Re-validate this glasses hardware session folder"
node scripts/validate-glasses-hardware-session.mjs "$SESSION_DIR" --json

echo "Glasses hardware session evidence is under: $SESSION_DIR"
