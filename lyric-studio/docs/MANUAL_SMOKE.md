# Manual Smoke Test

After any meaningful change, run through this:

1. `./doctor.sh` — all green.
2. `./start.sh` — both services boot, browser at http://localhost:3000.
3. Empty state visible.
4. Create new project (use any short MP3/WAV). Wait for analysis.
5. Verify BPM, key, genre show on the project page.
6. Drag on the waveform → section created.
7. Rename section. Set lines per phrase.
8. **[DEFERRED]** Click "Generate notes" — verify notes appear (~2-5 sec). *Wired by Task 16 once `ANTHROPIC_API_KEY` is configured.*
9. Add a line. Type lyrics. Verify syllable counter updates.
10. **[DEFERRED]** Click Rhyme → verify popover with rhymes. Pick one. *Wired by Task 18 once `ANTHROPIC_API_KEY` is configured.*
11. **[DEFERRED]** Click Polish → verify polished version. Accept. *Wired by Task 19 once `ANTHROPIC_API_KEY` is configured.*
12. Click ▶ Play — verify lines highlight in time.
13. Click [♪] on a line — verify only that bar range plays.
14. Click Download zip — verify zip appears + `~/Music/lyric-studio/<slug>/` populated.
15. Open `lyrics.json` — verify per-line `time_start_ms`/`time_end_ms` present.
16. Soft-delete the project — disappears from list, appears in `/trash`.
17. Restore — returns to list.
18. Permanently delete from trash — gone for good.

> **AI features (steps 8, 10, 11) are deferred.** Tasks 16, 18, 19, 20 will land once `ANTHROPIC_API_KEY` is configured. Until then those buttons are not wired and the smoke test can be considered passing if every non-deferred step succeeds.
