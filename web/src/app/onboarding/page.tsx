"use client";

import { useRouter } from "next/navigation";

import { Button, Panel, Shell } from "@/components/ui";

export default function OpeningPage() {
  const router = useRouter();
  return (
    <Shell overline="Z Point · 1 / 3" title="Coherent intention. Documented execution.">
      <p className="lede">
        Highest priorities are treated as work that must be planned, tracked, and completed. This is
        not a motivation product.
      </p>
      <Panel>
        <p className="copy">
          The system does not create results. It requires coherent input, a capacity-aware sequence,
          a formal lock, and recorded evidence.
        </p>
      </Panel>
      <Button onClick={() => router.push("/onboarding/purpose")}>Continue</Button>
    </Shell>
  );
}
