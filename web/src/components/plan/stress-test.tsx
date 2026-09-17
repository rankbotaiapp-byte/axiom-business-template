import { Button, CheckRow, Panel } from "@/components/ui";
import { CAPACITY_ADJUST_REASON, type StressReport } from "@/lib/planning";

export function ConstraintStressTest({
  report,
  acknowledged,
  onAcknowledge,
  onAdjust,
  busy,
  showAdjust,
}: {
  report: StressReport;
  acknowledged: boolean;
  onAcknowledge: () => void;
  onAdjust: (reason: string) => void;
  busy: boolean;
  showAdjust: boolean;
}) {
  return (
    <Panel>
      <p className="kicker">Constraint stress test</p>
      <p className="quiet">{report.reading}</p>
      {report.severity === "clear" ? (
        <p className="copy">
          No material conflict with recorded capacity, non-negotiables, or competing goals. The
          sequence can be locked.
        </p>
      ) : null}

      {report.severity === "strained" ? (
        <p className="copy">
          The sequence is strained against recorded constraints. The weakest points are listed.
          Acknowledge them before lock.
        </p>
      ) : null}

      {report.severity === "misaligned" ? (
        <p className="copy">
          This sequence is misaligned with recorded capacity. Lock is blocked until you generate an
          adjusted route, or explicitly override the failed test.
        </p>
      ) : null}

      {report.forecast.weeks.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="kicker">Capacity forecast</p>
          <p className="copy">{report.forecast.summary}</p>
          <div className="flex flex-col gap-1">
            {report.forecast.weeks.map((week) => (
              <p key={week.week} className="quiet">
                Week {week.week}: {week.demand.toFixed(1)}h projected against {week.available}h available.
                {week.risk === "clear" ? " Within capacity." : ` ${week.note}`}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {report.failureWarnings.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="kicker">Failure pattern intelligence</p>
          {report.failureWarnings.map((warning) => (
            <div key={warning.id} className="flex flex-col gap-1">
              <p className="kicker">{warning.title}</p>
              <p className="copy">{warning.detail}</p>
              <p className="quiet">Risk index: {warning.risk}% · {warning.recommendation}</p>
            </div>
          ))}
        </div>
      ) : null}

      {report.findings.map((finding) => (
        <div key={finding.id} className="flex flex-col gap-1">
          <p className={`kicker ${finding.level === "critical" ? "kicker-accent" : ""}`}>
            {finding.level === "critical" ? "Critical" : "Warning"} · {finding.title}
          </p>
          <p className="copy">{finding.detail}</p>
        </div>
      ))}

      {report.findings.length > 0 ? (
        <CheckRow
          label="I have read the constraint stress test and accept the listed risks."
          checked={acknowledged}
          onToggle={onAcknowledge}
        />
      ) : null}

      {showAdjust && report.severity === "misaligned" ? (
        <Button
          tone="accent"
          disabled={busy}
          onClick={() => onAdjust(CAPACITY_ADJUST_REASON)}
        >
          {busy ? "Revising" : "Generate adjusted route"}
        </Button>
      ) : null}
    </Panel>
  );
}
