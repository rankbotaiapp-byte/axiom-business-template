"use client";

import { useMemo, useState } from "react";

import { Button, Field, FileTrigger, Notes, Panel, Shell, TextAction, TextField } from "@/components/ui";
import {
  assessVisionDraft,
  emptyVisionDraft,
  MAX_MEDIA,
  mediaKind,
  readMediaFile,
  type VisionDraft,
} from "@/lib/vision-capture";
import type { UserProfile } from "@/types";

export function VisionCapture({
  profile,
  initial,
  onComplete,
}: {
  profile: UserProfile;
  initial?: VisionDraft;
  onComplete: (draft: VisionDraft) => void;
}) {
  const [draft, setDraft] = useState<VisionDraft>(initial ?? emptyVisionDraft);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const quality = useMemo(() => assessVisionDraft(draft), [draft]);
  const notes = mediaError ? [...quality.notes, mediaError] : quality.notes;

  async function attach(file: File | undefined) {
    if (!file) return;
    setMediaError(null);
    if (draft.mediaUrls.length >= MAX_MEDIA) {
      setMediaError(`At most ${MAX_MEDIA} media attachments.`);
      return;
    }
    try {
      const url = await readMediaFile(file);
      setDraft((current) => ({ ...current, mediaUrls: [...current.mediaUrls, url] }));
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "The file could not be read.");
    }
  }

  function confirm() {
    if (!quality.ok || busy) return;
    setBusy(true);
    onComplete(draft);
  }

  return (
    <Shell overline="Vision Capture" title="State the outcome">
      <p className="lede">
        Write what will exist. Density starts at 0. Evidence raises it. This record snapshots the
        clarifying context just confirmed.
      </p>

      <TextField
        label="Title"
        value={draft.title}
        onChange={(title) => setDraft((current) => ({ ...current, title }))}
        placeholder="The signed lease. The shipped product. The closed book of clients."
      />
      <Field
        label="Description"
        value={draft.description}
        onChange={(description) => setDraft((current) => ({ ...current, description }))}
        placeholder="What a third party would see, read, or receive. Objects, documents, rooms, dates. What is no longer true."
        rows={7}
      />

      <Panel>
        <p className="kicker">
          Optional media
        </p>
        <p className="quiet">
          Image or voice note. At most {MAX_MEDIA}. Not required.
        </p>
        <FileTrigger label="Attach image" accept="image/*" onFile={(file) => void attach(file)} />
        <FileTrigger label="Attach voice note" accept="audio/*" onFile={(file) => void attach(file)} />
        {draft.mediaUrls.map((url, index) => (
          <div key={`${mediaKind(url)}-${index}`} className="flex items-center justify-between gap-3">
            <p className="copy">
              {mediaKind(url) === "voice" ? "Voice note" : "Image"} {index + 1}
            </p>
            <TextAction
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  mediaUrls: current.mediaUrls.filter((_, item) => item !== index),
                }))
              }
            >
              Remove
            </TextAction>
          </div>
        ))}
      </Panel>

      <Panel>
        <p className="kicker">
          Context snapshot
        </p>
        <p className="copy">
          {profile.capacity.availableHoursPerWeek} hours / week · {profile.capacity.energyLevel} energy
        </p>
        <p className="copy">
          {profile.responsibilities.length} responsibilities · {profile.competingGoals.length} competing
          goals · {profile.constraints.length} constraints
        </p>
      </Panel>

      <Notes notes={notes} />
      <Button onClick={confirm} disabled={!quality.ok || busy}>
        {busy ? "Recording" : "Create vision"}
      </Button>
    </Shell>
  );
}
