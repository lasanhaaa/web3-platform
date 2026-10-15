import { Suspense } from 'react';
import { WegaHome } from '@/components/wega-page/WegaHome';

/* The Wega page: a chat. ?c= opens a topic, ?ask= a ready question (from "Open in Wega" and old links). */
export default function Page() {
  return (
    <Suspense fallback={<div className="page wp wp-home" />}>
      <WegaHome />
    </Suspense>
  );
}
