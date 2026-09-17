import type { IntentionQuality } from '../types';

const VAGUE =
  /\b(happier|better person|more successful|someday|try to|work on myself|be more|feel more|manifest|abundance|vibes|aligned|my best self)\b/i;

const FEELING_EVIDENCE = /\b(i'll know|i will know|feel|happy|proud|aligned|motivated|inspired)\b/i;

const OPERATIONAL_VERB =
  /\b(send|ship|write|build|close|deliver|complete|publish|file|sign|launch|book|hire|pay|sell|finish|produce|record|submit|open|move|install|negotiate|establish|secure|replace|reduce|increase|save|earn|collect|schedule|train|repair|relocate|acquire)\b/i;

export function assessIntention(statement: string, evidence: string): IntentionQuality {
  const notes: string[] = [];
  const s = statement.trim();
  const e = evidence.trim();

  if (s.length < 24) {
    notes.push('The vision is too short to be operational.');
  }
  if (VAGUE.test(s)) {
    notes.push('The vision is motivational language. Replace it with an observable outcome.');
  }
  if (!OPERATIONAL_VERB.test(s)) {
    notes.push('Name the work with a concrete verb. What will exist that does not exist now?');
  }
  if (e.length < 20) {
    notes.push('Evidence is too thin. Name what a third party could verify.');
  }
  if (FEELING_EVIDENCE.test(e)) {
    notes.push('Evidence cannot be a feeling.');
  }

  return { ok: notes.length === 0, notes };
}
