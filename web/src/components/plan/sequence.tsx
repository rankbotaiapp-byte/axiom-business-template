"use client";

import { Panel } from "@/components/ui";
import { connectionsForPlan } from "@/lib/connections";
import { CAPITALIZATION_PHASE } from "@/lib/turning-points";
import { useApp } from "@/stores/provider";
import type { ActionStatus, Plan } from "@/types";

function statusLabel(status: ActionStatus): string {
  if (status === "in_progress") return "in progress";
  if (status === "skipped") return "released after threshold";
  return status;
}

export function PlanSequence({ plan }: { plan: Plan }) {
  const { state } = useApp();
  const connections = connectionsForPlan(state, plan.id);
  return (
    <>
      {plan.phases.map((phase) => {
        const actions = plan.actions
          .filter((action) => action.phase === phase)
          .sort((a, b) => a.order - b.order);
        const current = phase === CAPITALIZATION_PHASE;
        if (actions.length === 0) {
          return (
            <p
              key={phase}
              className={`kicker ${current ? "kicker-accent" : ""}`}
            >
              {current ? `Phase · ${phase}` : phase}
            </p>
          );
        }
        return (
          <div key={phase} className="flex flex-col gap-3">
            <p
              className={`kicker ${current ? "kicker-accent" : ""}`}
            >
              {current ? `Phase · ${phase}` : phase}
            </p>
            {actions.map((action) => {
              const connection = connections.find((item) => item.actionId === action.id);
              return (
              <Panel key={action.id}>
                <p className="kicker">
                  {connection ? `Outreach · ${connection.name}` : `Action ${action.order}`} ·{" "}
                  {action.estimatedEffort} effort · {statusLabel(action.status)}
                  {action.dependencies.length > 0 ? " · depends on prior" : ""}
                </p>
                <p className="title-block">{action.title}</p>
                <p className="copy">{action.description}</p>
              </Panel>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
