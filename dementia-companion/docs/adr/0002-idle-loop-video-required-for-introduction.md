# ADR-0002: Idle Loop Video Is Required Before Introduction

**Status:** Accepted

## Context

Avatar Assets — idle loop video and intro audio — are generated in the background after Portrait selection. Generation can take 30–60 seconds. Two options for when the Caregiver can introduce:

- **Audio-only acceptable**: Intro can proceed once `introAudioUrl` is ready, even if `idleLoopVideoUrl` is still generating. The Tablet would show a still portrait or orb during the intro.
- **Video required**: Both `idleLoopVideoUrl` and `introAudioUrl` must be present before the preview modal is available.

## Decision

The idle loop video is required before Introduction can proceed. The caregiver dashboard displays a "Preparing your companion…" state while assets generate, and the preview button only becomes active when both assets are non-null.

## Rationale

The purpose of the preview is for the Caregiver to approve exactly what the Patient will see on the Tablet. Approving without seeing the animated avatar defeats the guardrail — the Caregiver could approve a portrait that looks wrong in motion. The added wait (30–60s after portrait selection) is acceptable given Introduction is a deliberate, one-time act.

## Consequences

- Introduction is unavailable in environments without a Simli API key (dev/CI without the key configured).
- The Patient page must poll the companion record until both `idleLoopVideoUrl` and `introAudioUrl` are non-null.
- The push payload and `/api/devices/status` response must include `idleLoopVideoUrl` so the Tablet can transition from Orb to avatar immediately on Introduction.
