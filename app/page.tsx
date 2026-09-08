import { Suspense } from "react";

import { Accueil } from "@/components/Accueil";

export default function PageAccueil() {
  // `?projet=` est lu côté client : d'où le Suspense.
  return (
    <Suspense fallback={null}>
      <Accueil />
    </Suspense>
  );
}
