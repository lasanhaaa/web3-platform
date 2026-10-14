import { Suspense } from 'react';
import { WegaHome } from '@/components/wega-page/WegaHome';

/* The Wega page: ask anything, or pick a topic for ready questions. ?c= preselects a topic. */
export default function Page() {
  return (
    <Suspense fallback={<div className="page wp wp-home" />}>
      <WegaHome />
    </Suspense>
  );
}
