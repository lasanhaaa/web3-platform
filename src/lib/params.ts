import { ROUTES } from './curriculum';

/* Every Academy URL is known up front, so all pages prerender (Cache Components needs this for useParams). */
export const routeParams = () => ROUTES.map((r: any) => ({ route: r.id }));
export const zoneParams = () => ROUTES.flatMap((r: any) => r.zones.map((_: any, zi: number) => ({ route: r.id, zone: String(zi + 1) })));
export const lessonParams = () =>
  ROUTES.flatMap((r: any) =>
    r.zones.flatMap((z: any, zi: number) => z.lessons.map((_: any, li: number) => ({ route: r.id, zone: String(zi + 1), lesson: String(li + 1) }))),
  );

/* Unknown params render on request under Cache Components (dynamicParams isn't allowed), so <Known> 404s them with these. */
const zoneOf = (route: string, zone: string) => (/^\d+$/.test(zone) ? ROUTES.find((r: any) => r.id === route)?.zones[+zone - 1] : undefined);
export const zoneExists = (route: string, zone: string) => !!zoneOf(route, zone);
export const lessonExists = (route: string, zone: string, lesson: string) => /^\d+$/.test(lesson) && !!zoneOf(route, zone)?.lessons[+lesson - 1];
