import type { ConnectionStage, EvidenceGrade, EvidencePayloadType, EvidenceRecord } from "@/types";

const VAGUE =
  /\b(happy|joy|peace|abundant|aligned|inspired|vibes|manifest|best self|felt good|tried|worked on|thought about)\b/i;
const CONCRETE =
  /\b(sent|signed|filed|paid|received|published|shipped|scheduled|invoice|contract|email|page|url|file|metric|desk|room|client|order|draft|link|calendar|amount|date|number|#)\b/i;
const OUTCOME =
  /\b(exists|existed|is live|was sent|signed|filed|paid|received|published|delivered|completed|recorded|opened|closed|now on|in the world)\b/i;

const MIN_RESULT = 24;
const STRONG_RESULT = 48;
const MIN_TEXT = 40;
const THIN_TEXT = 60;
const STRONG_TEXT = 80;
const MIN_MEDIA_BYTES = 8 * 1024;
const WEAK_MEDIA_BYTES = 20 * 1024;

export const MAX_EVIDENCE_BYTES = 3 * 1024 * 1024;

export const LOW_RESOLUTION_NOTE =
  "This evidence is too low-resolution to meaningfully update the vision. Add a clearer description of the concrete result.";

export const WEAK_RECORD_NOTE =
  "This record is low-resolution. It will complete the action at reduced density and will not count toward a turning point.";

export const EVIDENCE_WEIGHT: Record<EvidenceGrade, number> = {
  insufficient: 0,
  weak: 0.35,
  standard: 0.75,
  strong: 1,
};

export type EvidenceDraft = {
  type: EvidencePayloadType;
  content: string;
  result: string;
  connectionStage?: ConnectionStage;
};

export type EvidenceQuality = {
  grade: EvidenceGrade;
  ok: boolean;
  notes: string[];
  weight: number;
  countsTowardThreshold: boolean;
};

export function emptyEvidenceDraft(): EvidenceDraft {
  return { type: "text", content: "", result: "" };
}

export function evidenceWeight(grade: EvidenceGrade | undefined): number {
  return EVIDENCE_WEIGHT[grade ?? "standard"];
}

export function countsTowardThreshold(record: EvidenceRecord): boolean {
  const grade = record.grade ?? "standard";
  return grade === "standard" || grade === "strong";
}

export function formatEvidenceRef(n: number): string {
  return `EV-${String(n).padStart(4, "0")}`;
}

export function parseEvidenceRef(reference: string | undefined): number | null {
  if (!reference) return null;
  const match = /^EV-(\d+)$/.exec(reference.trim());
  return match ? Number(match[1]) : null;
}

export function nextEvidenceRef(records: EvidenceRecord[]): string {
  let max = 0;
  for (const record of records) {
    const n = parseEvidenceRef(record.reference);
    if (n !== null && n > max) max = n;
  }
  return formatEvidenceRef(max + 1);
}

export function assignEvidenceRefs(records: EvidenceRecord[]): EvidenceRecord[] {
  const assigned = new Map<string, string>();
  let max = 0;
  for (const record of records) {
    const n = parseEvidenceRef(record.reference);
    if (n !== null) {
      assigned.set(record.id, formatEvidenceRef(n));
      if (n > max) max = n;
    }
  }
  const missing = [...records]
    .filter((record) => !assigned.has(record.id))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id));
  for (const record of missing) {
    max += 1;
    assigned.set(record.id, formatEvidenceRef(max));
  }
  return records.map((record) => ({
    ...normalizeEvidenceRecord(record),
    reference: assigned.get(record.id) ?? nextEvidenceRef(records),
  }));
}

export function normalizeEvidenceRecord(record: EvidenceRecord): EvidenceRecord {
  return {
    ...record,
    result: record.result ?? "",
    grade: record.grade ?? "standard",
    reference: record.reference ?? "",
  };
}

export function evidenceGradeLabel(grade: EvidenceGrade | undefined): string {
  switch (grade ?? "standard") {
    case "strong":
      return "High resolution";
    case "standard":
      return "Meets standard";
    case "weak":
      return "Low resolution";
    case "insufficient":
      return "Does not meet standard";
  }
}

function hasVague(text: string): boolean {
  return VAGUE.test(text);
}

function hasConcrete(text: string): boolean {
  return CONCRETE.test(text);
}

function hasOutcome(text: string): boolean {
  return OUTCOME.test(text);
}

function dataUrlBytes(content: string): number {
  const comma = content.indexOf(",");
  const encoded = comma >= 0 ? content.slice(comma + 1) : content;
  return Math.floor(encoded.length * 0.75);
}

