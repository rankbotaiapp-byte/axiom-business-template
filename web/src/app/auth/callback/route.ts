import { NextResponse } from "next/server";

import { loadWorkspace } from "@/lib/data/workspace";
import { createServerSupabase } from "@/lib/supabase/server";
import { firstRoute } from "@/lib/utils/session";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  try {
    const state = await loadWorkspace();
    return NextResponse.redirect(`${origin}${firstRoute(state)}`);
  } catch {
    return NextResponse.redirect(`${origin}/`);
  }
}
