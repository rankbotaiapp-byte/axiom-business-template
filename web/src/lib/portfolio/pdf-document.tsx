import { Document, Page, Text, View, StyleSheet, pdf, type DocumentProps } from "@react-pdf/renderer";
import { type ReactElement, type ReactNode } from "react";

import type { ExecutionExport, RecordedActionLine, VisionExecutionModel } from "./record-model";

const ink = "#1c1b18";
const muted = "#6b675f";
const rule = "#d4cfc4";
const accent = "#8d7349";
const paper = "#fbf8f2";

const styles = StyleSheet.create({
  page: {
    backgroundColor: paper,
    color: ink,
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.45,
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 56,
  },
  running: {
    position: "absolute",
    left: 56,
    right: 56,
    top: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.6,
    borderBottomColor: rule,
    paddingBottom: 6,
  },
  runningText: {
    fontFamily: "Helvetica",
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: muted,
  },
  footer: {
    position: "absolute",
    left: 56,
    right: 56,
    bottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.6,
    borderTopColor: rule,
    paddingTop: 6,
  },
  footerText: {
    fontFamily: "Helvetica",
    fontSize: 8,
    letterSpacing: 0.4,
    color: muted,
  },
  masthead: {
    fontFamily: "Helvetica",
    fontSize: 9,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: accent,
    marginBottom: 8,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    lineHeight: 1.25,
    marginBottom: 14,
  },
  coverTitle: {
    fontFamily: "Times-Bold",
    fontSize: 22,
    lineHeight: 1.2,
    marginTop: 72,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  metaLabel: {
    width: 118,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: muted,
    paddingTop: 1,
  },
  metaValue: {
    flex: 1,
    fontSize: 10.5,
  },
  section: {
    marginTop: 18,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderBottomWidth: 0.7,
    borderBottomColor: ink,
    paddingBottom: 4,
    marginBottom: 8,
  },
  sectionIndex: {
    fontFamily: "Helvetica",
    fontSize: 8,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: muted,
  },
  sectionTitle: {
    fontFamily: "Helvetica",
    fontSize: 9,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: ink,
  },
  body: {
    fontSize: 10.5,
    marginBottom: 6,
  },
  quote: {
    fontFamily: "Times-Italic",
    fontSize: 11,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  bullet: {
    marginBottom: 3,
    paddingLeft: 8,
  },
  phase: {
    marginTop: 8,
    marginBottom: 4,
  },
  phaseName: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: accent,
    marginBottom: 4,
  },
  action: {
    marginBottom: 7,
    paddingBottom: 6,
    borderBottomWidth: 0.4,
    borderBottomColor: rule,
  },
  actionTitle: {
    fontFamily: "Times-Bold",
    fontSize: 10.5,
    marginBottom: 2,
  },
  actionMeta: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: muted,
    marginBottom: 2,
  },
  quiet: {
    color: muted,
  },
  integrity: {
    marginTop: 10,
  },
});

function listOrNone(items: string[]): string {
  return items.length ? items.join("; ") : "None recorded";
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead} wrap={false}>
        <Text style={styles.sectionIndex}>{index}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function RunningChrome({ recordId }: { recordId: string }) {
  return (
    <>
      <View style={styles.running} fixed>
        <Text style={styles.runningText}>Z Point</Text>
        <Text style={styles.runningText}>Execution record</Text>
      </View>
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>{recordId}</Text>
        <Text
          style={styles.footerText}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </View>
    </>
  );
}

function ActionBlock({ action, detail }: { action: RecordedActionLine; detail: ExecutionExport["detail"] }) {
  const when = action.date ?? "No date on record";
  return (
    <View style={styles.action} wrap={false}>
      <Text style={styles.actionTitle}>
        {action.order}. {action.title}
      </Text>
      <Text style={styles.actionMeta}>
        {when}
        {action.reference ? `  ·  ${action.reference}` : ""}
        {`  ·  ${action.status}`}
      </Text>
      {action.result ? (
        <Text style={styles.body}>
          {detail === "summary" ? action.result : `Result: ${action.result}`}
        </Text>
      ) : (
        <Text style={[styles.body, styles.quiet]}>No evidence recorded.</Text>
      )}
    </View>
  );
}

