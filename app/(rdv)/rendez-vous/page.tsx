import { Suspense } from "react";

import { MachineRdv } from "@/components/MachineRdv";

export default function PageRendezVous() {
  return (
    <Suspense fallback={null}>
      <MachineRdv />
    </Suspense>
  );
}
