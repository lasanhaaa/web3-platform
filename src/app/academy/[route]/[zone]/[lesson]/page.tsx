import { Suspense } from 'react';
import { LessonView } from '@/components/lesson/LessonView';
import { Known } from '@/components/shell/Known';
import { lessonParams } from '@/lib/params';

export const generateStaticParams = lessonParams;

export default function Page({ params }: PageProps<'/academy/[route]/[zone]/[lesson]'>) {
  return (
    <Suspense fallback={null}>
      <Known params={params}>
        <LessonView />
      </Known>
    </Suspense>
  );
}
