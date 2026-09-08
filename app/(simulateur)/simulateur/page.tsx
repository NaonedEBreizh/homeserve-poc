import { Suspense } from "react";

import { Simulateur } from "@/components/Simulateur";

export default function PageSimulateur() {
  return (
    <Suspense fallback={null}>
      <Simulateur />
    </Suspense>
  );
}
