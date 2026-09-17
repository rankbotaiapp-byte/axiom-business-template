"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, CheckRow, Panel, Shell } from "@/components/ui";
import { acceptStandard } from "@/stores/app-store";
import { useApp } from "@/stores/provider";

export default function StandardPage() {
  const router = useRouter();
  const { commit } = useApp();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  function confirm() {
    if (!accepted || busy) return;
    setBusy(true);
    commit(acceptStandard);
    router.replace("/onboarding/zero-state");
  }

  return (
    <Shell overline="Z Point · 3 / 3" title="The operating standard">
      <p className="lede">
        Entry is gated on this standard. If it is too high, do not continue.
      </p>
      <Panel>
        <p className="copy">
          You will answer clarifying questions honestly about capacity, responsibilities, and
          competing goals. You will lock a plan only when you are prepared to treat it as the
          primary path. An action is complete only when evidence is recorded. The Life Portfolio is
          a permanent record of what was actually done.
        </p>
      </Panel>
      <CheckRow
        label="I accept this standard and will treat Z Point as work."
        checked={accepted}
        onToggle={() => setAccepted((value) => !value)}
      />
      <Button onClick={confirm} disabled={!accepted || busy}>
        Begin Zero State
      </Button>
    </Shell>
  );
}
