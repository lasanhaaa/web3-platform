import { RouteView } from '@/components/academy/RouteView';
import { zoneParams } from '@/lib/params';

export const generateStaticParams = zoneParams;

export default function Page() {
  return <RouteView />;
}
