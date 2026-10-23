import { Suspense } from 'react';
import { QuizView } from '@/components/quiz/QuizView';
import { Known } from '@/components/shell/Known';
import { zoneParams } from '@/lib/params';

export const generateStaticParams = zoneParams;

export default function Page({ params }: PageProps<'/academy/[route]/[zone]/quiz'>) {
  return (
    <Suspense fallback={null}>
      <Known params={params}>
        <QuizView />
      </Known>
    </Suspense>
  );
}
