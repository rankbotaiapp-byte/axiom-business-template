"use client";

import { ActionLink, EmptyState, Panel, Shell } from "@/components/ui";
import { LivingVision } from "@/components/vision";
import { firstRequiredActions, isPrimarySequenceComplete, needsCapitalizationReview } from "@/lib/planning";
import { useApp } from "@/stores/provider";
import { workFor } from "@/stores/selectors";

export default function OperationsPage() {
  const { state } = useApp();
  const { plan, vision, turningPoint } = workFor(state);
  const required = plan?.isLocked ? firstRequiredActions(plan) : [];

  return (
    <Shell overline="Z Point" title="Operations">
      {!plan || !vision ? (
        <EmptyState
          title="No active vision"
          body="No operational record is active. Create a vision to establish the governing objective before locking a plan."
        />
      ) : !plan.isLocked ? (
        <>
          <p className="lede">
            A sequence exists and is not locked. Review it before treating it as the primary path.
          </p>
          <Panel>
            <p className="kicker">
              Unlocked plan
            </p>
            <p className="copy">{vision.title}</p>
            <ActionLink href={`/plan/${plan.id}`}>Review sequence</ActionLink>
          </Panel>
        </>
      ) : needsCapitalizationReview(plan) ? (
        <>
          <p className="lede">
            The foundation threshold has been crossed. The system has generated a capitalization
            sequence.
          </p>
          <LivingVision vision={vision} threshold={turningPoint} />
          <Panel>
            <p className="kicker kicker-accent">
              Phase · Capitalization
            </p>
            <p className="copy">
              Review and lock the sequence before it becomes the primary path.
            </p>
            <ActionLink href={`/plan/${plan.id}`}>Review capitalization sequence</ActionLink>
          </Panel>
        </>
      ) : isPrimarySequenceComplete(plan) || vision.status === "completed" ? (
        <>
          <p className="lede">
            The primary path is complete. The record stands in the vault.
          </p>
          <LivingVision vision={vision} threshold={turningPoint} />
          <Panel>
            <p className="kicker">
              Record
            </p>
            <p className="copy">No open action. The primary path is complete.</p>
            <ActionLink href={`/plan/${plan.id}`} tone="neutral">
              Open the sequence
            </ActionLink>
            <ActionLink href="/portfolio" tone="neutral">
              Open the vault
            </ActionLink>
          </Panel>
        </>
      ) : (
        <>
          <p className="lede">
            Primary path is locked. Progress is measured by evidence on these actions.
          </p>
          <LivingVision vision={vision} threshold={turningPoint} />
          <Panel>
            <p className="kicker">
              Required now
            </p>
            {required.length === 0 ? (
              <p className="copy">No open action on the primary path.</p>
            ) : (
              required.map((action) => (
                <p key={action.id} className="copy">
                  {action.order}. {action.title}
                </p>
              ))
            )}
            <ActionLink href={`/plan/${plan.id}`} tone="neutral">
              Record evidence
            </ActionLink>
          </Panel>
        </>
      )}
    </Shell>
  );
}
