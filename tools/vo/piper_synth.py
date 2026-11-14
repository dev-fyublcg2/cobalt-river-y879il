"""S8 offline narration: Piper (LibriTTS-R medium, CC BY 4.0) -> audio/vo/<LINE>.raw.wav + <LINE>.words.json.
Word timings come from the model's own phoneme->sample alignment (phoneme_id_samples), mapped to script tokens by
phonemizing each token separately (numbers expand to several spoken words). Deterministic: noise scales = 0.
Usage: python tools/vo/piper_synth.py <voice.onnx> <speaker_id> <length_scale>
"""
import json, sys, wave
import numpy as np
from piper import PiperVoice, SynthesisConfig

model, speaker, length = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
script = json.load(open("spec/script.json"))
voice = PiperVoice.load(model, include_alignments=True)
sr = voice.config.sample_rate
id2ph = {}
for ph, ids in voice.config.phoneme_id_map.items():
    for i in ids: id2ph[i] = ph
cfg = SynthesisConfig(speaker_id=speaker, length_scale=length, noise_scale=0.0, noise_w_scale=0.0)
GAP = int(0.08 * sr)  # pause between sentence chunks inside a line

def tok_phon(text):
    return [w for sent in voice.phonemize(text) for w in "".join(sent).strip().split(" ") if any(ch.isalpha() for ch in w)]

def plen(w):
    return max(1, len([ch for ch in w if ch.isalpha()]))

def phoneme_words(text):
    n = 0
    for sent in voice.phonemize(text):
        s = "".join(sent).strip()
        n += len([w for w in s.split(" ") if any(ch.isalpha() for ch in w)])
    return max(1, n)

report = []
for line in script["lines"]:
    toks = [t["text"] for t in line["tokens"]]
    chunks = list(voice.synthesize(line["text"], cfg, include_alignments=True))
    audio, spans, t = [], [], 0  # spans: (start_sample, end_sample) per phoneme-word
    for ci, c in enumerate(chunks):
        if ci: audio.append(np.zeros(GAP, dtype=np.float32)); t += GAP
        cur = None
        pos = t
        for pid, ns in zip(c.phoneme_ids, c.phoneme_id_samples):
            ph = id2ph.get(pid, "")
            if ph == " " or ph in "^$.,?!;:\"" or ph == "_" and False:
                if cur is not None and ph != "_": spans.append(cur); cur = None
            elif ph != "_" and ph.strip():
                if cur is None: cur = [pos, pos + ns, ph]
                else: cur[1] = pos + ns; cur[2] += ph
            elif cur is not None and ph == "_":
                cur[1] = pos + ns
            pos += ns
        if cur is not None: spans.append(cur)
        audio.append(c.audio_float_array); t += len(c.audio_float_array)
    x = np.concatenate(audio)
    # each token -> its phoneme words; espeak sometimes merges function words in context, so walk spans and
    # consume tokens until their phoneme length covers the span, splitting merged spans by phoneme length
    tw = [tok_phon(tk) for tk in toks]
    units = [(ti, plen(w)) for ti, ws in enumerate(tw) for w in (ws or ["x"])]
    words_t = [[None, None] for _ in toks]
    u = 0
    for si, (a, b, ph) in enumerate(spans):
        need, got, group = plen(ph), 0, []
        while u < len(units) and (not group or (got < need * 0.75 and si == len(spans) - 1) or (got < need * 0.75)):
            group.append(units[u]); got += units[u][1]; u += 1
        if si == len(spans) - 1:
            while u < len(units): group.append(units[u]); got += units[u][1]; u += 1
        tot = sum(g[1] for g in group); acc = a
        for ti, l in group:
            d = (b - a) * l / tot
            if words_t[ti][0] is None: words_t[ti][0] = acc
            words_t[ti][1] = acc + d; acc += d
    ok = u == len(units) and all(w[0] is not None for w in words_t)
    counts = [len(w) for w in tw]
    words = [{"text": tk, "start": round(w[0] / sr, 3), "end": round(w[1] / sr, 3)} for tk, w in zip(toks, words_t)] if ok else []
    exact = sum(counts) == len(spans)
    report.append({"line": line["line"], "tokens": len(toks), "phonemeWords": len(spans), "expected": sum(counts), "aligned": ok, "exactSpanMatch": exact, "dur": round(len(x) / sr, 3)})
    with wave.open(f"audio/vo/{line['line']}.raw.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    json.dump(words if ok else None, open(f"audio/vo/{line['line']}.words.json", "w"))
json.dump({"engine": "piper-tts 1.8.0", "model": model.split("/")[-1], "speaker": speaker, "length_scale": length, "lines": report}, open("audio/vo/synth-report.json", "w"), indent=1)
bad = [r for r in report if not r["aligned"]]
print("inexact (merged spans split by phoneme length):", [r["line"] for r in report if not r["exactSpanMatch"]])
print("lines", len(report), "total speech s", round(sum(r["dur"] for r in report), 2), "unaligned", [(r["line"], r["phonemeWords"], r["expected"]) for r in bad])
