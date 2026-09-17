import { Button, CheckRow, ChoiceRow, Notes, TextField } from "@/components/ui";
import {
  assessResponsibilities,
  EFFORT_OPTIONS,
  emptyResponsibility,
  type ClarifyingDraft,
} from "@/lib/clarifying";
import type { Responsibility } from "@/types";

export function ResponsibilitiesStep({
  draft,
  onChange,
  onContinue,
}: {
  draft: ClarifyingDraft;
  onChange: (draft: ClarifyingDraft) => void;
  onContinue: () => void;
}) {
  const quality = assessResponsibilities(draft.responsibilities);

  function update(id: string, patch: Partial<Responsibility>) {
    onChange({
      ...draft,
      responsibilities: draft.responsibilities.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });
  }

  return (
    <>
      <p className="lede">
        Name the work and obligations that already consume real hours. Mark what cannot be dropped.
      </p>
      {draft.responsibilities.map((item, index) => (
        <div key={item.id} className="flex flex-col gap-3 border border-border bg-surface p-4">
          <TextField
            label={`Responsibility ${index + 1}`}
            value={item.title}
            onChange={(title) => update(item.id, { title })}
            placeholder="Client delivery. Childcare. Clinical hours."
          />
          <ChoiceRow
            label="Time demand"
            value={item.timeDemand}
            options={EFFORT_OPTIONS}
            onChange={(timeDemand) => update(item.id, { timeDemand })}
          />
          <CheckRow
            label="Non-negotiable"
            checked={item.isNonNegotiable}
            onToggle={() => update(item.id, { isNonNegotiable: !item.isNonNegotiable })}
          />
          {draft.responsibilities.length > 1 ? (
            <Button
              tone="neutral"
              onClick={() =>
                onChange({
                  ...draft,
                  responsibilities: draft.responsibilities.filter((row) => row.id !== item.id),
                })
              }
            >
              Remove
            </Button>
          ) : null}
        </div>
      ))}
      <Button
        tone="neutral"
        onClick={() =>
          onChange({
            ...draft,
            responsibilities: [...draft.responsibilities, emptyResponsibility()],
          })
        }
      >
        Add responsibility
      </Button>
      <Notes notes={quality.notes} />
      <Button onClick={onContinue} disabled={!quality.ok}>
        Continue
      </Button>
    </>
  );
}
