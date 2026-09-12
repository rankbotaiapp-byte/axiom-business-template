export function AxiomHalo() {
  return (
    <div className="halo" aria-hidden="true">
      <div className="halo__bloom" />
      <div className="halo__spectrum" />
      <div className="halo__spectrum-b" />
      <div className="halo__sheen" />
      <div className="halo__core" />
    </div>
  );
}

export function AxiomMark({ size = "lg" }: { size?: "sm" | "lg" }) {
  return (
    <span
      className={size === "sm" ? "axiom-mark axiom-mark--sm" : "axiom-mark"}
      aria-hidden="true"
    >
      <span className="axiom-mark__ring" />
    </span>
  );
}
