"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/lib/auth/actions";
import { useApp } from "@/stores/provider";
import { primaryPlan } from "@/stores/selectors";

export function MainNav() {
  const { state, persistError, remote } = useApp();
  const pathname = usePathname();
  const plan = primaryPlan(state);
  const visionId = plan?.visionId ?? state.visions[0]?.id ?? null;

  return (
    <header className="mx-auto flex w-full max-w-xl flex-col border-b border-border px-6 pt-6 pb-4 md:max-w-2xl">
      <nav className="flex items-center gap-5">
        <NavLink href="/" current={pathname === "/"}>
          Operations
        </NavLink>
        {visionId ? (
          <NavLink href={`/vision/${visionId}`} current={pathname.startsWith("/vision/")}>
            Vision
          </NavLink>
        ) : null}
        {plan ? (
          <NavLink href={`/plan/${plan.id}`} current={pathname.startsWith("/plan/")}>
            Plan
          </NavLink>
        ) : null}
        <NavLink href="/portfolio" current={pathname === "/portfolio"}>
          Vault
        </NavLink>
        {remote ? (
          <button type="button" onClick={() => void signOutAction()} className="kicker ml-auto">
            Sign out
          </button>
        ) : null}
      </nav>
      {persistError ? <p className="mt-3 text-[13px] leading-5 text-danger">{persistError}</p> : null}
    </header>
  );
}

function NavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      className={`kicker border-b border-transparent pb-1 ${
        current ? "kicker-ink border-accent" : ""
      }`}
    >
      {children}
    </Link>
  );
}
