# Decisions & conflict log (orchestrator)

All roles in the brief (S1–S12) were run sequentially by one agent; no subagents were spawned.

| # | Conflict / decision | Resolution |
|---|---|---|
| 1 | Beat word budgets sum to 306 words, but the hard spec is 350–400 words at 4.0–5.0 wps over 88 s | Kept the beat order and scaled the lines to 377 words (planned 4.32 wps overall, 87.72 s). |
| 2 | Beat 9 VO is fixed at 13 words, which can't fill 80–88 s at ≥4 wps | Beat 8 runs to 84.0 s (target 80) and beat 9 runs 84.2–87.3 s, then black + 0.4 s room tone. |
| 3 | "GAGS x3, one shot each" vs "no shot > 2.2 s" (each gag is ~2.9 s of VO) | Each gag is 1 setup shot + 1 punch shot. Gags are ≤12 words each (12/12/12). |
| 4 | "/src/scenes/*.tsx one component per shot" vs "next video is a data change" | One data-driven `Shot.tsx`, registered as one Remotion composition per shot id (`shot-S001`…). |
| 5 | "Face is the subject in ≥60% of shots" | Strict ECU/CU/MCU = 42/94 (45%). Counting MS (head 230 px ≈ 21% of frame width in 9:16) = 58/94 (62%). Logged as an interpretation; QC flags it. |
| 6 | Pitch +8.5° for every shot makes up-facing wrist/ledger planes unreadable | Inserts (INS) look straight at the text plane, with roll still 0. Character framings keep pitch +8.5°, roll 0. |
| 7 | Hair/clothing shells vs "6-part avatars" | Body is exactly 6 parts. Clothes and hair are separate shells (+0.02 units) per the "cheap clothes" fix. |
| 8 | Night scenes vs "two moods only" | Night (mirror practice, room alone) uses the cold dawn mood. |
| 9 | Env limits: 1 CPU, ~400 ms/frame for trivial 3D → full 60 fps 3D (5,280 frames) exceeds the session budget | Per the brief's "default to stills": 1 3D still per shot + ffmpeg push-in 1.04→1.22 (smoothstep approximation of the bezier). Per-frame micro-moves (breath/arm settle/head turn) are implemented in `poses.ts` and drive the `Shot` composition, but are NOT in the still-based preview. Bloom and DOF were not implemented; vignette is applied in ffmpeg. |
| 10 | Captions: @remotion/captions preferred | Burned in with libass ASS (Anton from /assets/fonts) for render time; layout/pop/colour per bible §9. |
| 11 | No TTS credential / recording (only an AWS Bedrock token for the LLM, not a speech service) | VO BLOCKED. Nothing was synthesised or faked. Outputs are named `preview-novo*`, and `final*.mp4` are only written once `vo-manifest.json` status = ok. Captions/ducking use the PLANNED timings. |
