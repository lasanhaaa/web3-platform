import { Suspense } from 'react';
import { RouteView } from '@/components/academy/RouteView';
import { Known } from '@/components/shell/Known';
import { zoneParams } from '@/lib/params';

export const generateStaticParams = zoneParams;

export default function Page({ params }: PageProps<'/academy/[route]/[zone]'>) {
  return (
    <Suspense fallback={null}>
      <Known params={params}>
        <RouteView />
      </Known>
    </Suspense>
  );
}
