# THE DAY COUNTER — Style Bible (LOCKED at G1)

Status: LOCKED. Machine mirror: `/spec/style.json` (code reads only that file; `tests/style-bible.test.ts`
asserts every number below matches it). Conflicts with the brief are logged in `/spec/decisions.md`.
Rule: this file beats any builder's taste. Changing a value = edit both files + re-run `pnpm gates`.

## 1. Format
| Item | Value |
|---|---|
| Resolution | 1080 x 1920 px |
| Frame rate | 60 fps (exact, constant) |
| Duration | 88.0 s target, +/- 4.0 s hard tolerance (84-92 s critical) |
| Video | H.264 High, yuv420p, CRF 18, +faststart |
| Audio | AAC 48000 Hz stereo, 256 kbps |

## 2. Pacing
| Item | Value |
|---|---|
| Shots | 95 +/- 10 |
| Hard cuts | 85-125 |
| Max shot length | 2.2 s (final 3 shots exempt) |
| VO words | 350-400 total, max 14 per line |
| VO pace | 4.0-5.0 words/s; planning pace 4.6 words/s |
| Planned pauses | 0.12 s between lines, 0.22 s between beats |
| Ending | hard cut to black on the last word, 0.4 s room tone |

## 3. Camera
| Item | Value |
|---|---|
| Lens | 40 mm equivalent on 36 mm long side, vertical FOV 48.46 deg |
| Depth of field | f/2.8 look: bokeh aperture 0.0035, max blur 0.006, focus on subject face |
| Pitch / roll | +8.5 deg up / 0 deg (no dutch angles) |
| Shake | 0 deg used, +/- 0.3 deg hard cap; whip-pans: none |
| Horizon | 0.667 of frame height from top (lower third) |
| Subject face | centre at <= 0.333 of frame height from top, target 0.30 |
| Push-in | every shot, zoom 1.04 -> 1.22 over the shot, cubic-bezier(0.42, 0, 0.58, 1) |
| Framings (head height in px at zoom 1.0) | ECU 1050, CU 640, MCU 400, MS 230, WS 110, EWS 48 |
| Caption-safe zone | bottom 0.22 of frame (y >= 1498 px): no face centres, no readable world text |
| Cuts | land on VO word starts (shot t0 = word start time) |

## 4. Lighting
| Item | Golden afternoon | Cold dawn |
|---|---|---|
| Key colour | #FFD9A0 | #A9C7FF |
| Sky ambient colour | #6FA8FF | #24304F |
| Rim colour | #6FA8FF | #CFE0FF |
| Ground bounce colour | #5FA83F | #24304F |
| Background gradient (top -> horizon) | #7EC8F0 -> #CFEAF7 | #24304F -> #A9C7FF |

| Light | Value |
|---|---|
| Key | directional, azimuth 35 deg from camera axis, elevation 40 deg, intensity 2.6, 1024 px shadow map |
| Rim | directional, azimuth 160 deg, elevation 30 deg, intensity 1.6 |
| Sky ambient | hemisphere, intensity 0.35 |
| Bloom | strength 0.15, radius 0.4, threshold 0.85 |
| Vignette | radial, inner 0.55, outer 1.05 of half-diagonal, opacity 0.28 #111111 |
| Tone mapping | none, exposure 1.0 (palette hexes render as authored) |

## 5. Palette
| Name | Hex |
|---|---|
| sky | #7EC8F0 |
| grass | #5FA83F |
| asphalt | #4A4E52 |
| skin | #F2C48D |
| accent | #FFD400 |
| ink | #111111 |
| white | #FFFFFF |
| wood | #9A6B3F |
| water | #3E7FB0 |
| wall | #E8DCC6 |
| brick | #B5523B |
| paper | #F4ECD8 |

## 6. Faces
| Item | Value |
|---|---|
| Expressions (14) | neutral, blink, happy, laugh, worried, scared, sad, crying, determined, surprised, smug, confused, angry, deadpan |
| File | 512 x 512 px transparent PNG, `/assets/faces/<expression>.png` |
| Line | 18 px #111111 outline, 2 shade tones per filled shape |
| Placement | flat plane, 0.92 of the head front face, 0 bones, 0 lip sync, 0 eyelid rigs |
| Swap rule | 1 face per character per shot |
| Legibility test | identifiable at 64 px wide in greyscale (`qc/faces-64-grey.png`) |

