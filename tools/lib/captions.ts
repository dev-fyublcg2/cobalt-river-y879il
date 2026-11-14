// Caption paging + ASS generation (style bible §9). Pure functions so tests/caption-sync.test.ts can assert timing.
export type Word = { text: string; start: number; end: number };
export type CaptionEvent = { start: number; end: number; page: number; activeIndex: number; words: string[] };

const cs = (t: number) => Math.round(t * 100) / 100; // ASS timestamps are centiseconds

export function paginate(words: Word[], maxWords: number): Word[][] {
  const pages: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length === maxWords || /[.?!,"”]$/.test(w.text)) { pages.push(cur); cur = []; }
  }
  if (cur.length) pages.push(cur);
  return pages;
}

export const display = (s: string) => s.replace(/["“”]/g, "").toUpperCase();

/** One event per word: the page is shown with that word active, starting exactly at the word's start (cs-quantised). */
export function captionEvents(words: Word[], maxWords: number, hardEnd: number): CaptionEvent[] {
  const pages = paginate(words, maxWords);
  const ev: CaptionEvent[] = [];
  pages.forEach((pg, pi) => {
    const pageEnd = pi + 1 < pages.length ? Math.min(pages[pi + 1][0].start, pg[pg.length - 1].end + 0.25) : pg[pg.length - 1].end;
    pg.forEach((w, wi) => {
      const end = wi + 1 < pg.length ? pg[wi + 1].start : pageEnd;
      ev.push({ start: cs(w.start), end: cs(Math.min(end, hardEnd)), page: pi, activeIndex: wi, words: pg.map((x) => display(x.text)) });
    });
  });
  return ev;
}

const ts = (t: number) => {
  const c = Math.round(t * 100);
  return `${Math.floor(c / 360000)}:${String(Math.floor(c / 6000) % 60).padStart(2, "0")}:${String(Math.floor(c / 100) % 60).padStart(2, "0")}.${String(c % 100).padStart(2, "0")}`;
};

export function toAss(ev: CaptionEvent[], C: any, W: number, H: number): string {
  let ass = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\nWrapStyle: 2\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Cap,${C.font},${C.fontPx},&H00FFFFFF,&H00FFFFFF,&H00111111,&H73000000,0,0,0,0,100,100,2,0,1,${C.strokePx},6,2,40,40,${Math.round(C.bottomFrac * H)},1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  for (const e of ev) {
    // active word: #FFD400 (ASS is &HBBGGRR) with a 1.00 -> 1.06 scale pop over popMs
    const txt = e.words.map((x, k) => (k === e.activeIndex ? `{\\c&H00D4FF&\\fscx100\\fscy100\\t(0,${C.popMs},\\fscx${Math.round(C.popScale * 100)}\\fscy${Math.round(C.popScale * 100)})}${x}{\\r}` : x)).join(" ");
    ass += `Dialogue: 0,${ts(e.start)},${ts(e.end)},Cap,,0,0,0,,${txt}\n`;
  }
  return ass;
}
