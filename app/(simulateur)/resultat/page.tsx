import { Suspense } from "react";

import { Resultat } from "@/components/Resultat";

export default function PageResultat() {
  return (
    <Suspense fallback={null}>
      <Resultat />
    </Suspense>
  );
}
