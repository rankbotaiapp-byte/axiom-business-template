import { Button, CheckRow, Notes, TextField } from "@/components/ui";
import {
  assessGoals,
  emptyCompetingGoal,
  withGoalPriorities,
  type ClarifyingDraft,
} from "@/lib/clarifying";

export function GoalsStep({
  draft,
  onChange,
  onContinue,
}: {
  draft: ClarifyingDraft;
  onChange: (draft: ClarifyingDraft) => void;
  onContinue: () => void;
}) {
  const quality = assessGoals(draft);

  return (
    <>
      <p className="lede">
        Other active intentions that compete for the same hours. Order is priority. 1 is highest.
      </p>
      {draft.noCompetingGoals ? null : (
        <>
          {draft.competingGoals.map((item, index) => (
            <div key={item.id} className="flex flex-col gap-3 border border-border bg-surface p-4">
              <TextField
                label={`Competing goal ${index + 1}`}
                value={item.title}
                onChange={(title) =>
                  onChange({
                    ...draft,
                    competingGoals: withGoalPriorities(
                      draft.competingGoals.map((row) =>
                        row.id === item.id ? { ...row, title } : row
                      )
                    ),
                  })
                }
                placeholder="A second business. A certification. A move."
              />
              {draft.competingGoals.length > 1 ? (
                <Button
                  tone="neutral"
                  onClick={() =>
                    onChange({
                      ...draft,
                      competingGoals: withGoalPriorities(
                        draft.competingGoals.filter((row) => row.id !== item.id)
                      ),
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
                competingGoals: withGoalPriorities([
                  ...draft.competingGoals,
                  emptyCompetingGoal(draft.competingGoals.length + 1),
                ]),
              })
            }
          >
            Add competing goal
          </Button>
        </>
      )}
      <CheckRow
        label="No competing goals. This is the only active intention."
        checked={draft.noCompetingGoals}
        onToggle={() =>
          onChange({
            ...draft,
            noCompetingGoals: !draft.noCompetingGoals,
          })
        }
      />
      <Notes notes={quality.notes} />
      <Button onClick={onContinue} disabled={!quality.ok}>
        Continue
      </Button>
    </>
  );
}
