"use client";

import { useState } from "react";

import { Button, Panel } from "@/components/ui";
import { buildExecutionExport, type ExportDetail } from "@/lib/portfolio/record-model";
import { downloadExecutionPdf } from "@/lib/portfolio/pdf-download";
import { useApp } from "@/stores/provider";

const DETAIL: { value: ExportDetail; label: string }[] = [
  { value: "full", label: "Full" },
  { value: "summary", label: "Summary" },
];

export function ExportExecutionRecord({
  visionId,
  scope = "vision",
}: {
  visionId?: string;
  scope?: "vision" | "portfolio";
}) {
  const { state } = useApp();
  const [detail, setDetail] = useState<ExportDetail>("full");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available =
    scope === "portfolio" ? state.visions.length > 0 : Boolean(visionId && state.visions.some((item) => item.id === visionId));

  async function exportRecord() {
    if (!available || busy) return;
    setBusy(true);
    setError(null);
    try {
      const model = buildExecutionExport(state, {
        visionId: scope === "vision" ? visionId : undefined,
        detail,
      });
      if (!model) {
        setError("No record is available to export.");
        return;
      }
      await downloadExecutionPdf(model);
    } catch {
      setError("The PDF could not be written.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel>
      <p className="kicker">{scope === "portfolio" ? "Export portfolio" : "Export execution record"}</p>
      <p className="copy">
        {scope === "portfolio"
          ? "One PDF covering every vision on record. Full includes every action. Summary keeps dated results and threshold events."
          : "A formal PDF of this vision. Full includes every action. Summary keeps dated results and threshold events."}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {DETAIL.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setDetail(option.value)}
            className={`control ${
              detail === option.value ? "border border-accent text-accent" : "border border-border text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error ? <p className="copy">{error}</p> : null}
      <Button tone="neutral" onClick={() => void exportRecord()} disabled={!available || busy}>
        {busy ? "Writing PDF" : scope === "portfolio" ? "Export portfolio PDF" : "Export PDF"}
      </Button>
    </Panel>
  );
}
