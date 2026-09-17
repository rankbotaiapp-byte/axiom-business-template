"use client";

import { EmptyState, Panel, Shell } from "@/components/ui";
import { ExportExecutionRecord } from "@/components/portfolio/export-record";
import { CONNECTION_STAGE_LABEL } from "@/lib/connections";
import { portfolioByVision } from "@/lib/portfolio";
import { useApp } from "@/stores/provider";

export function PortfolioVault() {
  const { state } = useApp();
  const groups = portfolioByVision(state);

  return (
    <Shell overline="Life Portfolio" title="Vault">
      <p className="lede">
        Append-only archive. Completed work, evidence, and threshold declarations remain on record.
      </p>
      {groups.length === 0 ? (
        <EmptyState
          title="No portfolio entries"
          body="The vault remains empty until a vision is created, the sequence is locked, and evidence is recorded."
        />
      ) : (
        <>
          <ExportExecutionRecord scope="portfolio" />
          {groups.map((group) => (
          <section key={group.visionId} className="flex flex-col gap-3">
            <p className="kicker">{group.title}</p>
            {state.connections
              .filter((item) => item.visionId === group.visionId)
              .map((connection) => {
                const role = state.roles.find((item) => item.id === connection.roleId);
                return (
                  <Panel key={connection.id}>
                    <p className="kicker">Strategic asset · {CONNECTION_STAGE_LABEL[connection.stage]}</p>
                    <p className="title-block">{connection.name}</p>
                    <p className="copy">{role?.title ?? "Nominated connection"}</p>
                    <p className="quiet">{connection.context}</p>
                  </Panel>
                );
              })}
            {group.entries
              .filter((entry) => entry.type !== "connection")
              .map((entry) => (
              <Panel key={entry.id}>
                <p className="kicker">
                  {entry.type.replace("_", " ")} · {new Date(entry.timestamp).toLocaleString()}
                </p>
                <p className="title-block">{entry.heading}</p>
                <p className="copy">{entry.body}</p>
              </Panel>
            ))}
            <ExportExecutionRecord visionId={group.visionId} />
          </section>
        ))}
        </>
      )}
    </Shell>
  );
}
