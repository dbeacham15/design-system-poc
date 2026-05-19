# PRD: Tablet Introduction Flow

## Problem Statement

A caregiver sets up a Companion for their patient — choosing a name, voice, personality, and portrait — but today there is no guardrail between portrait selection and the patient seeing the Companion for the first time. The caregiver cannot preview the animated avatar or hear the intro greeting before it plays on the Tablet. The Tablet also remains on the Orb indefinitely after introduction, only transitioning to the live Companion avatar when the patient taps and starts a voice session.

## Solution

Introduce a required preview gate between portrait approval and Introduction. Once the Companion's Avatar Assets (idle loop video + intro audio) have finished generating, the caregiver dashboard surfaces a preview modal where the caregiver watches the avatar animate and hears the greeting the patient will hear. A single "Introduce [Name]" action — taken only after the audio plays through — simultaneously approves the avatar and unlocks it on the Tablet. The Tablet transitions from Orb to the live Companion avatar immediately on Introduction, without waiting for a voice session to start.

## User Stories

1. As a caregiver, I want to see a "Preparing your companion…" indicator after I approve the portrait, so that I know the system is generating the avatar assets and I should wait before introducing.
2. As a caregiver, I want the "Preparing your companion…" state to resolve automatically when assets are ready, so that I don't need to manually refresh the page.
3. As a caregiver, I want to preview the Companion's idle loop video before introducing, so that I can confirm the animated avatar looks right before my patient sees it.
4. As a caregiver, I want to hear the Companion's intro audio during the preview, so that I can confirm the greeting sounds warm and appropriate.
5. As a caregiver, I want the "Introduce" button to be disabled until the intro audio has played through at least once, so that I cannot accidentally introduce without having heard the greeting.
6. As a caregiver, I want a single "Introduce [Name]" action to both approve the avatar and unlock it on the Tablet, so that I don't have to take two separate steps.
7. As a caregiver, I want to choose when to open the preview modal, so that I can time the Introduction for a moment when my patient is calm and receptive.
8. As a caregiver, I want confirmation after introduction that the Tablet has been notified, so that I know to look at the Tablet.
9. As a patient, I want the Orb to transition directly to my Companion's animated avatar at the moment of Introduction, so that I see the Companion appear without needing to tap first.
10. As a patient, I want to hear the Companion's intro greeting play immediately on Introduction, so that the first meeting feels natural and welcoming.
11. As a patient using a web-based Tablet, I want the Orb to transition to the Companion avatar as soon as the caregiver introduces, so that the experience is the same as on a native device.
12. As a caregiver, I want the Pairing Code generation to remain available in the Patient page regardless of introduction status, so that I can pair the Tablet before or after introducing.
13. As a caregiver, I want to be able to pair the Tablet after Introduction and have the Tablet immediately show the live Companion (not the Orb), so that a replacement or secondary device works without re-introducing.

## Implementation Decisions

### Device Status endpoint extended to return companion snapshot

`GET /api/devices/status` currently returns `{ avatarUnlocked: boolean }`. It will be extended to return:

```
{
  avatarUnlocked: boolean,
  idleLoopVideoUrl: string | null,
  companionName: string | null,
  introAudioUrl: string | null
}
```

The companion snapshot is always returned (values are null when the Companion is not yet configured). The Tablet uses this endpoint for both the 4-second polling loop (web mode) and as a source of truth after receiving a push notification.

### Introduce endpoint push payload extended

`POST /api/companions/:companionId/introduce` push payload will include `idleLoopVideoUrl` alongside the existing `companionName` and `introAudioUrl`. The URL is a proper `https://` URL (not a base64 data URL) so it fits within Expo's 4 KB push payload limit. No change to the introduce logic itself — `avatarUnlocked` remains the single gate.

### Asset readiness polling in the caregiver dashboard

The companion query on the Patient page will tighten its `refetchInterval` to 3 seconds when `portraitUrl` is set but either `idleLoopVideoUrl` or `introAudioUrl` is null. Polling stops as soon as both fields are non-null. The `CompanionAvatar` component drives this behaviour by exposing a callback the parent uses to adjust the interval.

### Avatar Preview Modal

