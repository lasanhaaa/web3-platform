import { LessonView } from '@/components/lesson/LessonView';
import { lessonParams } from '@/lib/params';

export const generateStaticParams = lessonParams;

export default function Page() {
  return <LessonView />;
}
