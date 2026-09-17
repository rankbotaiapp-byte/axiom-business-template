import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';

import { PlanReview } from '../src/components/PlanReview';
import { Screen } from '../src/components/Screen';
import { Body, Button, Card, CheckRow, Field, Meta, Overline, Title } from '../src/components/ui';
import { assessIntention } from '../src/engine/quality';
import { assessVisualization } from '../src/engine/visualize';
import { playVoiceAudio, startBackgroundBed, stopBackgroundBed, stopVoiceAudio } from '../src/audio';
import { useStore } from '../src/store';
import { color, space, type } from '../src/theme';
import type { CapacityMap, Step, Vision } from '../src/types';

type Stage = 'serious' | 'regulate' | 'visualize' | 'context' | 'capture' | 'plan';

const STAGES: Stage[] = ['serious', 'regulate', 'visualize', 'context', 'capture', 'plan'];
const SETTLE_SECONDS = 90;

export default function BeginScreen() {
  const store = useStore();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('serious');
  const [busy, setBusy] = useState(false);

  const [seen, setSeen] = useState('');
  const [noLonger, setNoLonger] = useState('');
  const [tuesday, setTuesday] = useState('');

  const [omitted, setOmitted] = useState('');
  const [hoursNote, setHoursNote] = useState('');
  const [competing, setCompeting] = useState('');
  const [weekly, setWeekly] = useState('');
  const [constraints, setConstraints] = useState('');
  const [loadName, setLoadName] = useState('');
  const [loadHours, setLoadHours] = useState('');
  const [contextHonest, setContextHonest] = useState(false);

  const [statement, setStatement] = useState('');
  const [evidence, setEvidence] = useState('');

  const [steps, setSteps] = useState<Step[]>([]);
  const [vision, setVision] = useState<Vision | null>(null);
  const [map, setMap] = useState<CapacityMap | null>(null);
  const [prepared, setPrepared] = useState(false);
  const [altReason, setAltReason] = useState('');

  const index = STAGES.indexOf(stage);

  async function finishBegin() {
    await store.completeBegin();
    router.replace('/');
  }

  return (
    <Screen>
      <Overline>
        Begin {index + 1} / {STAGES.length}
      </Overline>

      {stage === 'serious' ? (
        <Serious
          busy={busy}
          onContinue={async () => {
            setBusy(true);
            await store.recordBegin(
              'Continued. The next sequence is regulation, visualization, context, capture, and the first plan.'
            );
            setBusy(false);
            setStage('regulate');
          }}
        />
      ) : null}

      {stage === 'regulate' ? (
        <Regulate
          busy={busy}
          onClear={async () => {
            setBusy(true);
            await store.recordRegulate(
              'Clear. Capture is permitted. Not acting from urgency, collapse, or fantasy.'
            );
            setBusy(false);
            setStage('visualize');
          }}
        />
      ) : null}

      {stage === 'visualize' ? (
        <Visualize
          seen={seen}
          noLonger={noLonger}
          tuesday={tuesday}
          setSeen={setSeen}
          setNoLonger={setNoLonger}
          setTuesday={setTuesday}
          busy={busy}
          onContinue={async () => {
            const quality = assessVisualization(seen, noLonger, tuesday);
            if (!quality.ok) {
              Alert.alert('Not precise enough', quality.notes[0] ?? 'Write what can be observed.');
              return;
            }
            setBusy(true);
            await store.recordVisualize({
              seen: seen.trim(),
              noLonger: noLonger.trim(),
              tuesday: tuesday.trim(),
            });
            if (!statement) setStatement(seen.trim());
            if (!evidence) setEvidence(tuesday.trim());
            setBusy(false);
            setStage('context');
          }}
        />
      ) : null}

      {stage === 'context' ? (
        <Context
          omitted={omitted}
          hoursNote={hoursNote}
          competing={competing}
          weekly={weekly}
          constraints={constraints}
          loadName={loadName}
          loadHours={loadHours}
          honest={contextHonest}
          setOmitted={setOmitted}
          setHoursNote={setHoursNote}
          setCompeting={setCompeting}
          setWeekly={setWeekly}
          setConstraints={setConstraints}
          setLoadName={setLoadName}
          setLoadHours={setLoadHours}
          setHonest={setContextHonest}
          busy={busy}
          onContinue={async () => {
            if (Number(weekly) - Number(loadHours) < 1) {
              Alert.alert('No capacity', 'After this responsibility, no hours remain for the vision.');
              return;
            }
            setBusy(true);
            try {
              await store.saveIntake({
                omittedResponsibilities: omitted,
                actualHoursNote: hoursNote,
                competingGoals: competing,
              });
              await store.saveProfile({
                weeklyHours: Number(weekly),
                constraints: constraints.trim(),
              });
              await store.addResponsibility({
                name: loadName,
                weeklyHours: Number(loadHours),
                nonNegotiable: true,
              });
              setStage('capture');
            } catch (error) {
              Alert.alert('Context incomplete', error instanceof Error ? error.message : 'Unknown error');
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}

      {stage === 'capture' ? (
        <Capture
          statement={statement}
          evidence={evidence}
          setStatement={setStatement}
          setEvidence={setEvidence}
          busy={busy}
          onContinue={async () => {
            setBusy(true);
            try {
              const existing = await store.getActiveVision();
              if (!existing) {
                await store.captureVision({
                  statement: statement.trim(),
                  evidence: evidence.trim(),
                  regulated: true,
                });
              }
              await store.ensureSequence();
              const nextVision = await store.getActiveVision();
              const nextMap = await store.getCapacity();
              setVision(nextVision);
              setMap(nextMap);
              if (nextVision) {
                setSteps(await store.listSteps(nextVision.id));
              }
              setStage('plan');
            } catch (error) {
              Alert.alert('Cannot capture', error instanceof Error ? error.message : 'Unknown error');
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}

      {stage === 'plan' ? (
        vision ? (
          <PlanReview
            vision={vision}
            map={map}
            steps={steps}
            prepared={prepared}
            onPreparedChange={setPrepared}
            reason={altReason}
            onReasonChange={setAltReason}
            busy={busy}
            onAlternative={async () => {
              setBusy(true);
              try {
                await store.requestAlternative(altReason);
                const next = await store.getActiveVision();
                setVision(next);
                setAltReason('');
                setPrepared(false);
                if (next) setSteps(await store.listSteps(next.id));
              } catch (error) {
                Alert.alert('Cannot revise', error instanceof Error ? error.message : 'Unknown error');
              } finally {
                setBusy(false);
              }
            }}
            onLock={async () => {
              setBusy(true);
              try {
                await store.lockPlan(prepared);
                await finishBegin();
              } catch (error) {
                Alert.alert('Cannot lock', error instanceof Error ? error.message : 'Unknown error');
                setBusy(false);
              }
            }}
          />
        ) : (
          <Body>Vision missing. Capture it before a plan can be reviewed.</Body>
        )
      ) : null}
    </Screen>
  );
}

function Serious({ busy, onContinue }: { busy: boolean; onContinue: () => void }) {
  return (
    <>
      <Title>Initiate the process</Title>
      <Card>
        <Body>The following sequence will guide you into coherence for precise intention work.</Body>
        <Body>You will enter a regulated state, then visualize the highest version of your chosen reality in observable terms.</Body>
        <Body>The system will extract your operational context: responsibilities, actual capacity, competing goals, and constraints.</Body>
        <Body>You will capture your vision as a precise outcome with verifiable evidence.</Body>
        <Body>Finally, you will lock your first execution sequence.</Body>
      </Card>
      <Body muted>This process requires your full attention and honest assessment. Continue only when ready.</Body>
      <Button label={busy ? 'Recording' : 'I am ready'} onPress={onContinue} disabled={busy} />
    </>
  );
}

function Regulate({ busy, onClear }: { busy: boolean; onClear: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'intro' | 'measuring' | 'extracting' | 'done'>('idle');
  const [zeroPointReached, setZeroPointReached] = useState(false);
  const [audioOn, setAudioOn] = useState(true);

  const pulseInterval = useRef<NodeJS.Timeout | null>(null);
  const accelSubscription = useRef<any>(null);
  const movementHistory = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, []);

  function stopEverything() {
    stopBackgroundBed();
    stopVoiceAudio();
    if (pulseInterval.current) {
      clearInterval(pulseInterval.current);
      pulseInterval.current = null;
    }
    if (accelSubscription.current) {
      accelSubscription.current.remove();
      accelSubscription.current = null;
    }
  }

  async function startSession() {
    setPhase('intro');
    setZeroPointReached(false);
    movementHistory.current = [];

    if (audioOn) {
      try {
        console.log('[Audio] Loading frequency bed...');
        await startBackgroundBed('clear');
        console.log('[Audio] Frequency bed playing');
      } catch (e) {
        console.log('[Audio] Error loading frequency bed:', e);
        // Continue without audio if it fails
      }

      await new Promise<void>((resolve) => {
        playVoiceAudio('sessionBriefingZeroPoint', () => {
          resolve();
        });
      });
    }

    setPhase('measuring');
    startVibrationPulses();
    startBreathMonitoring();
  }

  function startVibrationPulses() {
    pulseInterval.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 5000);
  }

  function startBreathMonitoring() {
    Accelerometer.setUpdateInterval(200);

    accelSubscription.current = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      movementHistory.current.push(magnitude);

      if (movementHistory.current.length > 40) {
        movementHistory.current.shift();
      }

      if (movementHistory.current.length >= 30) {
        const recent = movementHistory.current.slice(-30);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const variance = recent.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / recent.length;

        if (variance < 0.0008 && !zeroPointReached) {
          setZeroPointReached(true);
          onZeroPointReached();
        }
      }
    });
  }

  async function onZeroPointReached() {
    if (pulseInterval.current) {
      clearInterval(pulseInterval.current);
      pulseInterval.current = null;
    }

    setPhase('extracting');

    if (audioOn) {
      playVoiceAudio('zeroPointReachedExtractionStart');
    }

    setTimeout(() => {
      setPhase('done');
    }, 15000);
  }

  function handleContinue() {
    stopEverything();
    onClear();
  }

  return (
    <>
      <Title>Regulated state</Title>

      {phase === 'idle' && (
        <>
          <Body muted>
            Position yourself comfortably. Place your phone on your stomach with the microphone facing your mouth. You will receive vibration pulses to guide your breath into coherence.
          </Body>

          <Pressable
            onPress={() => setAudioOn(!audioOn)}
            style={{ marginBottom: space.md }}
          >
            <Meta>{audioOn ? 'Guided voice on' : 'Guided voice off'}</Meta>
          </Pressable>

          <Button label="Enter coherence" onPress={startSession} />
        </>
      )}

      {phase === 'intro' && (
        <Card>
          <Overline>Preparing</Overline>
          <Body>Listen carefully…</Body>
        </Card>
      )}

      {phase === 'measuring' && (
        <>
          <Card>
            <Overline>Coherence measurement</Overline>
            <Title>Follow the pulses</Title>
            <Meta>Breathe with the vibration. Inhale on the pulse. Exhale in the silence.</Meta>
          </Card>
          <Body muted style={{ marginTop: space.md }}>
            Remain still. The system is monitoring your breath rate to detect coherence.
          </Body>
        </>
      )}

      {phase === 'extracting' && (
        <Card>
          <Overline>Zero Point</Overline>
          <Title>Coherence reached</Title>
          <Meta>Allow the intention to form clearly…</Meta>
        </Card>
      )}

      {phase === 'done' && (
        <>
          <Card>
            <Overline>Coherence established</Overline>
            <Body>You have reached zero point. Your system is clear. Capture is now permitted.</Body>
          </Card>
          <Button
            label={busy ? 'Recording' : 'Continue from coherence'}
            onPress={handleContinue}
            disabled={busy}
          />
        </>
      )}
    </>
  );
}

function Visualize({
  seen,
  noLonger,
  tuesday,
  setSeen,
  setNoLonger,
  setTuesday,
  busy,
  onContinue,
}: {
  seen: string;
  noLonger: string;
  tuesday: string;
  setSeen: (value: string) => void;
  setNoLonger: (value: string) => void;
  setTuesday: (value: string) => void;
  busy: boolean;
  onContinue: () => void;
}) {
  const quality = useMemo(() => assessVisualization(seen, noLonger, tuesday), [seen, noLonger, tuesday]);

  return (
    <>
      <Title>Highest version</Title>
      <Body muted>
        From coherence, visualize the chosen reality. Write what you observe in concrete terms. This is not a vision board. Extract observable facts so prioritization can be accurate.
      </Body>
      <Field
        label="What does a third party see that does not exist now?"
        value={seen}
        onChangeText={setSeen}
        placeholder="The offer is live. Three clients have paid. Delivery is on the calendar."
        multiline
      />
      <Field
        label="What is no longer true?"
        value={noLonger}
        onChangeText={setNoLonger}
        placeholder="No unpaid strategy work. No waiting for a better week."
        multiline
      />
      <Field
        label="What does a normal Tuesday look like?"
        value={tuesday}
        onChangeText={setTuesday}
        placeholder="Morning delivery. Afternoon one sales conversation. Evening closed."
        multiline
      />
      {seen || noLonger || tuesday ? (
        <Card>
          <Overline>Precision assessment</Overline>
          {quality.ok ? <Body>Sufficiently observable for planning.</Body> : quality.notes.map((note) => <Body key={note}>{note}</Body>)}
        </Card>
      ) : null}
      <Button label={busy ? 'Recording' : 'Capture this visualization'} onPress={onContinue} disabled={busy || !quality.ok} />
    </>
  );
}

function Context({
  omitted,
  hoursNote,
  competing,
  weekly,
  constraints,
  loadName,
  loadHours,
  honest,
  setOmitted,
  setHoursNote,
  setCompeting,
  setWeekly,
  setConstraints,
  setLoadName,
  setLoadHours,
  setHonest,
  busy,
  onContinue,
}: {
  omitted: string;
  hoursNote: string;
  competing: string;
  weekly: string;
  constraints: string;
  loadName: string;
  loadHours: string;
  honest: boolean;
  setOmitted: (value: string) => void;
  setHoursNote: (value: string) => void;
  setCompeting: (value: string) => void;
  setWeekly: (value: string) => void;
  setConstraints: (value: string) => void;
  setLoadName: (value: string) => void;
  setLoadHours: (value: string) => void;
  setHonest: (value: boolean) => void;
  busy: boolean;
  onContinue: () => void;
}) {
  const weeklyHours = Number(weekly);
  const responsibilityHours = Number(loadHours);
  const ready =
    honest &&
    omitted.trim().length >= 16 &&
    hoursNote.trim().length >= 16 &&
    competing.trim().length >= 16 &&
    loadName.trim().length >= 2 &&
    Number.isFinite(weeklyHours) &&
    weeklyHours > 0 &&
    Number.isFinite(responsibilityHours) &&
    responsibilityHours > 0;

  return (
    <>
      <Title>Operational context</Title>
      <Body muted>Accurate prioritization requires an honest capacity map. If you omit the real load, the plan will be fiction. The system cannot build on aspirational estimates.</Body>
      <Field
        label="Responsibilities you usually omit"
        value={omitted}
        onChangeText={setOmitted}
        placeholder="Care, recovery, commute, the work you pretend is optional."
        multiline
      />
      <Field
        label="Hours you actually have after those"
        value={hoursNote}
        onChangeText={setHoursNote}
        placeholder="The week you have. Not the week you want."
        multiline
      />
      <Field
        label="Competing goals that will take hours"
        value={competing}
        onChangeText={setCompeting}
        placeholder="Name them. If none, say why that is true this week."
        multiline
      />
      <Field
        label="Hours available in a week"
        value={weekly}
        onChangeText={setWeekly}
        placeholder="40"
        keyboardType="decimal-pad"
      />
      <Field
        label="Hard constraints"
        value={constraints}
        onChangeText={setConstraints}
        placeholder="Clinic Thursdays. Children three nights."
        multiline
      />
      <Field label="Primary responsibility" value={loadName} onChangeText={setLoadName} placeholder="Employment" />
      <Field
        label="Hours that responsibility takes"
        value={loadHours}
        onChangeText={setLoadHours}
        placeholder="32"
        keyboardType="decimal-pad"
      />
      <CheckRow
        label="These answers are complete, including what I usually leave out."
        checked={honest}
        onToggle={() => setHonest(!honest)}
      />
      <Button label={busy ? 'Saving' : 'Record operational context'} onPress={onContinue} disabled={!ready || busy} />
    </>
  );
}

function Capture({
  statement,
  evidence,
  setStatement,
  setEvidence,
  busy,
  onContinue,
}: {
  statement: string;
  evidence: string;
  setStatement: (value: string) => void;
  setEvidence: (value: string) => void;
  busy: boolean;
  onContinue: () => void;
}) {
  const quality = useMemo(() => assessIntention(statement, evidence), [statement, evidence]);

  return (
    <>
      <Title>Capture the vision</Title>
      <Body muted>Distill the visualization into one operational outcome and the specific evidence that would confirm its completion.</Body>
      <Field
        label="What must be true"
        value={statement}
        onChangeText={setStatement}
        placeholder="Publish the offer and collect payment from three clients."
        multiline
      />
      <Field
        label="Evidence a third party could verify"
        value={evidence}
        onChangeText={setEvidence}
        placeholder="Three paid invoices. Offer live. Delivery dates held."
        multiline
      />
      <Card>
        <Overline>Intention quality assessment</Overline>
        {quality.ok ? <Body>Sufficiently precise for execution planning.</Body> : quality.notes.map((note) => <Body key={note}>{note}</Body>)}
      </Card>
      <Button label={busy ? 'Saving' : 'Capture vision'} onPress={onContinue} disabled={!quality.ok || busy} />
    </>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceOn]}>
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choices: {
    gap: space.sm,
  },
  choice: {
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    paddingVertical: 12,
    paddingHorizontal: space.md,
  },
  choiceOn: {
    borderColor: color.accent,
  },
  choiceLabel: {
    ...type.body,
    color: color.text,
  },
  choiceLabelOn: {
    color: color.accent,
  },
});