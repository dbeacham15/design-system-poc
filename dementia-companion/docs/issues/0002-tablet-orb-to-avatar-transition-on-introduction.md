# Tablet — Orb-to-avatar transition on Introduction

## What to build

Update the Tablet so that the Orb transitions to the Companion's idle loop video immediately when Introduction fires — without requiring the patient to tap and start a voice session first.

**Polling path (web mode):** `App.tsx` already polls `GET /api/devices/status` every 4 seconds. When the response carries `avatarUnlocked: true`, capture `idleLoopVideoUrl`, `companionName`, and `introAudioUrl` from the same response and pass them as initial props to `CompanionScreen`.

**Push path (native):** When a `COMPANION_INTRO` notification is received, the handler already calls `onCompanionIntro` with `companionName` and `introAudioUrl`. Extend it to also pass `idleLoopVideoUrl` from the notification data.

**`CompanionScreen`:** Currently receives `deviceToken` and `avatarUnlocked` as props; `idleLoopVideoUrl` and `companionName` are only populated when a voice session starts. Accept them as optional initial props and initialise the corresponding state values on mount. The `useVoiceSession` hook continues to update these on session start as before.

The result: on Introduction the Orb glow fades and the idle loop video appears, with the intro audio playing — the Companion is present before the patient says a word.

## Acceptance criteria

- [ ] On web, polling detects Introduction and the Orb transitions to the idle loop video without a tap
- [ ] On native, receiving the `COMPANION_INTRO` push notification triggers the same orb → avatar transition
- [ ] Intro audio plays during the transition
- [ ] If `idleLoopVideoUrl` is not yet available (null), the Orb remains until a voice session populates it
- [ ] A Tablet paired after Introduction immediately shows the Companion avatar (not the Orb) on first load
- [ ] Existing voice session behaviour is unaffected

## Blocked by

- Issue #0001 — Server companion snapshot on device channels
