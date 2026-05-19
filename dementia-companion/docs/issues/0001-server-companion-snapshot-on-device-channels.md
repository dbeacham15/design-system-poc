# Server — Companion snapshot on device communication channels

## What to build

Extend the two channels through which the Tablet learns about Introduction so that both carry the full companion snapshot needed to transition from Orb to live avatar.

**Status endpoint:** `GET /api/devices/status` currently returns `{ avatarUnlocked: boolean }`. Extend it to return:

```
{
  avatarUnlocked: boolean,
  idleLoopVideoUrl: string | null,
  companionName: string | null,
  introAudioUrl: string | null
}
```

Values are `null` when no Companion is configured for the patient. The shape is the same regardless of `avatarUnlocked` — the Tablet should not need to branch on the unlock state to read the snapshot.

**Push payload:** `POST /api/companions/:companionId/introduce` currently sends a `COMPANION_INTRO` push notification with `companionName` and `introAudioUrl`. Add `idleLoopVideoUrl` to the push data. The value is a proper `https://` URL (not a base64 data URL) so it fits comfortably within Expo's 4 KB payload limit.

No changes to introduce logic or the `avatarUnlocked` gate.

## Acceptance criteria

- [ ] `GET /api/devices/status` returns `idleLoopVideoUrl`, `companionName`, and `introAudioUrl` alongside `avatarUnlocked` for an authenticated device token
- [ ] All four fields are `null` when no Companion is configured for the patient
- [ ] `idleLoopVideoUrl` and `companionName` reflect the Companion's current values once assets are generated
- [ ] `POST /api/companions/:companionId/introduce` push payload includes `idleLoopVideoUrl`
- [ ] Existing introduce tests continue to pass
- [ ] New integration tests cover the status endpoint snapshot shape (locked and unlocked states)
- [ ] Unauthenticated requests to the status endpoint return 401

## Blocked by

None — can start immediately
