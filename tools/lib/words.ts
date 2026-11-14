// Word tokenisation + syllable estimate. Shared by script planning, captions and the VO manifest.
// A "word" is a whitespace-separated token with at least one letter or digit ("4,015" = 1 word).

export type Token = { i: number; text: string; clean: string };

export function tokenize(line: string): Token[] {
  return line
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t))
    .map((text, i) => ({ i, text, clean: normalizeWord(text) }));
}

/** Lowercase, strip surrounding punctuation/quotes; keeps inner apostrophes, hyphens, digits, commas in numbers. */
export function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

export function numberToWords(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
  if (n < 1000) return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + numberToWords(n % 100) : "");
  return numberToWords(Math.floor(n / 1000)) + " thousand" + (n % 1000 ? " " + numberToWords(n % 1000) : "");
}

/** Spoken form used for syllable counting / TTS alignment of numeric tokens. */
export function spoken(clean: string): string {
  const digits = clean.replace(/,/g, "");
  if (/^\d+$/.test(digits)) return numberToWords(parseInt(digits, 10));
  return clean;
}

export function syllables(clean: string): number {
  return spoken(clean)
    .split(/[\s-]+/)
    .filter(Boolean)
    .reduce((acc, w) => {
      const s = w.replace(/'/g, "").replace(/e$/, "").match(/[aeiouy]+/g)?.length ?? 1;
      return acc + Math.max(1, s);
    }, 0);
}
