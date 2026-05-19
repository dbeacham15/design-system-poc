# Dashboard — Avatar Preview Modal and Introduction

## What to build

Replace the current "click portrait to introduce" gesture with a full preview modal that lets the caregiver watch the Companion animate and hear the intro greeting before unlocking it on the Tablet.

**`AvatarPreviewModal` (new component):**
- Opens when the caregiver clicks the "Ready to introduce" portrait in `CompanionAvatar`
- Plays the idle loop video in a circular frame matching the Tablet aesthetic
- Auto-plays the intro audio on mount
- The "Introduce [Name]" button is **disabled** until the audio's `onended` event fires at least once — enforcing that the caregiver has heard the greeting
- On button press: calls `POST /api/companions/:companionId/introduce`, shows a loading spinner
- On success: shows a "Introduction sent — watch [patient name]'s tablet." confirmation banner, then closes
- On error: shows an inline error with a retry option

**`CompanionAvatar` wiring:**
- Remove the existing direct introduce-on-click behaviour
- When in the "Ready to introduce" state, clicking the portrait opens `AvatarPreviewModal`
- On modal success, trigger the parent's `onUnlocked` callback as before

**Tests (`AvatarPreviewModal`):**
- "Introduce" button is disabled on mount
- Button becomes enabled after `onended` fires
- Clicking the button calls the introduce API
- Confirmation message appears on API success
- Error message appears on API failure with retry available

Test the state machine only — do not test video playback or audio content.

## Acceptance criteria

- [ ] Clicking a "Ready to introduce" portrait opens the preview modal
- [ ] The idle loop video plays in the modal
- [ ] The intro audio plays automatically when the modal opens
- [ ] "Introduce [Name]" button is disabled until the intro audio has played through at least once
- [ ] Clicking the button fires `POST /api/companions/:companionId/introduce`
- [ ] A confirmation banner appears on success and the modal closes
- [ ] An inline error with retry appears on API failure
- [ ] After introduction, `CompanionAvatar` shows the full-colour portrait with "Active companion"
- [ ] The component tests for the state machine pass

## Blocked by

- Issue #0003 — Dashboard asset-readiness polling and "Preparing" state
