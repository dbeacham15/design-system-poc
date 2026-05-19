# Dashboard — Asset-readiness polling and "Preparing" state

## What to build

After portrait approval, the Companion's Avatar Assets (idle loop video and intro audio) are generated in the background and may take 30–60 seconds. Update `CompanionAvatar` on the Patient page to reflect this generating state and resolve automatically when assets are ready.

When `portraitUrl` is set on the Companion but either `idleLoopVideoUrl` or `introAudioUrl` is null, the component should:
- Show a "Preparing your companion…" spinner in place of the current portrait/initials
- Display a "Getting ready…" sub-label

The Patient page's companion query should tighten its `refetchInterval` to 3 seconds during this window and return to a relaxed interval (or stop polling) once both assets are non-null.

When both assets are present and `avatarUnlocked` is false, show the portrait in a "Ready to introduce" state — greyscale with a subtle pulsing ring — as the entry point to the preview modal (Issue #0004). This slice does not need to wire up the modal itself; a placeholder `onClick` is sufficient.

The three states to implement:

| State | Condition | Display |
|---|---|---|
| Preparing | `portraitUrl` set, either asset null | Spinner + "Preparing your companion…" |
| Ready | Both assets set, `avatarUnlocked = false` | Greyscale portrait + "Ready to introduce" |
| Introduced | `avatarUnlocked = true` | Full-colour portrait + "Active companion" |

## Acceptance criteria

- [ ] `CompanionAvatar` shows a spinner and "Preparing your companion…" after portrait approval while assets are generating
- [ ] The Patient page polls the companion record every 3 seconds during the preparing state
- [ ] The preparing state resolves automatically (no page refresh) when both `idleLoopVideoUrl` and `introAudioUrl` become non-null
- [ ] Once assets are ready, the component transitions to the "Ready to introduce" state with a greyscale portrait and pulsing ring
- [ ] Once introduced, the component shows the full-colour portrait with "Active companion"
- [ ] Polling stops once the companion is introduced

## Blocked by

None — can start immediately (parallel with Issue #0001)
