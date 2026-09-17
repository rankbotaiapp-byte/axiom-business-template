import type { ReactNode } from "react";

import { Button, Panel } from "@/components/ui";
import { isProSubscription } from "@/lib/billing/features";

export function ProUpgradePrompt({
  tier,
  status,
  title = "Pro required",
  body,
  action,
  onUpgrade,
}: {
  tier?: string | null;
  status?: string | null;
  title?: string;
  body: string;
  action?: ReactNode;
  onUpgrade?: () => void;
}) {
  const pro = isProSubscription(tier, status);

  if (pro) {
    return null;
  }

  return (
    <Panel>
      <p className="kicker kicker-accent">{title}</p>
      <p className="copy">{body}</p>
      {action ?? (
        <Button tone="accent" onClick={onUpgrade} disabled={!onUpgrade}>
          Upgrade to Pro
        </Button>
      )}
    </Panel>
  );
}