function VisionBody({
  vision,
  detail,
  showMasthead,
}: {
  vision: VisionExecutionModel;
  detail: ExecutionExport["detail"];
  showMasthead: boolean;
}) {
  return (
    <>
      {showMasthead ? <Text style={styles.masthead}>Z Point – Execution Record</Text> : null}
      <Text style={styles.title}>{vision.title}</Text>
      <Section index="01" title="Document header">
        <Meta label="Vision" value={vision.title} />
        <Meta label="Status" value={vision.status} />
        <Meta label="Institutional phase" value={vision.institutionalPhase} />
        <Meta label="Period" value={vision.period} />
        <Meta label="Realization" value={`${vision.realization}%`} />
        <Meta label="Export generated" value={vision.exportGenerated} />
      </Section>

      <Section index="02" title="Original intention">
        <Text style={styles.quote}>{vision.description}</Text>
        <Text style={styles.body}>Context at initiation</Text>
        <Text style={styles.bullet}>
          • Available capacity: {vision.context.hours} hours per week, {vision.context.energy} energy
        </Text>
        <Text style={styles.bullet}>
          • Non-negotiable responsibilities: {listOrNone(vision.context.nonNegotiables)}
        </Text>
        <Text style={styles.bullet}>• Key constraints: {listOrNone(vision.context.constraints)}</Text>
        <Text style={styles.bullet}>
          • Competing priorities at the time: {listOrNone(vision.context.competing)}
        </Text>
      </Section>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionIndex}>03</Text>
          <Text style={styles.sectionTitle}>Execution record</Text>
        </View>
        {vision.phases.length === 0 ? (
          <Text style={styles.body}>No completed work on record.</Text>
        ) : (
          vision.phases.map((phase) => (
            <View key={phase.name} style={styles.phase}>
              <Text style={styles.phaseName}>{phase.name}</Text>
              {phase.actions.map((action) => (
                <ActionBlock key={`${phase.name}-${action.order}-${action.title}`} action={action} detail={detail} />
              ))}
            </View>
          ))
        )}
        {detail === "full" && vision.connections.length > 0
          ? vision.connections.map((connection) => (
              <View key={`${connection.name}-${connection.stage}`} style={styles.action} wrap={false}>
                <Text style={styles.phaseName}>Strategic connection</Text>
                <Text style={styles.actionTitle}>{connection.name}</Text>
                <Text style={styles.actionMeta}>
                  {connection.role}  ·  {connection.stage}
                  {connection.channel ? `  ·  ${connection.channel}` : ""}
                </Text>
                <Text style={styles.body}>{connection.context}</Text>
              </View>
            ))
          : null}
      </View>

      {vision.thresholds.length > 0 ? (
        <Section index="04" title="Threshold events">
          {vision.thresholds.map((point) => (
            <View key={`${point.heading}-${point.date}`}>
              <Text style={styles.actionMeta}>
                {point.heading} — {point.date}
              </Text>
              <Text style={styles.body}>{point.declaration}</Text>
              <Text style={styles.body}>Supporting evidence</Text>
              {point.supporting.length
                ? point.supporting.map((line) => (
                    <Text key={line} style={styles.bullet}>
                      • {line}
                    </Text>
                  ))
                : (
                    <Text style={styles.bullet}>• None recorded.</Text>
                  )}
              <Text style={styles.body}>{point.capitalization}</Text>
            </View>
          ))}
        </Section>
      ) : (
        <Section index="04" title="Threshold events">
          <Text style={styles.body}>No threshold has been declared for this vision.</Text>
        </Section>
      )}

      <Section index="05" title="Outcome verification">
        {vision.verification ? (
          <>
            <Meta label="Verification status" value={vision.verification.status} />
            <Meta label="Verification title" value={vision.verification.title} />
            <Meta label="Source" value={vision.verification.source} />
            <Meta label="Kind" value={vision.verification.kind} />
            <Meta label="Recorded" value={vision.verification.recordedAt} />
            <Meta label="Visibility" value={vision.verification.visibility} />
            <Text style={styles.body}>{vision.verification.note}</Text>
          </>
        ) : (
          <Text style={styles.body}>No external verification is attached to this vision.</Text>
        )}
      </Section>

      <Section index="06" title={vision.outcome.kind === "final" ? "Recorded outcome" : "Recorded state"}>
        <Text style={styles.body}>{vision.outcome.statement}</Text>
        {vision.outcome.keyResults.length > 0 ? (
          <>
            <Text style={styles.body}>Key results</Text>
            {vision.outcome.keyResults.map((result) => (
              <Text key={result} style={styles.bullet}>
                • {result}
              </Text>
            ))}
          </>
        ) : null}
      </Section>

      <Section index="07" title="Integrity statement">
        <View style={styles.integrity}>
          <Text style={styles.body}>
            This document is a permanent execution record generated from Z Point.
          </Text>
          <Text style={styles.body}>
            All actions and results listed above were logged with supporting evidence at the time of
            completion.
          </Text>
          <Text style={styles.body}>Export timestamp: {vision.exportGenerated}</Text>
          <Text style={styles.body}>Record ID: {vision.recordId}</Text>
        </View>
      </Section>
    </>
  );
}

