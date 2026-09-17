import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { RecordStatus, Shell } from "@/components/ui";
import { getInitialWorkspace } from "@/lib/data/workspace";
import { firstRoute } from "@/lib/utils/session";

export default async function LoginPage() {
  const session = await getInitialWorkspace();
  if (session) redirect(firstRoute(session.state));

  return (
    <Shell overline="Z Point" title="Sign in to the record.">
      <p className="lede">
        Access is limited to the signed-in account. New accounts begin at onboarding. Existing
        records open at the active vision.
      </p>
      <Suspense fallback={<RecordStatus label="Preparing sign-in" />}>
        <LoginForm />
      </Suspense>
    </Shell>
  );
}
