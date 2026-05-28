#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/Users/sonjunpyo/Documents/Project/glass"
SESSION_DIR="$ROOT_DIR/data/runs/20260528_voice_direction_mvp/79-private-alpha-rehearsal-pack"
PHYSICAL_SESSION="$ROOT_DIR/data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack"
SUPPORT_SESSION="$ROOT_DIR/data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack"
GLASSES_SESSION="$ROOT_DIR/data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack"

export JAVA_HOME="${JAVA_HOME:-/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/Users/sonjunpyo/Library/Android/sdk}"

cd "$ROOT_DIR"

echo "1/14 Build and test debug APK"
(
  cd apps/voice-direction-glass
  ./gradlew --no-daemon test assembleDebug
)

echo "2/14 Validate physical test session structure"
node scripts/validate-physical-test-session.mjs "$PHYSICAL_SESSION" --json

echo "3/14 Validate support drill session structure"
node scripts/validate-support-drill-session.mjs "$SUPPORT_SESSION" --json

echo "4/14 Validate glasses hardware session structure"
node scripts/validate-glasses-hardware-session.mjs "$GLASSES_SESSION" --json

echo "5/14 Dry-run glasses hardware session apply"
node scripts/apply-glasses-hardware-session.mjs "$GLASSES_SESSION" --json

echo "6/14 Validate support drill draft gate"
node scripts/validate-support-drill-evidence.mjs --json

echo "7/14 Confirm strict support drill gate is blocked until real drill evidence exists"
if node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json; then
  echo "Strict support drill validation passed. Confirm this was intentional and evidence-backed."
else
  echo "Strict support drill validation remains blocked until operational drill evidence exists."
fi

echo "8/14 Validate glasses setup draft gate"
node scripts/validate-glasses-setup-readiness.mjs --json

echo "9/14 Confirm strict glasses setup gate is blocked until credentials exist"
if node scripts/validate-glasses-setup-readiness.mjs --require-credentials --json; then
  echo "Strict glasses setup validation passed. Confirm credentials are intentionally configured outside source control."
else
  echo "Strict glasses setup validation remains blocked until local Meta credentials exist."
fi

echo "10/14 Validate glasses hardware draft gate"
node scripts/validate-glasses-hardware-evidence.mjs --json

echo "11/14 Confirm strict glasses hardware gate is blocked until real hardware evidence exists"
if node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json; then
  echo "Strict glasses hardware validation passed. Confirm this was intentional and evidence-backed."
else
  echo "Strict glasses hardware validation remains blocked until Ray-Ban and Android XR evidence exists."
fi

echo "12/14 Generate service readiness audit"
node scripts/audit-service-readiness.mjs --write-report --report-dir "$SESSION_DIR/service-readiness-audit"

echo "13/14 Validate private alpha rehearsal folder"
node scripts/validate-private-alpha-rehearsal.mjs "$SESSION_DIR" --json

echo "14/14 Optional generated phone evidence validation"
if [[ -f "$PHYSICAL_SESSION/android-phone-smoke/device-evidence.md" ]]; then
  node scripts/validate-device-evidence.mjs "$PHYSICAL_SESSION/android-phone-smoke/device-evidence.md" --json
else
  echo "No physical device evidence yet. Attach a phone and run the physical session commands when ready."
fi

echo "Private alpha rehearsal evidence is under: $SESSION_DIR"
