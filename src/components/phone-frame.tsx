import type { ReactNode } from "react";
import { AxiomHalo } from "@/components/axiom-halo";
import type { HaloMode } from "@/lib/axiom-store";

export function PhoneFrame({
  mode,
  children,
}: {
  mode: HaloMode;
  children: ReactNode;
}) {
  return (
    <div className="stage">
      <div className="device-fit">
        <div className="device" data-halo={mode}>
        <span className="device__side device__side--vol" aria-hidden />
        <span className="device__side device__side--pwr" aria-hidden />
        <div className="bezel">
          <div className="glass">
            <div className="halo-wash" aria-hidden />
            {children}
          </div>
        </div>
        <AxiomHalo />
      </div>
      </div>
    </div>
  );
}
