#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/Users/sonjunpyo/Documents/Project/glass"
SESSION_DIR="$ROOT_DIR/data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack"

cd "$ROOT_DIR"

echo "1/6 Validate support incident process"
node scripts/validate-support-incident-process.mjs --json

echo "2/6 Validate support drill draft gate"
node scripts/validate-support-drill-evidence.mjs --json

echo "3/6 Confirm strict drill gate is blocked until evidence exists"
if node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json; then
  echo "Strict support drill validation passed. Confirm this was intentional and evidence-backed."
else
  echo "Strict support drill validation remains blocked until support channel and drill evidence exist."
fi

echo "4/6 Validate this support drill session folder"
node scripts/validate-support-drill-session.mjs "$SESSION_DIR" --json

echo "5/6 Generate service readiness audit"
node scripts/audit-service-readiness.mjs --write-report --report-dir "$SESSION_DIR/service-readiness-audit"

echo "6/6 Re-validate this support drill session folder"
node scripts/validate-support-drill-session.mjs "$SESSION_DIR" --json

echo "Support drill session evidence is under: $SESSION_DIR"
