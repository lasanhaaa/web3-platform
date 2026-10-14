import { Suspense } from 'react';
import { Ask } from '@/components/wega-page/Ask';

/* Reads its question from the URL (?k= a ready prompt, ?q= a typed question, ?p= a passage), so it renders inside Suspense. */
export default function Page() {
  return (
    <Suspense fallback={<div className="page wp wp-res" />}>
      <Ask />
    </Suspense>
  );
}
