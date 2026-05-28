# Stage 78: Glasses Hardware Session Apply Automation

Date: 2026-05-28 KST

## Objective

Add a guarded automation step for applying a reviewed glasses hardware session pack into the canonical `apps/voice-direction-glass/glasses-evidence/manifest.json`.

## Added

- `scripts/apply-glasses-hardware-session.mjs`
- `docs/26-glasses-hardware-session-runbook.md` update for dry-run/write workflow

## Behavior

Default mode is dry-run. It validates:

- The selected session folder with `scripts/validate-glasses-hardware-session.mjs`.
- `manifest-update-template.json` structure.
- Workspace-relative evidence paths.
- Privacy flags.
- Private structured-field patterns in generated evidence files.

`--write` mode updates the canonical glasses hardware manifest only after validation.

Guardrail:

- Draft sessions are refused in `--write` mode unless `--allow-draft` is explicitly provided.
- Ready sessions must survive the strict glasses hardware validator after writing, otherwise the canonical manifest is restored.

## Verification

```bash
node --check scripts/apply-glasses-hardware-session.mjs
node scripts/apply-glasses-hardware-session.mjs data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack --json
node scripts/apply-glasses-hardware-session.mjs data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack --write --json
```

Result:

- Script syntax passed.
- Dry-run passed.
- `--write` failed as expected because the current generated session pack is still `DRAFT_GLASSES_HARDWARE_EVIDENCE_NOT_COLLECTED`.
- The canonical manifest was not modified by the refused write.

## Trial/Error Notes

- The apply script intentionally does not trust the session generator alone. It reruns the session validator and repeats private structured-field checks before allowing a write.
- The current session pack is a workflow proof, not hardware proof. Refusing draft writes keeps that distinction machine-checkable.
- The real hardware path is now: generate session, fill reviewed evidence, dry-run apply, write apply, strict hardware validation, regenerate service audit.
