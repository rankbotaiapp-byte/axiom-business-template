import { useState } from 'react';

import { Body, Button, Card, CheckRow, Field, Meta, Overline, Title } from './ui';
import { planSources } from '../engine/sequence';
import { formatHours } from '../store';
import type { CapacityMap, Step, Vision } from '../types';
import { ROUTE_COPY } from '../types';

export function PlanReview({
  vision,
  map,
  steps,
  prepared,
  onPreparedChange,
  reason,
  onReasonChange,
  onAlternative,
  onLock,
  busy,
}: {
  vision: Vision;
  map: CapacityMap | null;
  steps: Step[];
  prepared: boolean;
  onPreparedChange: (value: boolean) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  onAlternative: () => void;
  onLock: () => void;
  busy: boolean;
}) {
  const sources = map ? planSources(vision, map) : null;
  const [path, setPath] = useState(false);
  const [record, setRecord] = useState(false);
  const ready = path && record;

  return (
    <>
      <Title>Review the sequence</Title>
      <Body muted>Read it carefully. Once locked, the system will treat these actions as your current primary path.</Body>

      <Card>
        <Overline>This plan was generated from</Overline>
        <Meta>Your stated vision</Meta>
        <Body>{vision.statement}</Body>
        <Meta>Your current responsibilities and capacity</Meta>
        <Body>
          {sources
            ? sources.capacity
            : 'Capacity is unmapped. The sequence cannot be accurate.'}
        </Body>
        <Meta>Research on what is required to achieve similar outcomes</Meta>
        <Body>{sources ? sources.research : 'Classify the vision after capacity is recorded.'}</Body>
        <Meta>{ROUTE_COPY[vision.route].title}</Meta>
        <Body muted>{ROUTE_COPY[vision.route].why}</Body>
      </Card>

      {steps.map((step) => (
        <Card key={step.id}>
          <Overline>
            Step {step.position} · {formatHours(step.hours)}
          </Overline>
          <Title>{step.title}</Title>
          <Body>{step.action}</Body>
          <Meta>{step.principle}</Meta>
        </Card>
      ))}

      <Card>
        <Overline>Alternative route</Overline>
        <Body muted>
          Request an alternative if this sequence does not feel correct or necessary. Give the reason. The next route is still built from the same vision, capacity, and research.
        </Body>
        <Field
          label="Why this sequence is not correct or not necessary"
          value={reason}
          onChangeText={onReasonChange}
          placeholder="Too much administration before the first artifact. The constraint step is already obvious."
          multiline
        />
        <Button
          label={busy ? 'Revising' : 'Request alternative route'}
          tone="neutral"
          onPress={onAlternative}
          disabled={busy || reason.trim().length < 16}
        />
      </Card>

      <Card>
        <Overline>You are about to lock this sequence</Overline>
        <Body>
          By confirming, you agree to treat the following actions as your committed path and to record evidence of completion.
        </Body>
        {steps.map((step) => (
          <Meta key={step.id}>
            {step.position}. {step.title}
          </Meta>
        ))}
        <Body>This commitment will be permanently entered in your Life Portfolio.</Body>
        <CheckRow
          label="I will treat these actions as my committed path."
          checked={path}
          onToggle={() => {
            const next = !path;
            setPath(next);
            onPreparedChange(next && record);
          }}
        />
        <CheckRow
          label="I will record evidence of completion."
          checked={record}
          onToggle={() => {
            const next = !record;
            setRecord(next);
            onPreparedChange(path && next);
          }}
        />
        <Body muted>Confirm only if you are prepared to execute.</Body>
        <Button
          label={busy ? 'Entering commitment' : 'Confirm — I am prepared to execute'}
          onPress={onLock}
          disabled={!ready || !prepared || busy || steps.length === 0}
        />
      </Card>
    </>
  );
}
