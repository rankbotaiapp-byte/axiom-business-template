import type { AppRoute, AppState, Session } from "@/types";

export function emptySession(): Session {
  return {
    standardAcceptedAt: null,
    zeroStateCompletedAt: null,
    clarifyingCompletedAt: null,
  };
}

export function firstRoute(state: AppState): AppRoute {
  if (!state.session.standardAcceptedAt) return "/onboarding";
  if (!state.session.zeroStateCompletedAt) return "/onboarding/zero-state";
  if (!state.session.clarifyingCompletedAt || !state.profile) return "/onboarding/clarifying";
  if (state.visions.length === 0) return "/onboarding/vision";
  return "/";
}

export function isAllowedPath(state: AppState, pathname: string): boolean {
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    return true;
  }

  if (!state.session.standardAcceptedAt) {
    return (
      pathname === "/onboarding" ||
      pathname === "/onboarding/purpose" ||
      pathname === "/onboarding/standard"
    );
  }
  if (!state.session.zeroStateCompletedAt) {
    return pathname === "/onboarding/ready" || pathname === "/onboarding/zero-state";
  }
  if (!state.session.clarifyingCompletedAt || !state.profile) {
    return pathname === "/onboarding/clarifying";
  }
  if (state.visions.length === 0) {
    return pathname === "/onboarding/vision";
  }
  return (
    pathname === "/" ||
    pathname === "/portfolio" ||
    pathname.startsWith("/plan/") ||
    pathname.startsWith("/vision/")
  );
}

export function standardAccepted(state: AppState): boolean {
  return Boolean(state.session.standardAcceptedAt);
}

export function zeroStateComplete(state: AppState): boolean {
  return Boolean(state.session.zeroStateCompletedAt);
}
