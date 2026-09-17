"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { livingFieldStyle, livingVisual } from "@/lib/vision-engine";
import { mediaKind } from "@/lib/vision-capture";
import type { PossibilityTurningPoint, Vision } from "@/types";

const DENSITY_TICK_MS = 900;
const THRESHOLD_LIFT_MS = 1600;

export function LivingVision({
  vision,
  threshold,
  showLink = true,
}: {
  vision: Vision;
  threshold: PossibilityTurningPoint | undefined;
  showLink?: boolean;
}) {
  const visual = livingVisual(vision.livingDensity, Boolean(threshold));
  const ticked = useDensityTick(vision.livingDensity);
  const crossed = useThresholdLift(Boolean(threshold));
  const images = (vision.mediaUrls ?? []).filter((url) => mediaKind(url) === "image");

  return (
    <article
      className={`living-vision${visual.threshold ? " is-threshold" : ""}${
        ticked ? " just-densified" : ""
      }${crossed ? " just-crossed" : ""}`}
      style={livingFieldStyle(visual)}
    >
      <div className="living-vision-object">
        <span className="living-vision-plane" />
        <span className="living-vision-grain" />
        <span className="living-vision-veil" />
        {images.length ? (
          <div className={`living-vision-media${images.length > 1 ? " is-split" : ""}`}>
            {images.map((url) => (
              <div key={url} className="living-vision-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="living-vision-image" />
              </div>
            ))}
          </div>
        ) : null}
        <p className="living-vision-kicker kicker">Living Vision · {visual.band}</p>
        <h2 className="living-vision-title">{vision.title}</h2>
        <p className="living-vision-body">{vision.description}</p>
      </div>

      <div className="living-vision-readout">
        <div className="living-vision-bar" aria-hidden>
          <span className="living-vision-bar-fill" />
        </div>
        <p className={`quiet ${threshold ? "quiet-accent" : ""}`}>
          {threshold
            ? "Threshold reached. The picture is no longer theoretical."
            : "The object densifies only from recorded evidence."}
        </p>
        {showLink ? (
          <Link
            href={`/vision/${vision.id}`}
            className="kicker kicker-accent"
          >
            Open living vision
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function useDensityTick(density: number): boolean {
  const previous = useRef<number | null>(null);
  const [ticked, setTicked] = useState(false);

  useEffect(() => {
    if (previous.current === null) {
      previous.current = density;
      return;
    }
    if (density > previous.current) {
      setTicked(true);
      const timer = window.setTimeout(() => setTicked(false), DENSITY_TICK_MS);
      previous.current = density;
      return () => window.clearTimeout(timer);
    }
    previous.current = density;
  }, [density]);

  return ticked;
}

function useThresholdLift(threshold: boolean): boolean {
  const seen = useRef(threshold);
  const [crossed, setCrossed] = useState(false);

  useEffect(() => {
    if (threshold && !seen.current) {
      setCrossed(true);
      const timer = window.setTimeout(() => setCrossed(false), THRESHOLD_LIFT_MS);
      seen.current = true;
      return () => window.clearTimeout(timer);
    }
    seen.current = threshold;
  }, [threshold]);

  return crossed;
}
