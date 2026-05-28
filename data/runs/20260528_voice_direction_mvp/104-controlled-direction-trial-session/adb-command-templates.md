# ADB Command Templates

Generated: 2026-05-28T12:14:30+09:00

Use these templates only while running controlled physical trials. Replace `OBSERVED`, `STATUS`, and `CONFIDENCE` with the measured enum/status/value. Keep `UNKNOWN` when confidence is weak.

Allowed observed directions: `FRONT`, `BACK`, `LEFT`, `RIGHT`, `UNKNOWN`.

Allowed statuses: `SAMPLED`, `NO_PERMISSION`, `NO_STEREO_INPUT`, `RECORDER_UNAVAILABLE`, `READ_FAILED`, `ERROR`.

Clear old trial rows:

```bash
scripts/record-direction-validation-trial.sh --clear
```

## Per-Direction Templates

### FRONT

```bash
scripts/record-direction-validation-trial.sh --expected FRONT --observed OBSERVED --status STATUS --confidence CONFIDENCE --source controlled-phone
```

### BACK

```bash
scripts/record-direction-validation-trial.sh --expected BACK --observed OBSERVED --status STATUS --confidence CONFIDENCE --source controlled-phone
```

### LEFT

```bash
scripts/record-direction-validation-trial.sh --expected LEFT --observed OBSERVED --status STATUS --confidence CONFIDENCE --source controlled-phone
```

### RIGHT

```bash
scripts/record-direction-validation-trial.sh --expected RIGHT --observed OBSERVED --status STATUS --confidence CONFIDENCE --source controlled-phone
```


## Privacy Guardrail

Do not add person names, transcripts, room descriptions, Bluetooth names, MAC addresses, raw audio, PCM, embedding values, encrypted payload values, or private alert text to command arguments.
