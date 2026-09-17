import { Button, CheckRow, Field, Notes } from "@/components/ui";
import { assessConstraints, type ClarifyingDraft } from "@/lib/clarifying";

export function ConstraintsStep({
  draft,
  onChange,
  onContinue,
}: {
  draft: ClarifyingDraft;
  onChange: (draft: ClarifyingDraft) => void;
  onContinue: () => void;
}) {
  const quality = assessConstraints(draft);

  return (
    <>
      <p className="lede">
        Hard limits that a plan must respect: money, location, health, legal, deadline. Not
        preferences.
      </p>
      {draft.noHardConstraints ? null : (
        <>
          {draft.constraints.map((item, index) => (
            <div key={`constraint-${index}`} className="flex flex-col gap-3">
              <Field
                label={`Constraint ${index + 1}`}
                value={item}
                onChange={(value) =>
                  onChange({
                    ...draft,
                    constraints: draft.constraints.map((row, rowIndex) =>
                      rowIndex === index ? value : row
                    ),
                  })
                }
                placeholder="Must remain in this city. Cannot spend more than X. Procedure on 12 March."
                rows={3}
              />
              {draft.constraints.length > 1 ? (
                <Button
                  tone="neutral"
                  onClick={() =>
                    onChange({
                      ...draft,
                      constraints: draft.constraints.filter((_, rowIndex) => rowIndex !== index),
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
            onClick={() => onChange({ ...draft, constraints: [...draft.constraints, ""] })}
          >
            Add constraint
          </Button>
        </>
      )}
      <CheckRow
        label="No hard constraints apply to this work."
        checked={draft.noHardConstraints}
        onToggle={() => onChange({ ...draft, noHardConstraints: !draft.noHardConstraints })}
      />
      <Notes notes={quality.notes} />
      <Button onClick={onContinue} disabled={!quality.ok}>
        Continue to review
      </Button>
    </>
  );
}
