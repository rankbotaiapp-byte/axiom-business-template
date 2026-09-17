"use client";

import { useEffect, useMemo, useState } from "react";

import { Button, ChoiceRow, Field, FileTrigger, Notes, Panel } from "@/components/ui";
import { CONNECTION_PROGRESS, connectionForAction } from "@/lib/connections";
import {
  assessEvidence,
  emptyEvidenceDraft,
  readEvidenceFile,
  type EvidenceDraft,
} from "@/lib/evidence";
import { useApp } from "@/stores/provider";
import type { ConnectionStage, EvidencePayloadType, PlanAction } from "@/types";

const TYPES: { value: EvidencePayloadType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "link", label: "Link" },
  { value: "image", label: "Image" },
  { value: "file", label: "File" },
];

export function EvidenceLog({
  action,
  busy,
  onRecord,
}: {
  action: PlanAction;
  busy: boolean;
  onRecord: (draft: EvidenceDraft) => void;
}) {
  const { state } = useApp();
  const outreach = connectionForAction(state, action.id);
  const [draft, setDraft] = useState<EvidenceDraft>(emptyEvidenceDraft);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(emptyEvidenceDraft());
    setFileError(null);
  }, [action.id]);
  const quality = useMemo(() => assessEvidence(draft), [draft]);
  const notes = fileError ? [...quality.notes, fileError] : quality.notes;

  async function attach(file: File | undefined) {
    if (!file) return;
    setFileError(null);
    try {
      const content = await readEvidenceFile(file);
      setDraft((current) => ({ ...current, content }));
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "The file could not be read.");
    }
  }

  return (
    <Panel>
      <p className="kicker">
        Record evidence
      </p>
      <p className="copy">{action.title}</p>
      <p className="quiet">
        Completion requires a permanent record. Intention is not sufficient.
      </p>
      <ChoiceRow
        label="Payload"
        value={draft.type}
        options={TYPES}
        onChange={(type) => setDraft((current) => ({ ...current, type, content: "" }))}
      />
      {draft.type === "text" ? (
        <Field
          label="What exists now"
          value={draft.content}
          onChange={(content) => setDraft((current) => ({ ...current, content }))}
          placeholder="The artifact, the message sent, the metric recorded. What a third party could inspect."
        />
      ) : null}
      {draft.type === "link" ? (
        <Field
          label="URL"
          value={draft.content}
          onChange={(content) => setDraft((current) => ({ ...current, content }))}
          placeholder="https://"
          rows={2}
        />
      ) : null}
      {draft.type === "image" || draft.type === "file" ? (
        <FileTrigger
          label={draft.content ? "Replace attachment" : `Attach ${draft.type}`}
          accept={draft.type === "image" ? "image/*" : undefined}
          onFile={(file) => void attach(file)}
        />
      ) : null}
      {outreach ? (
        <ChoiceRow
          label="Relationship progress"
          value={draft.connectionStage ?? "contact_sent"}
          options={CONNECTION_PROGRESS}
          onChange={(connectionStage: ConnectionStage) =>
            setDraft((current) => ({ ...current, connectionStage }))
          }
        />
      ) : null}
      <Field
        label="What changed"
        value={draft.result}
        onChange={(result) => setDraft((current) => ({ ...current, result }))}
        placeholder={
          outreach
            ? "The message was sent. The reply is on file. The meeting occurred. The request was made."
            : "The signed page is on file. The invoice was sent. The desk is clear."
        }
        rows={3}
      />
      <Notes notes={notes} />
      <Button
        onClick={() =>
          onRecord(
            outreach ? { ...draft, connectionStage: draft.connectionStage ?? "contact_sent" } : draft
          )
        }
        disabled={!quality.ok || busy}
      >
        {busy ? "Recording" : quality.grade === "weak" ? "Record at reduced density" : "Record evidence"}
      </Button>
    </Panel>
  );
}
