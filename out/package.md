# G8 package — THE DAY COUNTER

Status: copy is written; the upload master does NOT exist yet (VO blocked). Do not publish the `preview-novo*` files.

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
3. Captions are timed from the narration's word timestamps; sound effects and music are synthesised deterministically.

**The 3 files a human needs**
1. `out/final-captioned.mp4` (upload master), NOT YET PRODUCED: needs narration.
2. `qc/report.md`: gate status, measurements, fix list.
3. `out/package.md`: this file.
