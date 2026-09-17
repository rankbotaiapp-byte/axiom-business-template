import type { AppState, ConnectionStage, Plan, StrategicConnection, StrategicRole } from "@/types";

import { identifyStrategicRoles, materializeRoles } from "./roles";

export { assessContactDraft, assessNomination, draftFirstContact } from "./draft";
export { CONNECTION_PHASE, identifyStrategicRoles, materializeRoles } from "./roles";
export type { RoleDraft } from "./roles";

export const CONNECTION_PROGRESS: { value: ConnectionStage; label: string }[] = [
  { value: "contact_sent", label: "Initial contact sent" },
  { value: "reply_received", label: "Reply received" },
  { value: "meeting_held", label: "Meeting held" },
  { value: "request_made", label: "Specific request made" },
];

export const CONNECTION_STAGE_LABEL: Record<ConnectionStage, string> = {
  nominated: "Nominated",
  contact_drafted: "Draft ready",
  contact_sent: "Initial contact sent",
  reply_received: "Reply received",
  meeting_held: "Meeting held",
  request_made: "Specific request made",
};

export function rolesForPlan(state: AppState, planId: string): StrategicRole[] {
  return state.roles.filter((item) => item.planId === planId).sort((a, b) => a.order - b.order);
}

export function connectionsForPlan(state: AppState, planId: string): StrategicConnection[] {
  return state.connections.filter((item) => item.planId === planId);
}

export function connectionForAction(state: AppState, actionId: string): StrategicConnection | undefined {
  return state.connections.find((item) => item.actionId === actionId);
}

export function connectionForRole(state: AppState, roleId: string): StrategicConnection | undefined {
  return state.connections.find((item) => item.roleId === roleId);
}

export function replaceRolesForPlan(state: AppState, plan: Plan, visionTitle: string, visionDescription: string): AppState {
  const roles = materializeRoles(identifyStrategicRoles({ title: visionTitle, description: visionDescription }), {
    planId: plan.id,
    visionId: plan.visionId,
  });
  return {
    ...state,
    roles: [...roles, ...state.roles.filter((item) => item.planId !== plan.id)],
    connections: state.connections.filter((item) => item.planId !== plan.id),
  };
}

export function isOutreachAction(state: AppState, actionId: string): boolean {
  return Boolean(connectionForAction(state, actionId));
}
