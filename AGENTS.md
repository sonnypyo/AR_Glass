# Voice Direction Glass Agent Instructions

Read `docs/README.md` first. This project is a glasses-linked voice direction app, not a general assistant.

## Current Build Direction

- Android native first.
- Meta DAT and Android XR are adapter targets.
- Keep hardware-specific assumptions documented.
- Update `docs/06-experiment-log.md` after meaningful trials or decisions.

## Safety Rules

- Do not store raw audio by default.
- Do not upload audio or voice embeddings without explicit approval.
- Do not claim precise direction or glasses haptics until official APIs and hardware tests confirm them.
- Do not use private, jailbreak, or reverse-engineered glasses APIs.

## Key Docs

- `docs/00-project-charter.md`
- `docs/01-platform-research.md`
- `docs/03-technical-architecture.md`
- `docs/04-agent-guidelines.md`
- `docs/07-privacy-safety.md`
