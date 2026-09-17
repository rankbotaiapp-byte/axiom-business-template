"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { authMessage } from "@/lib/auth/messages";
import { loadWorkspaceAction } from "@/lib/data/actions";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { firstRoute } from "@/lib/utils/session";
import { useApp } from "@/stores/provider";
import { Button, Panel, TextField } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const { state } = useApp();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"password" | "signup" | "link" | null>(null);
  const [error, setError] = useState(
    searchParams.get("error") === "auth" ? "The sign-in link was rejected or expired." : null
  );
  const [notice, setNotice] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <>
        <Panel>
          <p className="copy">
            Supabase is not configured. This instance writes to a local record only.
          </p>
        </Panel>
        <Button onClick={() => router.push(firstRoute(state))}>Continue</Button>
      </>
    );
  }

  async function afterSession() {
    const result = await loadWorkspaceAction();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.assign(firstRoute(result.data));
  }

  async function withPassword(mode: "password" | "signup") {
    setBusy(mode);
    setError(null);
    setNotice(null);
    const supabase = createBrowserSupabase();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const response =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: redirectTo },
          })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(null);
    if (response.error) {
      setError(authMessage(response.error.message));
      return;
    }
    if (mode === "signup" && !response.data.session) {
      setNotice("Confirm the account from the message sent to this address.");
      return;
    }
    await afterSession();
  }

  async function sendLink() {
    setBusy("link");
    setError(null);
    setNotice(null);
    const supabase = createBrowserSupabase();
    const { error: linkError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(null);
    if (linkError) {
      setError(authMessage(linkError.message));
      return;
    }
    setNotice("A sign-in link was sent to this address.");
  }

  return (
    <>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void withPassword("password");
        }}
      >
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="name@domain"
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          placeholder="Required for password sign-in"
        />
        {error ? <p className="text-base leading-6 text-danger">{error}</p> : null}
        {notice ? <p className="copy">{notice}</p> : null}
        <Button type="submit" disabled={!email || !password || busy !== null}>
          {busy === "password" ? "Signing in" : "Sign in"}
        </Button>
      </form>
      <Button
        tone="neutral"
        disabled={!email || !password || busy !== null}
        onClick={() => void withPassword("signup")}
      >
        {busy === "signup" ? "Creating account" : "Create account"}
      </Button>
      <Button tone="neutral" disabled={!email || busy !== null} onClick={() => void sendLink()}>
        {busy === "link" ? "Sending link" : "Send sign-in link"}
      </Button>
    </>
  );
}
