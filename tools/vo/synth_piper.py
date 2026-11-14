"""S8 offline narration (user-authorised synthetic storyteller voice, 2026-11-14).
Piper (local neural TTS, no account/credential) -> speed 1.2 via length_scale -> +4 semitones, formant-preserving
(ffmpeg rubberband) -> 48 kHz mono WAV per line. Word timestamps: faster-whisper word alignment on each line,
mapped 1:1 onto the script tokens (sequence-matched; unmatched words interpolated). Writes audio/vo/<LINE>.wav and
<LINE>.words.json; then run tools/vo/import-recorded.ts to build spec/vo-manifest.json.
usage: python synth_piper.py <voice.onnx> [speaker_id] [--lines L01,L02]
"""
import json, re, subprocess, sys, wave, difflib, os
from piper import PiperVoice
from piper.config import SynthesisConfig
from faster_whisper import WhisperModel

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
style = json.load(open(f"{ROOT}/spec/style.json"))
script = json.load(open(f"{ROOT}/spec/script.json"))
voice_path = sys.argv[1]
speaker = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else None
only = None
if "--lines" in sys.argv: only = sys.argv[sys.argv.index("--lines") + 1].split(",")
V = style["voice"]
voice = PiperVoice.load(voice_path)
cfg = SynthesisConfig(length_scale=1 / V["speed"], noise_scale=0.55, noise_w_scale=0.6, speaker_id=speaker)
whisper = WhisperModel("tiny.en", device="cpu", compute_type="int8")
ratio = 2 ** (V["pitchSemitones"] / 12)
os.makedirs(f"{ROOT}/audio/vo", exist_ok=True)

def norm(w): return re.sub(r"[^a-z0-9']", "", w.lower().replace(",", ""))
NUM = {"4,015": "4015", "3,000": "3000", "4,000": "4000", "4,016": "4016"}

for line in script["lines"]:
    lid = line["line"]
    if only and lid not in only: continue
    text = line["text"].replace("“", '"').replace("”", '"')
    raw = f"/tmp/vo_{lid}_raw.wav"
    with wave.open(raw, "wb") as wf:
        voice.synthesize_wav(text, wf, syn_config=cfg)
    out = f"{ROOT}/audio/vo/{lid}.wav"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", raw, "-af",
                    f"rubberband=pitch={ratio:.5f}:formant=preserved,silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,aresample=48000",
                    "-ac", "1", out], check=True)
    pcm = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", out, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    import numpy as np
    audio16 = np.frombuffer(pcm, dtype=np.float32)
    segs, _ = whisper.transcribe(audio16, language="en", word_timestamps=True, initial_prompt=text, beam_size=5, vad_filter=False)
    hyp = [w for s in segs for w in s.words]
    toks = [t["text"] for t in line["tokens"]]
    a = [norm(NUM.get(t.strip('".?!'), t)) for t in toks]
    b = [norm(w.word) for w in hyp]
    times = [None] * len(toks)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size): times[blk.a + k] = (hyp[blk.b + k].start, hyp[blk.b + k].end)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], capture_output=True, text=True).stdout)
    matched = sum(t is not None for t in times)
    # interpolate unmatched tokens between known neighbours (logged as 'interpolated')
    for i in range(len(times)):
        if times[i] is None:
            prev = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), 0.0)
            nxt_i = next((j for j in range(i + 1, len(times)) if times[j]), None)
            nxt = times[nxt_i][0] if nxt_i is not None else dur
            gap = nxt_i - i if nxt_i is not None else len(times) - i
            step = (nxt - prev) / (gap + 0)
            times[i] = (prev, prev + step)
    words = [{"text": toks[i], "start": round(times[i][0], 3), "end": round(max(times[i][1], times[i][0] + 0.05), 3)} for i in range(len(toks))]
    json.dump(words, open(f"{ROOT}/audio/vo/{lid}.words.json", "w"), indent=1)
    print(json.dumps({"line": lid, "dur": round(dur, 3), "words": len(toks), "aligned": matched, "wps": round(len(toks) / dur, 2)}), flush=True)
