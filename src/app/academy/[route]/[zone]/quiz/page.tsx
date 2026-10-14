import { QuizView } from '@/components/quiz/QuizView';
import { zoneParams } from '@/lib/params';

export const generateStaticParams = zoneParams;

export default function Page() {
  return <QuizView />;
}
