import { Button, ChoiceRow, Field, Notes, TextField } from "@/components/ui";
import { assessCapacity, ENERGY_OPTIONS, type ClarifyingDraft } from "@/lib/clarifying";

export function CapacityStep({
  draft,
  onChange,
  onContinue,
}: {
  draft: ClarifyingDraft;
  onChange: (draft: ClarifyingDraft) => void;
  onContinue: () => void;
}) {
  const quality = assessCapacity(draft.capacity);

  return (
    <>
      <p className="lede">
        Hours you can actually allocate to this vision in a typical week, after non-negotiables.
        Energy is the sustainable level, not a peak day.
      </p>
      <TextField
        label="Available hours per week"
        type="number"
        value={draft.capacity.availableHoursPerWeek ? String(draft.capacity.availableHoursPerWeek) : ""}
        onChange={(value) =>
          onChange({
            ...draft,
            capacity: {
              ...draft.capacity,
              availableHoursPerWeek: value === "" ? 0 : Number(value),
            },
          })
        }
        placeholder="6"
      />
      <ChoiceRow
        label="Sustainable energy"
        value={draft.capacity.energyLevel}
        options={ENERGY_OPTIONS}
        onChange={(energyLevel) =>
          onChange({
            ...draft,
            capacity: { ...draft.capacity, energyLevel },
          })
        }
      />
      <Field
        label="Capacity notes (optional)"
        value={draft.capacity.notes ?? ""}
        onChange={(notes) =>
          onChange({
            ...draft,
            capacity: { ...draft.capacity, notes },
          })
        }
        placeholder="Travel weeks. Shared custody. Night shifts."
        rows={3}
      />
      <Notes notes={quality.notes} />
      <Button onClick={onContinue} disabled={!quality.ok}>
        Continue
      </Button>
    </>
  );
}
