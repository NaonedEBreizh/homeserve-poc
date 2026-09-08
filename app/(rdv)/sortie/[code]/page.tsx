import { Suspense } from "react";

import { EcranSortie } from "@/components/EcranSortie";

export default async function PageSortie({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <Suspense fallback={null}>
      <EcranSortie code={code} />
    </Suspense>
  );
}
