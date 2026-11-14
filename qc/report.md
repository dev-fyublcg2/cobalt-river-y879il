# QC report — THE DAY COUNTER

**Verdict: NOT PASSED. The rubric is NOT SCORED. No upload master exists.** Narration has not been supplied (`spec/vo-manifest.json` status `missing`), and no approved TTS access exists in the environment, so nothing was synthesised or substituted.

What exists is `out/preview-novo.mp4` and `out/preview-novo-captioned.mp4`. Both are labelled "PREVIEW - NO VO - NOT FOR UPLOAD" on frame and in the title metadata. They use PLANNED word timings.

The rubric and the critical-fail list need audio-visual review of a finished film with narration. I have not watched any film at 1x with sound, and I cannot hear it, so no rubric score is given. Below, "measured" means tool output (`qc/measurements.json`). "Visual review" means I looked at still images (contact sheets / sampled frames), nothing more.

## Gate status
| Gate | Status | Evidence |
|---|---|---|
| G0 scaffold | PASS | `pnpm g0` test frame |
| G1 bible | PASS (locked) | `tests/style-bible.test.ts` asserts md ↔ json agree |
| G2 script | PASS (measured) | 377 words, 87.72 s planned, 4.32 wps, ≤14 words/line, gags 12/12/12 |
| G3 board | PASS (measured) | 94 shots, 94 cuts, max non-exempt 1.85 s, roll 0, 0 identical consecutive framings, caption-zone hits 0 |
| G4 assets | PASS except set timing | 14 faces, 8 sets, 21 cast, 15 poses, 7 SFX + bed; every face/set/sfx in the shotlist exists (test). Pose tests: hands ≥0.15 clear of torso and feet on ground at 12 samples per pose, hold-hand gaps 0–0.08. **Not measured:** set still < 250 ms (still timings of 2.5–6 s include page setup, not GL time). |
| G5 animatic | BLOCKED (real VO required) | `qc/contact-1-48.png`, `qc/contact-49-94.png` stand in as the visual board |
| G6 render | PREVIEW ONLY | still + push-in assembly of all 94 shots; `final*.mp4` withheld until VO exists |
| G7 QC | MEASURED ONLY, NOT SCORED | below |
| G8 package | COPY DONE | `out/package.md`; the master file it points to does not exist yet |

## Measured on `out/preview-novo-captioned.mp4`
| Check | Result |
|---|---|
| 1080x1920, 60/1 fps, H.264 High, yuv420p, faststart | pass |
| Duration | 87.717 s, 5263 frames (= 87.717 × 60) |
| Cuts | 94 planned; scdet detected 87 (the other 7 are same-set cuts below the scdet threshold, not missing cuts) |
| Every cut has a sound | 95/95 cut windows peak above −45 dBFS (quietest −29.1) |
| Loudness | −25.2 LUFS integrated, −10.7 dBTP. **Fails −14 LUFS** by design: without VO there's nothing to master to dialogue loudness |
| Caption engine vs planned timings | every word starts within 40 ms (≤5 ms centisecond quantisation), ≤3 words per page (`tests/caption-sync.test.ts`) |
| Caption sync vs REAL VO | **SKIPPED: no VO**. Not claimed |
| Tests | `npx tsx --test tests/*.test.ts`: 22 pass, 0 fail, 1 skipped (real-VO sync) |

## Visual review (stills only)
- **Contact sheets of all 94 stills:** the first pass found 7 unreadable or blocked shots (S032, S044, S045, S065, S066, S076, S077). All were fixed through the board, and the cache re-rendered exactly those 7. I re-checked them on the second pass.
- **Sampled frames** (`qc/frames-12.png`): captions are Anton with an ink stroke, the active word is yellow, max 3 words, centred near the bottom, and faces stay out of the bottom band. The preview label is visible.

## Open defects (worst first)
1. **BLOCKER, narration.** The input needed:
   - an approved TTS connection that returns word timestamps, as an env credential (never in chat); or
   - recorded narration as `audio/vo/L01.wav` … `L39.wav` plus `audio/vo/<LINE>.words.json` (`[{text,start,end}]`).

   Voice spec: style bible §11. Then run `tsx tools/vo/import-recorded.ts && pnpm g2 && pnpm g3 && pnpm stills && pnpm assemble`. The import, retime and VO-mix/loudnorm code paths are **untested**, because no narration exists to exercise them.
2. Hold-hands two-shots (S006, S011, S013, S015) and hand inserts (S007, S063): the arms meet in a tangle that reads as crossed or melted at thumbnail size. The test confirms there's no geometric overlap, but it still looks bad. Fix: reframe these wider, or frame the hands out.
3. The preview is still + 2D push-in. Per-frame micro-moves (breath, arm settle, head turn) exist in `poses.ts`/`Shot.tsx` but aren't in the preview. Bloom 0.15 and the f/2.8 DOF pass are not implemented.
4. The face-subject rule only reaches 62% if MS counts; strict ECU/CU/MCU is 45% (decision 5).
5. Wide shots clamp the camera low (y 0.45), so the ground fills the lower frame. Set still < 250 ms is unmeasured.
6. Faces: worried and confused are the closest pair at 64 px greyscale.