function assessResult(result: string): { score: 0 | 1 | 2; notes: string[] } {
  const text = result.trim();
  if (text.length < MIN_RESULT) {
    return {
      score: 0,
      notes: ["State what actually changed as a result of the action. A short concrete note is required."],
    };
  }
  if (hasVague(text)) {
    return { score: 0, notes: ["The change note is feeling-language. Name the concrete result."] };
  }
  if (!hasConcrete(text) && !hasOutcome(text)) {
    return { score: 0, notes: [LOW_RESOLUTION_NOTE] };
  }
  if (text.length >= STRONG_RESULT && hasConcrete(text) && hasOutcome(text)) {
    return { score: 2, notes: [] };
  }
  return { score: 1, notes: [] };
}

function assessPayload(draft: EvidenceDraft): { score: 0 | 1 | 2; notes: string[]; blocked: boolean } {
  const content = draft.content.trim();

  if (draft.type === "text") {
    if (content.length < MIN_TEXT) {
      return { score: 0, notes: [LOW_RESOLUTION_NOTE], blocked: true };
    }
    if (hasVague(content)) {
      return { score: 0, notes: ["Keep the record observable. Feeling-language is not evidence."], blocked: true };
    }
    if (!hasConcrete(content) && !hasOutcome(content)) {
      return { score: 0, notes: [LOW_RESOLUTION_NOTE], blocked: true };
    }
    if (content.length >= STRONG_TEXT && hasConcrete(content) && hasOutcome(content)) {
      return { score: 2, notes: [], blocked: false };
    }
    if (content.length < THIN_TEXT) {
      return {
        score: 0,
        notes: ["The description is thin. Name the artifact, the recipient, or the measurable change."],
        blocked: false,
      };
    }
    return { score: 1, notes: [], blocked: false };
  }

  if (draft.type === "link") {
    try {
      const url = new URL(content);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { score: 0, notes: ["The link must be an http or https address."], blocked: true };
      }
      const specific = url.pathname.length > 1 || Boolean(url.search);
      return {
        score: specific ? 2 : 1,
        notes: specific ? [] : ["The link is a root address. Point to the specific page or file."],
        blocked: false,
      };
    } catch {
      return { score: 0, notes: ["Enter a valid URL that a third party could open."], blocked: true };
    }
  }

  if (!content.startsWith("data:")) {
    return { score: 0, notes: ["Attach a file. The payload must be stored with the record."], blocked: true };
  }
  const bytes = dataUrlBytes(content);
  if (bytes < MIN_MEDIA_BYTES) {
    return {
      score: 0,
      notes: ["The attachment is too thin to inspect. Replace it with a readable file."],
      blocked: true,
    };
  }
  if (bytes < WEAK_MEDIA_BYTES) {
    return {
      score: 0,
      notes: ["Media resolution is low. The change note must carry the concrete result."],
      blocked: false,
    };
  }
  return { score: 2, notes: [], blocked: false };
}

function resolveGrade(resultScore: 0 | 1 | 2, payloadScore: 0 | 1 | 2, blocked: boolean): EvidenceGrade {
  if (blocked || resultScore === 0) return "insufficient";
  if (resultScore === 2 && payloadScore === 2) return "strong";
  if (payloadScore === 0) return resultScore === 2 ? "standard" : "weak";
  return "standard";
}

export function assessEvidence(draft: EvidenceDraft): EvidenceQuality {
  const result = assessResult(draft.result);
  const payload = assessPayload(draft);
  const grade = resolveGrade(result.score, payload.score, payload.blocked);
  const notes = [...result.notes, ...payload.notes];
  if (grade === "weak") notes.push(WEAK_RECORD_NOTE);

  return {
    grade,
    ok: grade !== "insufficient",
    notes: [...new Set(notes)],
    weight: EVIDENCE_WEIGHT[grade],
    countsTowardThreshold: grade === "standard" || grade === "strong",
  };
}

export function readEvidenceFile(file: File): Promise<string> {
  if (file.size > MAX_EVIDENCE_BYTES) {
    return Promise.reject(new Error("The file exceeds 3 MB."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("The file could not be read."));
    };
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsDataURL(file);
  });
}

export function evidencePreview(record: EvidenceRecord): string {
  const result = (record.result ?? "").trim();
  if (result) return result;
  if (record.payload.type === "text") return record.payload.content;
  if (record.payload.type === "link") return record.payload.content;
  return record.payload.type === "image" ? "Image on record." : "File on record.";
}

export function verificationStatusLabel(status: "internal" | "externally_verified"): string {
  return status === "externally_verified" ? "Externally verified" : "Internal record";
}

export function verificationIntegrityWeight(status: "internal" | "externally_verified"): number {
  return status === "externally_verified" ? 1.2 : 1;
}