A new standalone modal component that:
- Plays the idle loop video in a circular frame (matching Tablet aesthetics)
- Auto-plays the intro audio on mount
- Keeps the "Introduce [Name]" button disabled until the audio's `onended` event fires at least once
- On button press: calls `POST /api/companions/:id/introduce`, shows a spinner, then on success shows a confirmation banner and closes
- On error: shows an inline error with a retry option

The modal is opened by `CompanionAvatar` and has no knowledge of the wider page.

### CompanionAvatar states

The component manages three visible states:

- **Preparing** (`portraitUrl` set, either asset null): spinner + "Preparing your companion…" label
- **Ready to introduce** (both assets non-null, `avatarUnlocked = false`): preview button active, "Ready to be introduced" label
- **Introduced** (`avatarUnlocked = true`): full-colour portrait, "Active companion" label

### Tablet App shell captures companion snapshot on unlock

`App.tsx` polling loop, on receiving `avatarUnlocked: true` from the status endpoint, captures `{ idleLoopVideoUrl, companionName, introAudioUrl }` alongside the unlock flag. These are passed as initial props to `CompanionScreen`. The native push path mirrors this: on receiving a `COMPANION_INTRO` notification, the handler now provides `idleLoopVideoUrl` and `companionName` in addition to `introAudioUrl`.

### CompanionScreen accepts initial companion data

`CompanionScreen` will accept `idleLoopVideoUrl` and `companionName` as initial props, initialising the corresponding state values on mount. This enables the orb → avatar transition immediately upon Introduction, without waiting for a voice session. The `useVoiceSession` hook continues to update these values on session start (e.g. if assets were refreshed after pairing).

### No new DB fields

`avatarUnlocked` on the `Companion` model remains the single boolean gate. No `avatarApproved` field is introduced. See ADR-0001.

### Idle loop video is a hard requirement for Introduction

The preview modal is only reachable when both `idleLoopVideoUrl` and `introAudioUrl` are non-null. Introduction is not available in environments where Simli is not configured. See ADR-0002.

## Testing Decisions

Good tests verify external behaviour through public interfaces — they do not assert on internal state or implementation details. A passing test should mean the feature works; a failing test should mean something visible to a user is broken.

### Modules to test

**Device Status endpoint (server integration test)**
- Assert the endpoint returns `{ avatarUnlocked: false, idleLoopVideoUrl: null, companionName: null, introAudioUrl: null }` for a paired device with no companion
- Assert it returns the full companion snapshot once `avatarUnlocked = true` and assets are populated
- Assert it returns 401 for an invalid device token
- Prior art: `server/tests/devices.test.ts`

**Introduce endpoint (server integration test — extend existing)**
- Assert that after introduction, a subsequent `GET /api/devices/status` call returns `idleLoopVideoUrl` and `companionName`
- Prior art: `server/tests/introduce.test.ts`

**Avatar Preview Modal (component test)**
- Assert the "Introduce" button is disabled on mount
- Assert the button becomes enabled after the audio `onended` event fires
- Assert clicking the button calls the introduce API
- Assert a confirmation message appears on success and an error message on failure
- Do not test video playback or audio content — test the state machine, not the media

### Modules not requiring dedicated tests

`CompanionAvatar` state transitions and `App.tsx` polling changes are covered adequately by the server integration tests and manual Tablet verification. The orb → avatar transition depends on React Native rendering and is better validated by the E2E pairing flow than a unit test.

## Out of Scope

- Re-introduction: `avatarUnlocked` cannot be reset. Changing the avatar after introduction is not addressed here.
- Multiple Tablets: the introduce push targets the most recent device with an Expo push token. Multi-device management is a separate concern.
- Asset regeneration: if the caregiver dislikes the idle loop video after generation, regenerating it is out of scope.
- Simli-less environments: Introduction is intentionally unavailable without a Simli API key. A dev workaround is not in scope.

## Further Notes

- The base64 data URL workaround for `introAudioUrl` (noted in `companion.ts`) should be resolved — replaced with a real hosted URL — before the push payload reliably carries intro audio to native devices. The Introduction flow will work without it (audio plays from the status endpoint response on web, and is fetched fresh on session start) but the native first-listen experience depends on it.
- Pairing and Introduction are intentionally independent. A Tablet paired after Introduction will immediately receive the companion snapshot (including `idleLoopVideoUrl`) from the status endpoint and skip the Orb entirely.
