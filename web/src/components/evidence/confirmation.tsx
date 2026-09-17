import { Panel } from "@/components/ui";

export function EvidenceConfirmation({ placing }: { placing: boolean }) {
  return (
    <Panel>
      <div className={placing ? "vault-place" : undefined}>
        <p className="kicker">
          Life Portfolio
        </p>
        <p className="title-block">
          Recorded. This step is now permanent.
        </p>
      </div>
    </Panel>
  );
}
