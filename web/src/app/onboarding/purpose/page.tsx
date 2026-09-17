"use client";

import { useRouter } from "next/navigation";

import { Button, Panel, Shell } from "@/components/ui";

export default function PurposePage() {
  const router = useRouter();
  return (
    <Shell overline="Z Point · 2 / 3" title="What this tool does">
      <p className="lede">
        A fixed operating sequence. Each stage produces a record the next stage is required to use.
      </p>
      <Panel>
        <p className="copy">
          Regulate, then state actual load. Capture a vision against that snapshot. Generate a
          capacity-aware sequence and lock it. Record evidence. The vision densifies only from the
          record. The vault is permanent.
        </p>
      </Panel>
      <Button onClick={() => router.push("/onboarding/standard")}>Continue</Button>
    </Shell>
  );
}
