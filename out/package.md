# G8 package — THE DAY COUNTER

Status: copy is written. The current video is `out/preview-animated-tts-captioned.mp4`: an animated preview with an **offline TTS fallback voice**, banner "PREVIEW - OFFLINE TTS VO - NOT FOR UPLOAD". It is not the upload master. The voice doesn't meet the bible §11 casting (a real/approved 11-year-old boy read), and no person has signed off on the film (`approvedForMaster`).

**Title** (57 chars, max 60): `He Gave His Sister Every Day He Had Left. Then He Woke Up`
> Checked against the brief: curiosity (woke up?) + stakes (every day), no lie (he does give them all and does wake up).

**Thumbnail spec**
- One face: Milo, `surprised` sprite, CU framing as in S079 (bedroom, golden mood), face in the upper 45% of the frame.
- One number: his wrist tag reading `0`, raised into frame lower-right, scaled to 30% of frame width, accent #FFD400 rim.
- 3 words: `I GAVE EVERYTHING`, Anton, white with a 10 px #111111 stroke, top-left.
- Source frame: regenerate with `pnpm stills S079` and composite. No baked perspective text beyond the wrist tag.

**Description**
In the town of Tally, the number on your wrist is how many days you have left, and anyone can see it. You can give days away. You can never take them back. Milo has 4,015. His little sister June has 4. So he finds out what the rule nobody reads actually says.

**Hashtags**: #shorts #robloxstory #storytime #animation #plottwist

**How this was made**
1. Every shot is code: primitive blocky sets and 6-part avatars in three.js, flat sprite faces swapped per shot, no lip sync.
2. The film is data (`spec/script.json`, `spec/shotlist.json`), so video #2 is a data change; renders are cached per shot hash.
3. Captions are timed from the narration's word timestamps (the TTS model's phoneme durations); narration, sound effects and music are synthesised deterministically offline.

**Narration credit (required by CC BY 4.0 if the TTS voice is ever published)**
> Narration synthesised with Piper (github.com/rhasspy/piper) using the voice `en_US-libritts_r-medium`, speaker 550, licensed CC BY 4.0. The voice was trained on LibriTTS-R (Koizumi et al., 2023; CC BY 4.0), derived from LibriVox public-domain recordings. Modified: pitch shifted +4 semitones and time-aligned. Model card: `audio/vo/VOICE_MODEL_CARD.txt`.

**The 3 files a human needs**
1. `out/final-captioned.mp4` (upload master), NOT YET PRODUCED. It needs approved narration (or a decision to accept the TTS fallback) and a person's sign-off (`approvedForMaster: true` in `spec/vo-manifest.json`). Current stand-in: `out/preview-animated-tts-captioned.mp4`.
2. `qc/report.md`: gate status, measurements, fix list.
3. `out/package.md`: this file.
