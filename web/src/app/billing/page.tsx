import { Shell } from "@/components/ui";

export default function BillingPage() {
  return (
    <Shell overline="Z Point" title="Billing">
      <p className="lede">Manage the current subscription state for this account.</p>
      <p className="copy">Billing controls are configured to the Stripe subscription record for this workspace.</p>
    </Shell>
  );
}
