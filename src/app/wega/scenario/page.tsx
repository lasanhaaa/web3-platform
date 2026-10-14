import { Suspense } from 'react';
import { Scenario } from '@/components/wega-page/Results';

/* Reads its question from the URL (?s=eth30, crash22, usdc, liq), so it renders inside Suspense. */
export default function Page() {
  return (
    <Suspense fallback={<div className="page wp wp-res" />}>
      <Scenario />
    </Suspense>
  );
}
