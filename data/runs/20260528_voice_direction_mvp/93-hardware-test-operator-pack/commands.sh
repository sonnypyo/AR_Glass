#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
PACK_DIR="$ROOT_DIR/data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack"
PHYSICAL_SESSION="${PHYSICAL_SESSION:-$ROOT_DIR/data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack}"
SUPPORT_SESSION="${SUPPORT_SESSION:-$ROOT_DIR/data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack}"
GLASSES_SESSION="${GLASSES_SESSION:-$ROOT_DIR/data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack}"
REHEARSAL_SESSION="${REHEARSAL_SESSION:-$ROOT_DIR/data/runs/20260528_voice_direction_mvp/79-private-alpha-rehearsal-pack}"

RUN_PHONE="${RUN_PHONE:-0}"
RUN_GLASSES="${RUN_GLASSES:-0}"
RUN_SUPPORT="${RUN_SUPPORT:-0}"

export JAVA_HOME="${JAVA_HOME:-$ROOT_DIR/.toolchains/jdk-17.0.19+10/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/Users/sonjunpyo/Library/Android/sdk}"

cd "$ROOT_DIR"

echo "1/13 Check private-alpha hardware readiness"
node scripts/check-private-alpha-hardware-readiness.mjs --write-report --report-dir "$PACK_DIR/hardware-readiness" --json

echo "2/13 Assert current-safe service gate"
node scripts/assert-service-gates.mjs --profile current-safe --json

echo "3/13 Write phone-private-alpha workflow summary"
scripts/run-phone-private-alpha-evidence.mjs --skip-build --allow-no-device --evidence-dir "$PACK_DIR/android-phone-smoke-dry-run" --report-dir "$PACK_DIR/phone-alpha-runner" --json

echo "4/13 Validate phone-private-alpha workflow summary"
scripts/validate-phone-private-alpha-evidence-runner.mjs "$PACK_DIR/phone-alpha-runner/phone-alpha-evidence-summary.json" --json

echo "5/13 Write glasses-private-alpha workflow summary"
scripts/run-glasses-private-alpha-evidence.mjs --session-dir "$GLASSES_SESSION" --report-dir "$PACK_DIR/glasses-alpha-runner" --json

echo "6/13 Validate glasses-private-alpha workflow summary"
scripts/validate-glasses-private-alpha-evidence-runner.mjs "$PACK_DIR/glasses-alpha-runner/glasses-alpha-evidence-summary.json" --json

if [[ "$RUN_PHONE" == "1" ]]; then
  echo "7/13 RUN_PHONE=1: collect physical phone evidence"
  scripts/run-phone-private-alpha-evidence.mjs --evidence-dir "$PACK_DIR/android-phone-smoke" --report-dir "$PACK_DIR/phone-alpha-runner" --json
else
  echo "7/13 RUN_PHONE not set; skipping physical phone evidence collection"
fi

if [[ "$RUN_GLASSES" == "1" ]]; then
  echo "8/13 RUN_GLASSES=1: run glasses hardware session"
  scripts/run-glasses-private-alpha-evidence.mjs --session-dir "$GLASSES_SESSION" --report-dir "$PACK_DIR/glasses-alpha-runner" --run-session --json
else
  echo "8/13 RUN_GLASSES not set; skipping glasses hardware evidence collection"
fi

if [[ "$RUN_SUPPORT" == "1" ]]; then
  echo "9/13 RUN_SUPPORT=1: run support drill session"
  "$SUPPORT_SESSION/commands.sh"
else
  echo "9/13 RUN_SUPPORT not set; skipping support drill execution"
fi

echo "10/13 Regenerate pack service-readiness audit"
node scripts/audit-service-readiness.mjs --write-report --report-dir "$PACK_DIR/service-readiness-audit"

echo "11/13 Scan pack evidence privacy"
scripts/scan-evidence-privacy.mjs "$PACK_DIR" --write-report --report-dir "$PACK_DIR/evidence-privacy-scan" --json

echo "12/13 Validate operator pack"
node scripts/validate-hardware-test-operator-pack.mjs "$PACK_DIR" --json

echo "13/13 Validate workflow promotion"
node scripts/validate-hardware-test-promotion.mjs "$PACK_DIR" --profile workflow --write-report --report-dir "$PACK_DIR/promotion-validation" --json

echo "Operator pack run complete: $PACK_DIR"
