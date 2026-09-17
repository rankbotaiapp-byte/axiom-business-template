const VAGUE = /\b(happy|joy|peace|abundant|aligned|inspired|vibes|manifest|best self|dream life)\b/i;

export const MAX_MEDIA = 2;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

export type VisionDraft = {
  title: string;
  description: string;
  mediaUrls: string[];
};

export type Assessment = { ok: boolean; notes: string[] };

export function emptyVisionDraft(): VisionDraft {
  return { title: "", description: "", mediaUrls: [] };
}

export function assessVisionDraft(draft: VisionDraft): Assessment {
  const notes: string[] = [];
  const title = draft.title.trim();
  const description = draft.description.trim();

  if (title.length < 8) {
    notes.push("The title is too thin. Name the outcome a third party could identify.");
  }
  if (title.length > 80) {
    notes.push("Shorten the title. Keep it to the outcome, not the story.");
  }
  if (description.length < 60) {
    notes.push("The description is too thin. State what exists when this is complete, in concrete terms.");
  }
  if (VAGUE.test(title) || VAGUE.test(description)) {
    notes.push("Keep the record operational. Feeling-language is not a vision.");
  }
  if (draft.mediaUrls.length > MAX_MEDIA) {
    notes.push(`At most ${MAX_MEDIA} media attachments.`);
  }
  return { ok: notes.length === 0, notes };
}

export function readMediaFile(file: File): Promise<string> {
  const isImage = file.type.startsWith("image/");
  const isAudio = file.type.startsWith("audio/");
  if (!isImage && !isAudio) {
    return Promise.reject(new Error("Use an image or an audio file."));
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return Promise.reject(new Error("Image exceeds 3 MB."));
  }
  if (isAudio && file.size > MAX_AUDIO_BYTES) {
    return Promise.reject(new Error("Audio exceeds 5 MB."));
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

export function mediaKind(url: string): "image" | "voice" {
  if (url.startsWith("data:audio") || url.includes("audio/")) return "voice";
  return "image";
}
