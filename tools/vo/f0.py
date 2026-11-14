"""Median F0 (Hz) of voiced frames by autocorrelation: a measured stand-in for 'young/high' (no listening claimed)."""
import subprocess, sys, numpy as np
pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", sys.argv[1], "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
x = np.frombuffer(pcm, dtype=np.float32); f0 = []
for i in range(0, len(x) - 640, 320):
    fr = x[i:i + 640] * np.hanning(640)
    if np.sqrt((fr ** 2).mean()) < 0.02: continue
    ac = np.correlate(fr, fr, "full")[639:]; lo, hi = 16000 // 500, 16000 // 80
    k = lo + int(np.argmax(ac[lo:hi]))
    if ac[k] > 0.4 * ac[0]: f0.append(16000 / k)
print(round(float(np.median(f0)), 1) if f0 else 0)