function CoverPage({ model }: { model: ExecutionExport }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <RunningChrome recordId={model.recordId} />
      <Text style={styles.masthead}>Z Point – Life Portfolio</Text>
      <Text style={styles.coverTitle}>Execution Record</Text>
      <Text style={[styles.body, styles.quiet]}>
        {model.detail === "summary" ? "Summary version" : "Full record"}
      </Text>
      <View style={{ marginTop: 28 }}>
        <Meta label="Visions on record" value={String(model.visions.length)} />
        <Meta label="Period" value={model.period} />
        <Meta label="Export generated" value={model.exportGenerated} />
        <Meta label="Record ID" value={model.recordId} />
      </View>
      <View style={{ marginTop: 36 }}>
        <Text style={styles.sectionTitle}>Contents</Text>
        <View style={{ borderBottomWidth: 0.7, borderBottomColor: ink, marginTop: 4, marginBottom: 8 }} />
        {model.visions.map((vision, index) => (
          <Text key={vision.recordId} style={styles.body}>
            {String(index + 1).padStart(2, "0")}  {vision.title}  —  {vision.status}
          </Text>
        ))}
      </View>
    </Page>
  );
}

export function executionPdfInstance(model: ExecutionExport) {
  return pdf(executionRecordDocument(model));
}

export function executionRecordDocument(model: ExecutionExport): ReactElement<DocumentProps> {
  return (
    <ExecutionRecordPdf model={model} />
  ) as ReactElement<DocumentProps>;
}

export function ExecutionRecordPdf({ model }: { model: ExecutionExport }) {
  return (
    <Document
      title={
        model.scope === "portfolio"
          ? "Z Point – Life Portfolio Execution Record"
          : `Z Point – Execution Record – ${model.visions[0]?.title ?? "Vision"}`
      }
      author="Z Point"
      subject="Permanent execution record"
      creator="Z Point"
    >
      {model.scope === "portfolio" ? <CoverPage model={model} /> : null}
      {model.visions.map((vision) => (
        <Page key={vision.recordId} size="LETTER" style={styles.page} wrap>
          <RunningChrome recordId={model.scope === "portfolio" ? model.recordId : vision.recordId} />
          <VisionBody
            vision={vision}
            detail={model.detail}
            showMasthead={model.scope === "vision"}
          />
        </Page>
      ))}
    </Document>
  );
}
