import { Button, Notes, Panel, TextAction } from "@/components/ui";
import { assessDraft, type ClarifyingDraft, type ClarifyingStage } from "@/lib/clarifying";

export function ReviewStep({
  draft,
  onEdit,
  onConfirm,
  busy,
}: {
  draft: ClarifyingDraft;
  onEdit: (stage: ClarifyingStage) => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  const quality = assessDraft(draft);
  const namedGoals = draft.noCompetingGoals
    ? []
    : draft.competingGoals.filter((item) => item.title.trim());
  const namedConstraints = draft.noHardConstraints
    ? []
    : draft.constraints.map((item) => item.trim()).filter(Boolean);

  return (
    <>
      <p className="lede">
        Confirm this is accurate. The next vision will snapshot this context. A plan will be
        constrained by it.
      </p>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <p className="kicker">
            Responsibilities
          </p>
          <TextAction onClick={() => onEdit("responsibilities")}>Edit</TextAction>
        </div>
        {draft.responsibilities
          .filter((item) => item.title.trim())
          .map((item) => (
            <p key={item.id} className="copy">
              {item.title}
              {item.isNonNegotiable ? " — non-negotiable" : ""}
              {` · ${item.timeDemand} demand`}
            </p>
          ))}
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <p className="kicker">
            Competing goals
          </p>
          <TextAction onClick={() => onEdit("goals")}>Edit</TextAction>
        </div>
        {namedGoals.length === 0 ? (
          <p className="copy">None recorded.</p>
        ) : (
          namedGoals.map((item) => (
            <p key={item.id} className="copy">
              {item.priority}. {item.title}
            </p>
          ))
        )}
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <p className="kicker">Capacity</p>
          <TextAction onClick={() => onEdit("capacity")}>Edit</TextAction>
        </div>
        <p className="copy">
          {draft.capacity.availableHoursPerWeek} hours / week · {draft.capacity.energyLevel} energy
        </p>
        {draft.capacity.notes?.trim() ? (
          <p className="copy">{draft.capacity.notes}</p>
        ) : null}
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <p className="kicker">
            Constraints
          </p>
          <TextAction onClick={() => onEdit("constraints")}>Edit</TextAction>
        </div>
        {namedConstraints.length === 0 ? (
          <p className="copy">None recorded.</p>
        ) : (
          namedConstraints.map((item) => (
            <p key={item} className="copy">
              {item}
            </p>
          ))
        )}
      </Panel>

      <Notes notes={quality.notes} />
      <Button onClick={onConfirm} disabled={!quality.ok || busy}>
        {busy ? "Recording" : "Confirm context"}
      </Button>
    </>
  );
}