## 7. Avatars
| Item | Value |
|---|---|
| Parts | 6: head, torso, armL, armR, legL, legR (no fingers, toes, ears) |
| Sizes (units) | head 1.25 x 1.2 x 1.2, torso 2.0 x 2.0 x 1.0, arm 1.0 x 2.0 x 1.0, leg 1.0 x 2.0 x 1.0 |
| Pivots | arms at shoulder top, legs at hip top |
| Arm gap | 0.15 units between arm inner face and torso |
| Hand clearance | hand volume >= 0.15 units outside the torso volume, every sampled frame |
| Clothes | second box +0.02 units per side, 3-colour pattern |
| Micro-moves | breath bob 0.035 units / 2.4 s period; arm settle 8 deg over 0.35 s; head turn 10 deg over the shot; torso sway 1.6 deg / 3.1 s; held-stride arm swing 5 deg / 1.6 s |
| Animation sampling | 3D rendered at 8 fps per shot (own samples incl. endpoint), blended to 60 fps inside each shot only (cuts stay hard) |
| Hand-holding | camera-side hand only on each partner; the far arm hangs at rest |
| Locomotion | 0 units of root translation inside a shot (no foot sliding by construction) |

## 8. Sets
| Item | Value |
|---|---|
| Count | 8: street, kitchen, clinic, clerkOffice, dock, bedroom, schoolyard, townSquare |
| Geometry | boxes, wedges, cylinders only; 0 imported meshes |
| Diegetic text | >= 3 readable objects per set, font Luckiest Guy (local file) |
| Budget | still render < 250 ms per set (measured, `qc/set-timings.json`) |

## 9. Captions
| Item | Value |
|---|---|
| Font | Anton (local `/assets/fonts/Anton-Regular.ttf`), 118 px, line height 1.08, uppercase |
| Layout | max 3 words per line, max 2 lines, centred, bottom edge 0.07 of height (134 px) from bottom |
| Fill / stroke | #FFFFFF fill, 7 px #111111 stroke |
| Shadow | 0 px 6 px 14 px rgba(0,0,0,0.55) |
| Active word | #FFD400, scale 1.00 -> 1.06 over 80 ms |
| Sync | word start within 40 ms of VO word timestamp (100 ms = critical fail) |

## 10. Sound
| Item | Value |
|---|---|
| Music bed | -22 dBFS RMS, ducked -8 dB under VO, 80 ms attack, 220 ms release, VO gaps < 300 ms merged |
| Cut SFX | -14 dBFS peak, 1 per cut |
| VO | -8 dBFS peak |
| Master | -14.0 LUFS integrated (+/- 0.5), true peak <= -1.0 dBTP |
| SFX vocabulary | whoosh, tick, pop, thud, paper, bell, roomtone (7 of max 8) |
| Seed | 20261114 (all synthesis deterministic) |

## 11. Voice
| Item | Value |
|---|---|
| Casting | boy, 11, deadpan, fast, cartoon-bright, dry close mic, 0 reverb, 0 radio EQ |
| Speed | 1.2 (allowed 1.15-1.25) |
| Pitch | +4 semitones (allowed +3 to +5), formant-preserving, duration-preserving |
| Reference timbres | 1 young boy cartoon lead (bright, nasal-forward); 2 kids'-TV narrator (dry, clipped); 3 deadpan sitcom kid (flat affect, fast) |
| Selection | A/B 2 renders of line L01, pick 1, log in `/spec/decisions.md` |

## 12. Determinism
| Item | Value |
|---|---|
| Time source | frame index only (0 Date.now, 0 requestAnimationFrame, 0 Math.random in render) |
| Seeds | render 1114, audio 20261114 |
| Network at render | 0 calls; fonts from `/assets/fonts` only |
| Shot cache | key = sha256(shot JSON + style.json + asset source hashes), `/out/cache/shots/<key>.mp4` |
| GL | ANGLE SwiftShader (`swangle`), concurrency 1 |
