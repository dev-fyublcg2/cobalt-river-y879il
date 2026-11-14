# QC report — THE DAY COUNTER

**Verdict: NOT PASSED / NOT SCORED.** There is no MP4 with narration yet, and nobody has watched a finished film end to end. So none of the rubric was scored: per S11, a film that was not watched end to end cannot be passed. Every number below is a measurement, not an opinion, unless it is labelled as a visual review.

## Gate status
| Gate | Status | Evidence |
|---|---|---|
| G0 scaffold | PASS | `pnpm g0` renders a test frame (`out/frames/g0-test-shot.png`), ~1.5 s per still |
| G1 bible | PASS (locked) | `spec/style-bible.md` + `spec/style.json` |
| G2 script | PASS (measured) | 377 words, planned 87.72 s, 4.32 wps overall, max 14 words/line, gags 12/12/12 words |
| G3 board | PASS (measured) | 94 shots, 94 cuts, longest non-exempt shot 1.85 s, 0 roll, 0 identical consecutive framings, 8 sets |
| G4 assets | PARTIAL | 14 faces, 8 set builders, 21-character cast, 15 poses, 7 SFX, music bed exist (files listed in PR). Not done: the set <250 ms timing test and the interpenetration contact-sheet test. |
| G5 animatic | BLOCKED | needs real VO. Stills render at ~4–6 s per shot; the full 94-still pass did not finish in the session. |
| G6 render | NOT DONE | still + push-in assembly (`tools/render/assemble.ts`) is written but was not run on all shots. |
| G7 QC | NOT DONE | no MP4 to score |
| G8 package | NOT DONE | — |

## Measured / observed facts
- Caption-zone hits from geometric projection (G3): S043/S064 wrist tags at y=0.78–0.93, and the S066 boat sign at y=0.90. **Fix:** reframe these shots or crop the hands out.
- Visual review of 4 test stills (S001, S005, S017, S061; my own look at the PNGs): faces, signs and wrist numbers render and read. Defects:
  1. **S005 (MCU, showWrist):** the raised arm covers the speaker's face. **Fix:** use the checkWrist pose, or az ±30.
  2. **Sky:** renders as a flat colour; the gradient sky texture failed and fell back to a solid colour.
  3. **Wide shots:** the camera is clamped low (y 0.45), so the ground fills the lower half.
- Face sheet at 64 px greyscale (`qc/faces-64-grey.png`, my visual review): 13/14 are distinct. Worried and confused are the closest pair.
- Not run, so no sync claim is made: the audio LUFS/true-peak measurement and the caption ±40 ms sync test. Both depend on VO.

## Fix list (worst first)
1. BLOCKER: provide narration, either an approved TTS connection or 350–400 words of recorded VO (see PR for the spec).
2. Finish the 94-still pass (`pnpm stills`, cached and resumable), then run `pnpm assemble`.
3. Add the bloom 0.15 + DOF post pass, and per-frame micro-moves (currently only in the per-frame `Shot` path, not in the stills preview).
4. Reframe S005, S043, S064 and S066. Restore the gradient sky.
5. Write the caption-sync test and the interpenetration/set-timing tests, then run QC on the real MP4.
