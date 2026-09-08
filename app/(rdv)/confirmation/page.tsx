import { Suspense } from "react";

import { Confirmation } from "@/components/Confirmation";

export default function PageConfirmation() {
  return (
    <Suspense fallback={null}>
      <Confirmation />
    </Suspense>
  );
}
