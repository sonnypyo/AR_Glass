#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/Users/sonjunpyo/Documents/Project/glass"
SESSION_DIR="$ROOT_DIR/data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack"

export JAVA_HOME="${JAVA_HOME:-/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/Users/sonjunpyo/Library/Android/sdk}"

cd "$ROOT_DIR"

echo "1/8 Build and test debug APK"
(
  cd apps/voice-direction-glass
  ./gradlew --no-daemon test assembleDebug
)

echo "2/8 Collect Android phone smoke evidence"
scripts/android-device-smoke-test.sh --skip-build --write-evidence --evidence-dir "$SESSION_DIR/android-phone-smoke"

echo "3/8 Collect glasses integration preflight evidence"
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir "$SESSION_DIR/glasses-preflight"

echo "4/8 Validate generated phone evidence"
node scripts/validate-device-evidence.mjs "$SESSION_DIR/android-phone-smoke/device-evidence.md" --json

echo "5/8 Validate direction accuracy evidence gate"
node scripts/validate-direction-accuracy-evidence.mjs --json
if node scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json; then
  echo "Strict production direction validation passed."
else
  echo "Strict production direction validation remains blocked until controlled phone/glasses evidence exists."
fi

echo "6/8 Generate and validate controlled direction trial session"
scripts/create-controlled-direction-trial-session.mjs --run-dir "$SESSION_DIR/controlled-direction-trial-session" --force --json
scripts/validate-controlled-direction-trial-session.mjs "$SESSION_DIR/controlled-direction-trial-session" --json

echo "7/8 Generate service readiness audit"
scripts/audit-service-readiness.mjs --write-report --report-dir "$SESSION_DIR/service-readiness-audit"

echo "8/8 Validate physical test session folder"
scripts/validate-physical-test-session.mjs "$SESSION_DIR" --json

echo "Physical test session evidence is under: $SESSION_DIR"
