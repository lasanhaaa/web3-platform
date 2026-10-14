import { ROUTES } from './curriculum';

/* Every Academy URL is known up front, so all pages prerender (Cache Components needs this for useParams). */
export const routeParams = () => ROUTES.map((r: any) => ({ route: r.id }));
export const zoneParams = () => ROUTES.flatMap((r: any) => r.zones.map((_: any, zi: number) => ({ route: r.id, zone: String(zi + 1) })));
export const lessonParams = () =>
  ROUTES.flatMap((r: any) =>
    r.zones.flatMap((z: any, zi: number) => z.lessons.map((_: any, li: number) => ({ route: r.id, zone: String(zi + 1), lesson: String(li + 1) }))),
  );
