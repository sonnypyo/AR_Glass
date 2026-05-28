# Hardware Test Operator Pack

Generated: 2026-05-28T11:52:15+09:00

## Purpose

This pack is the day-of-test control surface for Voice Direction Glass. It ties together phone evidence, Ray-Ban Display evidence, Ray-Ban Meta Gen 1 fallback evidence, Android XR projected evidence, support drills, and private-alpha promotion gates.

It does not prove readiness by itself. It gives the operator one safe place to run default no-hardware checks, then opt into phone, glasses, or support evidence commands only when the matching hardware and owners are ready.

## Linked Sessions

- Physical phone session: `data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack`
- Support drill session: `data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack`
- Glasses hardware session: `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack`
- Private-alpha rehearsal session: `data/runs/20260528_voice_direction_mvp/79-private-alpha-rehearsal-pack`

## Default No-Hardware Run

Run this first:

```bash
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Expected current result:

- hardware readiness preflight runs
- current-safe service gate passes
- phone-private-alpha runner writes `phonePrivateAlphaCandidate=false` and no direction summary because no phone evidence exists
- glasses-private-alpha runner writes `glassesPrivateAlphaCandidate=false`
- service-readiness audit is regenerated under this pack
- evidence privacy scan runs against the full pack before promotion validation

## Hardware Opt-In Runs

Use one opt-in flag at a time unless every owner is present and ready:

```bash
RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
RUN_GLASSES=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
RUN_SUPPORT=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Only use `RUN_PHONE=1` when exactly one authorized Android phone is attached over ADB.

Only use `RUN_GLASSES=1` when Ray-Ban Display, Ray-Ban Meta Gen 1, or Android XR evidence can actually be collected and the session files can be reviewed.

Only use `RUN_SUPPORT=1` when deletion and mistaken-alert drill evidence owners are ready.

## Promotion Rule

Phone private alpha requires validator-passing physical `device-evidence.md`, default direction evidence summary validation, and manual rows.

Glasses private alpha requires phone private alpha evidence, Meta DAT credentials/package access, real adapter proof, Ray-Ban Display proof, Gen 1 fallback proof or documented limitation, Android XR projected proof, haptics/fallback proof, strict glasses hardware validation, and a passing glasses-alpha service gate.

## Privacy Rule

Do not paste raw audio, PCM, transcripts, speaker names, contact names, voice embeddings, encrypted payload values, Bluetooth owner/device/product names, MAC addresses, private alert text, or exact locations into this pack.
