# QC report — THE DAY COUNTER

**Verdict: NOT PASSED. The rubric is NOT SCORED. No upload master exists.** The current film is `out/preview-animated-tts-captioned.mp4` (plus the uncaptioned `out/preview-animated-tts.mp4`, not committed). It is labelled "PREVIEW - OFFLINE TTS VO - NOT FOR UPLOAD" on frame and in the title metadata.

The narration is real synthesised speech: offline Piper, LibriTTS-R speaker 550, CC BY 4.0, +4 st (decision 16). It is a **fallback**: an adult TTS voice pitch-shifted up, not the bible §11 cast 11-year-old boy. **No person has listened to it or watched the film at 1x with sound.** I cannot hear audio; nothing below is an audio review. "Measured" = `qc/measurements.json`. "Visual review" = I looked at still frames (`qc/frames-12.png`).

## Gate status
| Gate | Status | Evidence |
|---|---|---|
| G0–G1 | PASS | test frame; bible md ↔ json test |
| G2 script | PASS (measured, VO-retimed) | 377 words, 86.35 s, 4.38 wps, ≤14 words/line |
| G3 board | PASS (measured) | 95 shots, max non-exempt 1.68 s, roll 0, caption-zone hits 0 |
| G4 assets | PASS except set timing | pose tests (incl. linked-hand gap 0–0.08 and lateral ≤0.03, clearance ≥0.15 under all micro-moves) |
| G5 animatic | MEASURED ONLY | real-VO timing in place; not reviewed with sound |
| G6 render | PREVIEW | animated: 838 full-res 3D samples at 8 fps, blended to 60 fps inside shots (decision 19) |
| G7 QC | MEASURED ONLY, NOT SCORED | below |
| G8 package | COPY DONE + CC BY credit | `out/package.md` |

## Measured on `out/preview-animated-tts-captioned.mp4`
| Check | Result |
|---|---|
| 1080x1920, 60/1 fps, H.264 High, faststart | pass |
| Pixel format | **FAIL: `yuvj420p`** (full-range flag inherited from the JPEG samples). Fix: add `-pix_fmt yuv420p -color_range tv` / `scale=out_range=tv` in the clip encode |
| Duration | 86.35 s, 5181 frames (84–92 s window: pass) |
| Cuts | 95 planned; scdet detected 91 (the others are same-set cuts below threshold) |
| Every cut has a sound | 96/96 windows above −45 dBFS (quietest −10.2) |
| Loudness | **−14.0 LUFS integrated: pass.** True peak **−0.8 dBTP: FAIL** (limit −1.0). Fix: true-peak limiter before AAC, or TP −1.5 in loudnorm |
| Caption sync vs VO in the final mix | 377/377 words matched; error median 2 ms, p95 5 ms, max 5 ms; 0 over 100 ms. Each VO line located in the mix by cross-correlation (max line offset 0 ms). Word times inside a line come from the TTS model's phoneme durations and are not re-measured acoustically |
| Tests | 23 pass, 0 fail |

## Visual review (12 sampled frames only)
- Captions read, the active word is yellow, the banner is visible, and faces stay above the caption band.
- Motion between samples was checked on S007 (linked hands) by frame differencing: the arms and heads move, and the hands stay joined.
- **Defect seen:** S068 (L29 MCU, "MY WRIST GOES"): June's held arm crosses in front of Milo's face. The ledger inserts' text is partly cut at the frame edge.

## Open defects (worst first)
1. Voice ≠ bible §11 casting (fallback TTS), unheard. Needed: an approved child-voice TTS connection (env credential, never in chat) or recorded narration as `audio/vo/<L>.wav` + `<L>.words.json`, then a person's listen and `approvedForMaster: true`.
2. True peak −0.8 dBTP and the `yuvj420p` flag (fixes above).
3. S068 arm over face; reframe (e.g. ECU −55 like S008) or a solo CU.
4. Motion is 8 fps samples cross-faded to 60 fps, not 60 distinct poses/s. Bloom and DOF are not implemented.
5. Face-subject share is 45% strict / 62% with MS (decision 5). Set still < 250 ms is unmeasured.
