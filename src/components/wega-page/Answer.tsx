'use client';
/* A ready question's answer (/wega/risk-mix, /wega/ask?k=…): the same answer in the Wega page's chat and in the side
   panel's hub. */
import { isScen } from '@/lib/wega-page';
import { isSym } from '@/lib/prices';
import { Allocation, IdleCost, LearningPath, PortfolioCheck, RiskMix, Scenario } from './Results';
import { AssetAnswer } from './Asset';
import { TextReply } from './Ask';

export function AnswerFor({ href }: { href: string }) {
  const [path, qs] = href.split('?');
  const sp = new URLSearchParams(qs);
  switch (path) {
    case '/wega/portfolio-check':
      return <PortfolioCheck />;
    case '/wega/risk-mix':
      return <RiskMix />;
    case '/wega/allocation':
      return <Allocation />;
    case '/wega/idle-cost':
      return <IdleCost />;
    case '/wega/learning-path':
      return <LearningPath />;
    case '/wega/scenario': {
      const s = sp.get('s');
      return <Scenario s={isScen(s) ? s : 'eth30'} />;
    }
    case '/wega/ask':
      return <TextReply k={sp.get('k') || ''} />;
    case '/wega/asset': {
      const a = sp.get('a'),
        vs = sp.get('vs');
      return isSym(a) ? <AssetAnswer a={a} vs={isSym(vs) && vs !== a ? vs : undefined} /> : null;
    }
  }
  return null;
}
