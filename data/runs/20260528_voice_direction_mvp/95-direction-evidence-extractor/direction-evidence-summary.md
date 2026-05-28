# Direction Evidence Summary

Generated: 2026-05-28T12:44:02+09:00
Source evidence: data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md
Fixture evidence: true
Production direction candidate: false

## Decision

This summary is not production direction evidence. It must not be used to claim front/back or four-direction readiness.

## Direction Counts

| Direction | Trials | Matched | Mismatched | Unknown/Unusable |
| --- | ---: | ---: | ---: | ---: |
| FRONT | 1 | 0 | 0 | 1 |
| BACK | 1 | 1 | 0 | 0 |
| LEFT | 1 | 0 | 1 | 0 |
| RIGHT | 1 | 1 | 0 | 0 |

## Aggregate Evaluation

- Total trials: 4
- All-direction match rate: 0.5
- Front/back match rate: 0.5
- Left/right match rate: 0.5
- False direction rate: 0.25
- Unknown/unusable rate: 0.25
- p95 latency millis: null
- Confidence bucketed: true
- Wearable controlled route: null

## Controlled Target Progress

- Required trials per direction: 20
- Required total trials: 80
- Missing total trials: 76
- Target complete: false
- Missing front: 19
- Missing back: 19
- Missing left: 19
- Missing right: 19

## Microphone Metadata

- Inventory captured: true
- Active microphones captured: true
- Channel mapping captured: true
- Hardware pose or mounting documented: false

## Privacy

- Raw audio persisted: false
- PCM persisted: false
- Transcripts in evidence: false
- Speaker names in evidence: false
- Raw embedding values in evidence: false
- Raw output persisted: false

## Outputs

- Summary JSON: data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json
- Summary Markdown: data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.md
- Manifest update template: data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/manifest-update-template.json

## Next Commands

```bash
scripts/validate-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --json
scripts/validate-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --require-production-direction-candidate --json
```
