const FEELING = /\b(happy|joy|peace|abundant|aligned|inspired|vibes|manifest|best self)\b/i;

export function assessVisualization(seen: string, noLonger: string, tuesday: string): {
  ok: boolean;
  notes: string[];
} {
  const notes: string[] = [];
  if (seen.trim().length < 20) {
    notes.push('Name what a third party can see. Not a feeling.');
  }
  if (noLonger.trim().length < 12) {
    notes.push('Name what is no longer true.');
  }
  if (tuesday.trim().length < 20) {
    notes.push('Describe a normal Tuesday, not a ceremony.');
  }
  if (FEELING.test(seen) || FEELING.test(tuesday)) {
    notes.push('Keep the picture observable. Feelings are not context.');
  }
  return { ok: notes.length === 0, notes };
}
