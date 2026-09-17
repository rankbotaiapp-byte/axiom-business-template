"use client";

import { useMemo, useState } from "react";

import { Button, Field, Notes, Panel, TextField } from "@/components/ui";
import {
  assessContactDraft,
  assessNomination,
  CONNECTION_STAGE_LABEL,
  connectionForRole,
  draftFirstContact,
  rolesForPlan,
} from "@/lib/connections";
import { nominateConnection, saveConnectionDraft } from "@/stores/app-store";
import { useApp } from "@/stores/provider";
import type { StrategicRole, Vision } from "@/types";

export function StrategicConnectionPanel({
  planId,
  visionId,
  locked,
}: {
  planId: string;
  visionId: string;
  locked: boolean;
}) {
  const { state } = useApp();
  const vision = state.visions.find((item) => item.id === visionId);
  const roles = rolesForPlan(state, planId);
  if (!vision || roles.length === 0) return null;

  return (
    <Panel>
      <p className="kicker">Strategic connection</p>
      <p className="copy">
        These roles would move the vision. Name a real person you already know, or can introduce
        yourself to. Z Point does not find, scrape, or contact anyone.
      </p>
      {roles.map((role) => (
        <RoleBlock key={role.id} role={role} vision={vision} locked={locked} />
      ))}
    </Panel>
  );
}

function RoleBlock({
  role,
  vision,
  locked,
}: {
  role: StrategicRole;
  vision: Vision;
  locked: boolean;
}) {
  const { state, commit } = useApp();
  const connection = connectionForRole(state, role.id);
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [channel, setChannel] = useState("");
  const [draft, setDraft] = useState(connection?.draft ?? "");
  const nomination = useMemo(() => assessNomination({ name, context }), [context, name]);
  const draftQuality = useMemo(() => assessContactDraft(draft), [draft]);

  if (!connection) {
    return (
      <div className="flex flex-col gap-3 border border-border p-4">
        <p className="kicker">{role.kind.replace("_", " ")}</p>
        <p className="title-block">{role.title}</p>
        <p className="copy">{role.reason}</p>
        <TextField
          label="Person"
          value={name}
          onChange={setName}
          placeholder="Full name"
        />
        <Field
          label="Why this person"
          value={context}
          onChange={setContext}
          placeholder="What you already know: the role they hold, the work they have done, why they fit. Not a scraped biography."
          rows={3}
        />
        <TextField
          label="Channel you will use"
          value={channel}
          onChange={setChannel}
          placeholder="Email, in person, existing thread"
        />
        <Notes notes={nomination.notes} />
        <Button
          disabled={!nomination.ok}
          onClick={() =>
            commit((current) => nominateConnection(current, { roleId: role.id, name, context, channel }))
          }
        >
          Nominate this person
        </Button>
        {locked ? (
          <p className="quiet">
            The plan is locked. Nomination is recorded as an asset. A new outreach action is not added.
          </p>
        ) : (
          <p className="quiet">Nomination adds a first-contact action to this sequence.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border border-border p-4">
      <p className="kicker">
        {role.kind.replace("_", " ")} · {CONNECTION_STAGE_LABEL[connection.stage]}
      </p>
      <p className="title-block">{connection.name}</p>
      <p className="copy">{role.title}</p>
      <p className="quiet">{connection.context}</p>
      {connection.channel ? <p className="quiet">Channel: {connection.channel}</p> : null}
      <Field
        label="First-contact draft"
        value={draft || connection.draft}
        onChange={setDraft}
        placeholder="The message you will send. The system does not send it."
        rows={8}
      />
      <Notes notes={draftQuality.notes} />
      <div className="grid grid-cols-2 gap-2">
        <Button
          tone="neutral"
          onClick={() => {
            const text = draft.trim() || draftFirstContact({ vision, role, connection });
            setDraft(text);
            void navigator.clipboard.writeText(text);
          }}
        >
          Copy draft
        </Button>
        <Button
          disabled={!draftQuality.ok}
          onClick={() =>
            commit((current) => saveConnectionDraft(current, { connectionId: connection.id, draft }))
          }
        >
          Save draft
        </Button>
      </div>
      <p className="quiet">You send this yourself. Recording evidence is how progress is logged.</p>
    </div>
  );
}
