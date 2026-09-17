"use client";

import { useEffect, useState } from "react";

const EXIT_MS = 1800;

export function FocusHalo({ active }: { active: boolean }) {
  const [present, setPresent] = useState(active);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    if (active) {
      setPresent(true);
      const frame = window.requestAnimationFrame(() => setLit(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setLit(false);
    const timer = window.setTimeout(() => setPresent(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!present) return null;

  return (
    <div
      className={`focus-halo${lit ? " is-lit" : ""}`}
      aria-hidden
      role="presentation"
    >
      <div className="focus-halo-field">
        <span className="focus-halo-glow" />
        <span className="focus-halo-core" />
      </div>
      <span className="focus-halo-orbit" />
    </div>
  );
}
