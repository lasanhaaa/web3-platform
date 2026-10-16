'use client';
/* Wega's scripted brain: context labels, prompt chips, the system prompt and the scripted answers.
   Ported from the prototype (wgAnswer, wgRoute, wgRules). All portfolio numbers are sample data. */
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES, R, key, dur, pad, LSUM as LSUM_, glossFor, chaptersFor, chIdx, ANALOGY as ANALOGY_, ZTIPS as ZTIPS_, zkey } from './curriculum';
import { Q, SIM, rightText } from './quiz-bank';
import { PF, hfAt, liqAt, netAt, num, usd, pctS, hfCls, APPR, WATCH, ALERT_SUGG } from './portfolio';
import { S, allCount, focus, routeCount, nextStep, isDone, pct, fmtMin, lessonOpen, quizOpen, chooseRoute, type Step } from './progress';
import { stepTitle, stepCrumb, whyNext, portFor } from './learn';
import { CAT, bState } from './badges';
import { getQZ, quizQs, startQuizState } from './quiz-state';
import { hsim } from './hsim';
import { seekLesson } from './player';
import { hrefLesson, hrefQuiz, hrefRoute, hrefMap } from './nav';
import { toast } from './toast';
import { GOOSE } from './icons';
import { Svg } from './svg';
import { wega, wgRun, wgClose, type WegaPage, type Answer, type Chip } from './wega';
import { SimBlock } from '@/components/wega/Sim';
import { stratCtxLabel, stratChips, stratHello, stratRules, stratAnswer, stratRoute } from './wega-strategies';

const LSUM = LSUM_ as Record<string, string[]>,
  ANALOGY = ANALOGY_ as Record<string, string>,
  ZTIPS = ZTIPS_ as Record<string, string[]>;

export const tt = (t: number) => `${pad(Math.floor(t / 60))}:${pad(Math.round(t % 60))}`;
const page = () => wega.get().page;
function lessonPos(p: WegaPage) {
  const k = key(p.r, p.z, p.l),
    m = dur(ROUTES.indexOf(R(p.r!)), p.z, p.l);
  return { sec: Math.round(m * 60 * (S.prog[k] || 0)), m };
}

/* ---- context ---- */
export function ctxLabel(p: WegaPage): string {
  const s = p.screen;
  if (s === 'map') return 'Academy · Progress';
  if (s === 'route') {
    const r = R(p.r!);
    return `${r.name} · Zone ${pad(p.z! + 1)} ${r.zones[p.z!].name}`;
  }
  if (s === 'lesson') {
    const z = R(p.r!).zones[p.z!];
    return `Lesson ${p.l! + 1} · ${z.lessons[p.l!].t} · ${tt(lessonPos(p).sec)}`;
  }
  const QZ = getQZ();
  if (s === 'quiz' && QZ) {
    const z = R(QZ.r).zones[QZ.z];
    return QZ.stage === 'fail' ? `Quiz ${z.name} · Result` : QZ.i >= 0 && !QZ.stage ? `Quiz ${z.name} · Question ${QZ.i + 1} of 5` : `Quiz ${z.name}`;
  }
  if (s === 'badges') return 'Badges & Certificates';
  if (s === 'fork') return 'Choose a route';
  if (s === 'strategies') return stratCtxLabel(p);
  return 'Web3 Universe';
}
export function chipsFor(p: WegaPage): Chip[] {
  const s = p.screen,
    QZ = getQZ();
  if (s === 'lesson')
    return [
      ['What is this part about?', 'l_moment'],
      ['Summarize the lesson so far', 'l_sum'],
      ['Explain it more simply', 'l_simple'],
      ['Give me a practice question', 'l_quiz'],
    ];
  if (s === 'quiz' && QZ) {
    if (QZ.stage === 'fail')
      return [
        ['Start a practice round with Wega', 'practice'],
        ['What should I review?', 'review'],
      ];
    if (QZ.i >= 0 && !QZ.stage)
      return QZ.locked
        ? [
            ['Why is that?', 'q_explain'],
            ['Explain the key terms', 'q_terms'],
          ]
        : [
            ['Give me a hint, not the answer', 'q_hint'],
            ['Explain the key terms', 'q_terms'],
          ];
    return [
      ['What should I know before the quiz?', 'q_rules'],
      ['Explain the key terms', 'q_terms'],
    ];
  }
  if (s === 'fork')
    return [
      ['Which route fits me?', 'fork'],
      ['Where do I stand?', 'progress'],
    ];
  if (s === 'badges')
    return [
      ['What’s missing for my next badge?', 'nextbadge'],
      ['How do I get a certificate?', 'certhow'],
    ];
  if (s === 'route')
    return [
      ['What is this zone about?', 'zone'],
      ['How long do I have left?', 'time'],
      ['What does this mean for my portfolio?', 'l_port'],
    ];
  if (s === 'strategies') return stratChips(p);
  return [
    ['Where do I stand?', 'progress'],
    ['What should I learn next?', 'next'],
    ['How long do I have left?', 'time'],
  ];
}
export function helloLead(p: WegaPage): string {
  const s = p.screen,
    f = focus();
  if (s === 'lesson') return 'I’m watching along. Ask me about this lesson anytime.';
  if (s === 'quiz') return 'In a quiz I give hints, not answers.';
  if (s === 'strategies') return stratHello(p);
  return f ? `Up next: “${stepTitle(f)}”.` : 'Ask me about your portfolio or your courses.';
}

/* ---- the system prompt for live answers ---- */
export function rulesPrompt(): string {
  const p = page(),
    all = allCount(),
    earned = Object.keys(S.earned).length,
    f = focus(),
    QZ = getQZ();
  let cur = ctxLabel(p);
  if (p.screen === 'lesson') {
    const r = R(p.r!),
      z = r.zones[p.z!],
      s = z.lessons[p.l!],
      pos = lessonPos(p);
    cur = `Lesson “${s.t}”${s.d ? ' (' + s.d + ')' : ''}, zone “${z.name}”, ${r.id === 'academy' ? 'Academy' : 'route ' + r.name}. Video at ${tt(pos.sec)} of ${tt(pos.m * 60)}. Content per the outline: ${(LSUM[s.t] || []).join(' ')}`;
  }
  if (p.screen === 'quiz' && QZ && QZ.i >= 0 && !QZ.stage) {
    const q = quizQs(QZ)[QZ.i];
    cur =
      `Quiz “${R(QZ.r).zones[QZ.z].name}”, question ${QZ.i + 1}: “${q.q}”${q.opts ? ' Options: ' + q.opts.join(' | ') : ''}. ` +
      (QZ.locked
        ? `Already answered${q.opts && QZ.sel != null ? `; the user chose “${q.opts[QZ.sel]}”${QZ.sel === q.a ? ' (correct)' : `, the correct answer is “${q.opts[q.a]}”`}` : ''}. Correct answer: ${rightText(q)}. Explanation from the course: ` + q.why
        : 'The question is still open: do NOT reveal the correct answer, give a hint at most.');
  }
  if (p.screen === 'strategies') cur = stratRules(p);
  return `You are Wega, the AI copilot of the learning platform Web3 Universe (DeFi education). You go with the user across every page: portfolio, strategies, courses, lessons, quizzes.
Rules:
- Answer in English, addressing the user as "you", short and concrete: 120 words at most unless the user asks for more.
- Calculate with the data below. Don't invent other positions, prices or rates.
- Not financial advice: never recommend buying or selling. Show options, math and risks; the user decides.
- If a lesson on the platform fits, name it.
- In a quiz, never reveal the answer to an open question.
- Format: short paragraphs, lists with "- ", **bold** sparingly. No headings, no tables.

User: Daniel. Progress: ${all.d} of ${all.t} lessons, ${earned} of 9 badges. Next step: ${f ? stepTitle(f) + ' (' + stepCrumb(f) + ')' : 'nothing open'}.
Portfolio (sample data, as of today): net worth $17,260 (+4.8% in 30 days). ETH price $3,200. Wallet on Arbitrum: 1.1 ETH, 5,900 USDC (idle), 1,500 ARB at $0.64. Aave v3: 2 ETH collateral, 3,720 USDC debt, liquidation threshold 82.5%, Health Factor 1.42, liquidation at ETH $2,255 (−29.5%); repaying 1,500 USDC raises the Health Factor to 2.38. Uniswap V3 LP ETH/USDC: $4,200, range $2,900–$3,400, $38 in fees over 30 days. Earnings over 30 days: $61. About 70% of net worth depends on the ETH price. 4 unlimited approvals: Uniswap, 1inch and Aave (verified), 0x7a3f…c91e (unverified, unused for 214 days). USDC lending rate on Aave about 4.1%. Active alerts: ${WATCH.filter((w) => w.on)
    .map((w) => w.t)
    .join(', ')}.
Current page: ${cur}`;
}

/* ---- keyword router for free text without a live model ---- */
export function routeText(t: string): Answer {
  const s = t.toLowerCase(),
    p = page(),
    inL = p.screen === 'lesson',
    inQ = p.screen === 'quiz';
  const has = (re: RegExp) => re.test(s);
  if (p.screen === 'strategies') {
    const a = stratRoute(s, p);
    if (a) return a;
  }
  let i: string | null = null;
  if (has(/health|\bhf\b|liquidat|loan|aave|debt|borrow/)) i = 'hf';
  else if (has(/approval|allowance|revoke|contract/)) i = 'approvals';
  else if (has(/usdc|idle|stable|interest|yield|apy|lend/)) i = 'idle';
  else if (has(/alert|alarm|warn|notif|watch/)) i = 'alert';
  else if (has(/what if|crash|drop|fall|dump|scenario|minus|−|-\s?\d+ ?%/)) i = 'whatif';
  else if (has(/concentrat|diversif|exposure|too much eth|share|allocation/)) i = 'conc';
  else if (has(/badge|certificate/)) i = 'nextbadge';
  else if (has(/how long|time left|duration|finish/)) i = 'time';
  else if (inQ && has(/hint|tip|help/)) i = 'q_hint';
  else if ((inL || inQ) && has(/term|mean|what is|what's|explain|define/)) i = inQ ? 'q_terms' : 'l_terms';
  else if (inL && has(/summar|about|so far|recap/)) i = 'l_sum';
  else if (has(/week|briefing|happened|overview|new/)) i = 'briefing';
  else if (has(/learn|next|continue|route|zone|lesson|course/)) i = 'next';
  if (i === 'whatif') {
    const m = s.match(/(\d+(?:[.,]\d+)?)\s?%/);
    if (m) {
      const up = /rise|rises|up|pump|\+|gain|grow/.test(s) && !/drop|fall|minus|−|crash|dump|down/.test(s);
      return answer(i, { chg: Math.max(-0.9, Math.min(1, ((up ? 1 : -1) * parseFloat(m[1].replace(',', '.'))) / 100)) });
    }
  }
  if (i) return answer(i);
  return { text: 'I don’t have a sample answer for that in the prototype. In the product, Wega answers free questions with your real data. Try one of these:', follow: chipsFor(p) };
}

/* ---- small interactive pieces inside answers ---- */
const Acts = ({ children }: { children: ReactNode }) => <div className="wg-acts">{children}</div>;
export function Spark() {
  return <Svg src={GOOSE} />;
}
export function GoBtn({ href, children, cls = 'btn ghost sm' }: { href: string; children: ReactNode; cls?: string }) {
  const router = useRouter();
  return (
    <button className={cls} onClick={() => router.push(href)}>
      {children}
    </button>
  );
}
/** The prototype's stepBtn(): continue with a lesson or start a quiz, with the same lock checks. */
export function StepBtn({ f, label, cls = 'btn primary sm' }: { f: Step; label?: string; cls?: string }) {
  const router = useRouter();
  const go = () => {
    if (f.quiz) {
      if (!quizOpen(f.r, f.z) && !S.passed.has(f.r + '.' + f.z)) return toast('Finish all lessons in this zone first.');
      /* a fresh quiz first: from the fail screen the URL doesn't change, so the page wouldn't restart it */
      startQuizState(f.r, f.z);
      return router.push(hrefQuiz(f.r, f.z));
    }
    if (!lessonOpen(f.r, f.z, f.l!)) return toast('This lesson is still locked.');
    router.push(hrefLesson(f.r, f.z, f.l!));
  };
  return (
    <button className={cls} onClick={go}>
      {label || (f.quiz ? 'Start quiz' : 'Continue learning')}
    </button>
  );
}
export const SoonBtn = ({ w, children }: { w: string; children: ReactNode }) => (
  <button className="btn ghost sm" onClick={() => toast(`${w} is coming soon.`)}>
    {children}
  </button>
);
function AlertBtn({ id, cls = 'btn ghost sm', children }: { id: string; cls?: string; children: ReactNode }) {
  const [on, setOn] = useState(false);
  const click = () => {
    const s = ALERT_SUGG.find((x) => x.id === id);
    if (s && !WATCH.some((w) => w.id === s.id)) WATCH.push({ ...s, on: true });
    if (cls.includes('primary')) setOn(true);
    toast(`Alert on: ${s ? s.t : 'Alert'}`);
  };
  if (on) return <span className="chip sm good">Active</span>;
  return (
    <button className={cls} onClick={click}>
      {children}
    </button>
  );
}
function SimBtn({ repay, chg, children }: { repay?: boolean; chg?: number; children: ReactNode }) {
  return (
    <button
      className="btn ghost sm"
      onClick={() => {
        const H = hsim.get();
        if (repay) H.repay = true;
        if (chg != null) H.chg = chg;
        hsim.commit();
        wgRun('sim', repay ? 'What if I repay 1,500 USDC?' : 'Show me other ETH prices');
      }}
    >
      {children}
    </button>
  );
}
function SeekBtn({ p, children }: { p: number; children: ReactNode }) {
  return (
    <button
      className="btn ghost sm"
      onClick={() => {
        if (!seekLesson(p)) return toast('Open the lesson to jump to this part.');
        if (window.innerWidth < 1280 && wega.get().open) wgClose();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    >
      {children}
    </button>
  );
}
function ChooseBtn({ r }: { r: string }) {
  const router = useRouter();
  return (
    <button
      className="btn primary sm"
      onClick={() => {
        chooseRoute(r);
        toast(R(r).name + ' started');
        router.push(hrefRoute(r, 0));
      }}
    >
      Start {R(r).name}
    </button>
  );
}
/** A practice question inside the chat (prototype qCard + wgAnswerQ). */
function QCard({ q, prac }: { q: any; prac?: boolean }) {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="wg-q">
      <b>{q.q}</b>
      {q.t === 'flow' && <small>{q.steps.map((s: string) => s || '?').join(' → ')}</small>}
      {q.opts.map((o: string, k: number) => (
        <button
          key={k}
          className={`wg-opt${sel != null && k === q.a ? ' right' : ''}${sel === k && k !== q.a ? ' wrong' : ''}`}
          disabled={sel != null}
          onClick={() => {
            setSel(k);
            wgRun('q_ans', o, { q, k, prac });
          }}
        >
          <span>{'ABCD'[k]}</span>
          {o}
        </button>
      ))}
    </div>
  );
}
function HfCard({ debt = PF.debt }: { debt?: number }) {
  const h = hfAt(PF.eth, debt),
    pos = (v: number) => Math.max(0, Math.min(100, ((v - 1) / 2) * 100));
  return (
    <div className="wg-card">
      <span className="k">Health Factor today</span>
      <div className="wg-big" style={{ color: `var(--${h < 1 ? 'bad' : h < 1.75 ? 'gold' : 'good'})` }}>
        {num(h, 2)}
      </div>
      <div className="wg-gauge">
        <i style={{ left: pos(h) + '%' }} />
        {debt === PF.debt && <i className="ghost" style={{ left: pos(hfAt(PF.eth, PF.debt - 1500)) + '%' }} title="After repaying 1,500 USDC" />}
      </div>
      <div className="wg-scale">
        <span>1.0</span>
        <span>2.0</span>
        <span>3.0</span>
      </div>
      <div className="wg-rows">
        {[-0.1, -0.2, -0.3].map((c) => {
          const pr = PF.eth * (1 + c),
            v = hfAt(pr, debt);
          return (
            <div className="wg-row" key={c}>
              <span>
                ETH {pctS(c * 100)} · {usd(pr)}
              </span>
              <b className={hfCls(v)}>
                {num(v, 2)}
                {v < 1 ? ' · Liquidation' : ''}
              </b>
            </div>
          );
        })}
        <div className="wg-row">
          <span>Liquidation at ETH</span>
          <b className="no">{usd(liqAt(debt))}</b>
        </div>
      </div>
    </div>
  );
}
const Row = ({ k, v }: { k: ReactNode; v: ReactNode }) => (
  <div className="wg-row">
    <span>{k}</span>
    <b>{v}</b>
  </div>
);
const Why = ({ children }: { children: ReactNode }) => (
  <p className="wg-why">
    <Spark />
    <span>{children}</span>
  </p>
);

/* ---- scripted intents ---- */
function curQ() {
  const QZ = getQZ();
  return QZ && QZ.i >= 0 ? quizQs(QZ)[QZ.i] : null;
}
export function answer(i: string, x?: any): Answer {
  const p = page(),
    f = focus(),
    all = allCount(),
    earned = Object.keys(S.earned).length,
    QZ = getQZ(),
    W = wega.get();
  const sa = stratAnswer(i, x, p);
  if (sa) return sa;
  switch (i) {
    case 'briefing':
      return {
        text: `Your week in four points:
- Your net worth is **$17,260**, +4.8% in 30 days, mostly from ETH.
- Your LP (ETH/USDC, range $2,900–$3,400) was in range 6 of 7 days and earned **$9** in fees.
- Your Health Factor on Aave is **1.42**. If ETH drops 29.5% to $2,255, you get liquidated.
- **5,900 USDC** sit idle in your wallet.${f ? `\n\nIn your learning you’re at “${stepTitle(f)}”.` : ''}`,
        follow: [
          ['How safe is my Aave loan?', 'hf'],
          ['What should I do with my idle USDC?', 'idle'],
        ],
      };
    case 'hf':
      return {
        text: `Your Health Factor is **1.42**. Here’s how Aave calculates it: collateral times the liquidation threshold, divided by the debt.
- 2 ETH × $3,200 × 0.825 = $5,280
- $5,280 / $3,720 debt = 1.42

Below 1 you get liquidated. That happens at an ETH price of **$2,255**, 29.5% below today. If you repaid 1,500 USDC, the Health Factor would rise to **2.38** (light marker).`,
        node: (
          <>
            <HfCard />
            <Acts>
              <SimBtn repay>Simulate a repayment</SimBtn>
              <AlertBtn id="hf2">Alert at 1.20</AlertBtn>
              <GoBtn href={hrefRoute('r1', 2)}>Zone “Lending &amp; Collateral”</GoBtn>
            </Acts>
          </>
        ),
        follow: [['What happens if ETH drops 30%?', 'whatif']],
      };
    case 'idle':
      return {
        text: 'Two options, calculated with your numbers. Not financial advice, just the math:',
        node: (
          <>
            <div className="wg-card">
              <span className="k">A · Repay part of the loan</span>
              <div className="wg-rows">
                <Row
                  k="1,500 USDC to Aave"
                  v={
                    <>
                      HF 1.42 → <span style={{ color: 'var(--good)' }}>2.38</span>
                    </>
                  }
                />
                <Row k="Interest saved (~5%)" v="≈ $75 / year" />
                <Row k="Liquidation at ETH" v={usd(liqAt(PF.debt - 1500))} />
              </div>
            </div>
            <div className="wg-card">
              <span className="k">B · Lend the USDC on Aave</span>
              <div className="wg-rows">
                <Row k="5,900 USDC at ~4.1%" v="≈ $242 / year" />
                <Row k="Health Factor" v="rises a little, it counts as collateral" />
                <Row k="Risk" v="smart contract, variable rate" />
              </div>
            </div>
            <Why>Your Health Factor is tight. A lowers the liquidation risk, B earns more. You can also mix both.</Why>
          </>
        ),
        follow: [
          ['How safe is my Aave loan?', 'hf'],
          ['What happens if ETH drops 30%?', 'whatif'],
        ],
      };
    case 'approvals':
      return {
        text: 'You have **4 unlimited approvals**. Three go to well-known, verified contracts. I’d look at the fourth: unverified and unused for 214 days.',
        node: (
          <>
            <div className="wg-card">
              <div className="wg-rows">
                {APPR.map((a) => (
                  <div className="wg-row" key={a[0] as string}>
                    <span>
                      <b style={{ display: 'block', color: '#fff', textAlign: 'left' }}>{a[0]}</b>
                      {a[1]}
                    </span>
                    {a[2] ? (
                      <span className="chip sm good">OK</span>
                    ) : (
                      <button className="btn sm bad" onClick={() => toast('In the product, Wega opens the revoke transaction here. You sign it yourself.')}>
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Acts>
              <GoBtn href={hrefLesson('r1', 0, 3)}>Lesson “Approvals”</GoBtn>
            </Acts>
          </>
        ),
        follow: [['Ask me a question about approvals', 'prac_appr']],
      };
    case 'conc':
      return {
        text: 'About **70%** of your net worth depends on the ETH price: the ETH in your wallet, the collateral on Aave and half of the LP. On top of that, the loan amplifies any drop in ETH.',
        node: (
          <div className="wg-card">
            <span className="k">Exposure to price</span>
            <div className="wg-split">
              <span style={{ width: '70%', background: '#9ED3FF' }} />
              <span style={{ width: '25%', background: '#9EFFA2' }} />
              <span style={{ width: '5%', background: '#E2B65E' }} />
            </div>
            <div className="wg-legend">
              <span>
                <i style={{ background: '#9ED3FF' }} />
                ETH 70%
              </span>
              <span>
                <i style={{ background: '#9EFFA2' }} />
                Stablecoins, net 25%
              </span>
              <span>
                <i style={{ background: '#E2B65E' }} />
                ARB 5%
              </span>
            </div>
          </div>
        ),
        follow: [['What happens if ETH drops 30%?', 'whatif']],
      };
    case 'whatif': {
      const c = x && x.chg != null ? x.chg : -0.3,
        pr = PF.eth * (1 + c),
        h = hfAt(pr),
        n = netAt(pr);
      return {
        text: `With ETH at **${pctS(c * 100)}** (${usd(pr)}):
- Health Factor: **${num(h, 2)}**${h < 1 ? ', your Aave loan would be liquidated' : ''}
- Net worth: **${usd(n)}** (${pctS((n / 17260 - 1) * 100)}), before any liquidation penalty
- LP: ${pr >= PF.lpLo && pr <= PF.lpHi ? 'in range, still earning fees' : 'out of range, no longer earning fees'}

After repaying 1,500 USDC, the Health Factor here would be **${num(hfAt(pr, PF.debt - 1500), 2)}**.`,
        node: (
          <Acts>
            <SimBtn chg={c}>Try other prices</SimBtn>
            <AlertBtn id="eth">Alert at ETH $2,800</AlertBtn>
          </Acts>
        ),
      };
    }
    case 'alert':
      return {
        text: 'These are the alerts I’d suggest. Wega checks them around the clock and lets you know by push or email:',
        node: (
          <div className="wg-card">
            <div className="wg-rows">
              {ALERT_SUGG.map((a) => (
                <div className="wg-row" key={a.id}>
                  <span>
                    <b style={{ display: 'block', color: '#fff', textAlign: 'left' }}>{a.t}</b>
                    {a.s}
                  </span>
                  {WATCH.some((w) => w.id === a.id) ? (
                    <span className="chip sm good">Active</span>
                  ) : (
                    <AlertBtn id={a.id} cls="btn sm primary">
                      Add
                    </AlertBtn>
                  )}
                </div>
              ))}
            </div>
          </div>
        ),
        follow: [['How safe is my Aave loan?', 'hf']],
      };
    case 'progress': {
      const rows = ROUTES.filter((r: any) => r.id === 'academy' || routeCount(r.id).d > 0 || r.id === S.chosen);
      return {
        text: `You’ve completed **${all.d} of ${all.t} lessons** and earned **${earned} of 9 badges**.${f ? ` Up next: **${stepTitle(f)}** (${stepCrumb(f)}).` : ''}`,
        node: (
          <>
            <div className="wg-card">
              <div className="wg-rows">
                {rows.map((r: any) => {
                  const c = routeCount(r.id);
                  return <Row key={r.id} k={r.id === 'academy' ? 'Academy' : r.name} v={`${c.d}/${c.t} · ${pct(c.d, c.t)}%`} />;
                })}
              </div>
            </div>
            {f && (
              <Acts>
                <StepBtn f={f} />
              </Acts>
            )}
          </>
        ),
        follow: [['How long do I have left?', 'time']],
      };
    }
    case 'next':
      if (!f)
        return {
          text: 'Nothing is open right now. Look at the routes and pick the next one.',
          node: (
            <Acts>
              <GoBtn href={hrefMap()}>Go to the Academy</GoBtn>
            </Acts>
          ),
        };
      return {
        text: `Up next: **${stepTitle(f)}** (${stepCrumb(f)}). ${whyNext(f)}`,
        node: (
          <Acts>
            <StepBtn f={f} />
          </Acts>
        ),
      };
    case 'time': {
      const rid = p.screen === 'route' ? p.r! : f ? f.r : 'r1',
        r = R(rid),
        ri = ROUTES.indexOf(r);
      let m = 0,
        q = 0;
      r.zones.forEach((z: any, zi: number) => {
        z.lessons.forEach((_: any, li: number) => {
          if (!isDone(rid, zi, li)) m += dur(ri, zi, li);
        });
        if (!S.passed.has(rid + '.' + zi)) q++;
      });
      const tot = m + q * 4;
      return {
        text: `For **${rid === 'academy' ? 'the Academy' : r.name}** you have about **${fmtMin(tot)}** left: ${fmtMin(m)} of video and ${q} ${q === 1 ? 'quiz' : 'quizzes'}. At 20 minutes a day you’ll be done in about **${Math.max(1, Math.ceil(tot / 20))} days**.`,
        node: (
          <Acts>
            <SoonBtn w="Study plans in your calendar">Add a study plan to my calendar</SoonBtn>
          </Acts>
        ),
      };
    }
    case 'zone': {
      const r = R(p.r!),
        z = r.zones[p.z!],
        ri = ROUTES.indexOf(r),
        left = z.lessons.filter((_: any, l: number) => !isDone(p.r!, p.z!, l)).length;
      return {
        text: `**${z.name}** has ${z.lessons.length} lessons, about ${fmtMin(z.lessons.reduce((a: number, _: any, l: number) => a + dur(ri, p.z, l), 0))} in total. ${left ? `${left} ${left === 1 ? 'is' : 'are'} still open.` : 'All of them are done.'} A 5-question quiz waits at the end; 4 correct answers earn the badge.

The key terms: ${glossFor(p.r, p.z)
          .map((g: string[]) => g[0])
          .join(', ')}.`,
        follow: [['What does this mean for my portfolio?', 'l_port']],
      };
    }
    case 'l_sum': {
      if (p.screen !== 'lesson') return answer('progress');
      const r = R(p.r!),
        z = r.zones[p.z!],
        s = z.lessons[p.l!],
        pos = lessonPos(p),
        pts = LSUM[s.t] || [
          `This lesson belongs to the zone “${z.name}”${r.id === 'academy' ? '' : ` of the route ${r.name}`}.`,
          s.d ? `Content per the outline: ${s.d}.` : 'The content team provides the details.',
        ];
      return {
        text: `${pos.sec > 0 ? `Up to **${tt(pos.sec)}** it covered:` : 'You haven’t started yet. Here’s what it covers:'}
${pts.map((x: string) => '- ' + x).join('\n')}`,
        follow: [
          ['Explain the key terms', 'l_terms'],
          ['Give me a practice question', 'l_quiz'],
        ],
      };
    }
    case 'l_terms':
    case 'q_terms': {
      const r = i === 'q_terms' && QZ ? QZ.r : p.r || 'r1',
        z = i === 'q_terms' && QZ ? QZ.z : (p.z ?? 1);
      return {
        text: glossFor(r, z)
          .map((g: string[]) => `- **${g[0]}**: ${g[1]}`)
          .join('\n'),
        follow: i === 'q_terms' ? [] : [['What does this mean for my portfolio?', 'l_port']],
      };
    }
    case 'l_moment': {
      if (p.screen !== 'lesson') return answer('next');
      const ch = chaptersFor(p.r, p.z, p.l),
        pr = S.prog[key(p.r, p.z, p.l)] || 0,
        c = ch[chIdx(ch, pr)],
        pos = lessonPos(p);
      return {
        text: `${pr > 0 ? `At **${tt(pos.sec)}** the lesson is in the part “**${c.t}**”.` : `The lesson starts with “**${c.t}**”.`} The point here: ${c.n}

${c.t === 'Watch out' ? 'This is the mistake most people make, so it’s worth a second look.' : 'Want it explained differently, or should I rewind a little?'}`,
        node: (
          <Acts>
            <SeekBtn p={c.a}>Rewatch from {tt(c.sec)}</SeekBtn>
          </Acts>
        ),
        follow: [
          ['Explain it more simply', 'l_simple'],
          ['Explain it with an example', 'l_example'],
        ],
      };
    }
    case 'l_simple':
      return {
        text: `Here’s the simple version: ${ANALOGY[zkey(p.r || 'r1', p.z ?? 1)]}`,
        follow: [
          ['Explain it with an example', 'l_example'],
          ['Explain it with my numbers', 'l_port'],
        ],
      };
    case 'l_example': {
      const t = ZTIPS[zkey(p.r || 'r1', p.z ?? 1)];
      return {
        text: `An example from this zone: ${t[0]}

The classic mistake: ${t[1]}`,
        follow: [
          ['Explain it with my numbers', 'l_port'],
          ['Give me a practice question', 'l_quiz'],
        ],
      };
    }
    case 'sim':
      return {
        text: 'Here’s the simulator with your numbers. Drag the ETH price and see what happens to your loan:',
        node: (
          <div className="wg-card">
            <SimBlock />
          </div>
        ),
        follow: [['Which alerts should I set up?', 'alert']],
      };
    case 'l_port': {
      const r = p.r || 'r1',
        z = p.z ?? 2;
      return {
        text: portFor(r, z),
        follow: r === 'r1' && z === 0 ? [['Which approvals are risky?', 'approvals']] : [['How safe is my Aave loan?', 'hf']],
      };
    }
    case 'l_quiz':
    case 'prac_appr': {
      const pool = (i === 'prac_appr' ? Q['r1.0'] : (p.r && Q[p.r + '.' + p.z]) || Q['academy.0']).filter((q: any) => q.t === 'choice'),
        q = pool[W.lq++ % pool.length];
      return { text: 'Here’s a practice question. It doesn’t count toward the quiz.', node: <QCard q={q} />, follow: [] };
    }
    case 'q_ans': {
      const { q, k, prac } = x,
        ok = k === q.a,
        P = W.prac;
      return {
        text: `${ok ? 'Correct.' : `Not quite. The correct answer is **“${q.opts[q.a]}”**.`} ${q.why}`,
        follow: prac ? [[P && P.i < P.list.length - 1 ? 'Next practice question' : 'Finish the practice round', 'prac_next']] : [['Another question', 'l_quiz']],
      };
    }
    case 'practice': {
      if (!QZ) return answer('q_rules');
      const qs = Q[QZ.r + '.' + QZ.z],
        wrong = qs.filter((q: any, k: number) => q.t === 'choice' && !QZ.answers[k]?.ok),
        list = wrong.length ? wrong : qs.filter((q: any) => q.t === 'choice');
      W.prac = { list, i: 0 };
      return {
        text: `Let’s practice the ${wrong.length ? 'questions that didn’t stick' : 'questions from this zone'}, with no lives and no time pressure. Question 1 of ${list.length}:`,
        node: <QCard q={list[0]} prac />,
      };
    }
    case 'prac_next': {
      const P = W.prac;
      if (!P || P.i >= P.list.length - 1) {
        W.prac = null;
        return {
          text: 'That’s the practice round. When you’re ready, start the quiz again.',
          node: QZ ? (
            <Acts>
              <StepBtn f={{ r: QZ.r, z: QZ.z, quiz: true }} label="Retake the quiz" />
            </Acts>
          ) : undefined,
        };
      }
      P.i++;
      return { text: `Question ${P.i + 1} of ${P.list.length}:`, node: <QCard q={P.list[P.i]} prac /> };
    }
    case 'review': {
      if (!QZ) return answer('progress');
      const qs = Q[QZ.r + '.' + QZ.z],
        z = R(QZ.r).zones[QZ.z],
        bad = qs.filter((_: any, k: number) => !QZ.answers[k]?.ok);
      return {
        text: `In “${z.name}” these didn’t stick yet:
${bad.map((q: any) => '- ' + q.q).join('\n')}

Rewatch the lessons of this zone, or practice with me right away.`,
        node: (
          <Acts>
            <GoBtn href={hrefRoute(QZ.r, QZ.z)}>View lessons</GoBtn>
          </Acts>
        ),
        follow: [['Start a practice round with Wega', 'practice']],
      };
    }
    case 'q_rules':
      return { text: '5 questions, 3 lives, 4 correct answers to pass. Skipping counts as wrong. During a question I give you hints, not the answer. After you answer, I’m happy to explain why it’s right or wrong.' };
    case 'q_hint': {
      const q = curQ();
      if (!q || !QZ) return answer('q_rules');
      if (QZ.locked) return answer('q_explain');
      if (q.t === 'choice' || q.t === 'flow') {
        const w = q.opts.findIndex((_: any, k: number) => k !== q.a && k !== QZ.sel);
        return { text: `You can rule out one answer: **“${q.opts[w]}”**. ${q.t === 'flow' ? 'Think about what has to happen before money can leave the exchange.' : 'Read the question again carefully: which risk is it about?'}` };
      }
      if (q.t === 'chart') return { text: 'Look only at the dashed line, that’s the current price. Only a range that contains that line earns fees.' };
      if (q.t === 'order') return { text: `The first step is **“${q.items[0]}”**. Then ask yourself: what has to happen before a contract may move your tokens?` };
      if (q.t === 'match') return { text: `Start with the one you’re surest of. **${q.pairs[0][0]}** goes with “${q.pairs[0][1]}”. A wrong pair just shakes, it doesn’t cost a life.` };
      if (q.t === 'fill') return { text: `The first gap is **“${q.a[0]}”**. Read the whole sentence out loud with it and the second word follows.` };
      if (q.t === 'scam') return { text: 'Ask two things: does it want your seed phrase, a key or unlimited access? And did you start this yourself? If it asks for secrets or came out of nowhere, be suspicious.' };
      if (q.t === 'predict')
        return { text: 'Leverage multiplies the move: 5x leverage turns a 10% move into 50% of your deposit. A long wins when the price rises, a short when it falls. If the loss reaches your whole deposit, you’re liquidated.' };
      return { text: 'Look at the low in the chart. Your liquidation has to sit below it, and the closing price has to be inside your range. Less leverage pushes the liquidation down.' };
    }
    case 'q_explain': {
      const q = curQ();
      if (!q || !QZ) return answer('q_rules');
      if (!QZ.locked) return answer('q_hint');
      let right = '';
      if (q.t === 'choice' || q.t === 'flow' || q.t === 'predict' || q.t === 'scam')
        right = `The correct answer is **“${q.opts[q.a]}”**.${QZ.sel != null && QZ.sel !== q.a ? ` You chose “${q.opts[QZ.sel]}”.` : ''}`;
      else if (q.t === 'fill') right = `The sentence reads: **${rightText(q)}**`;
      else if (q.t === 'match') right = 'The pairs:\n' + q.pairs.map((p: string[]) => `- **${p[0]}**: ${p[1]}`).join('\n');
      else if (q.t === 'chart') right = `The correct answer is **position ${'ABCD'[q.a]}**.`;
      else if (q.t === 'order') right = 'The correct order:\n' + q.items.map((t: string, k: number) => `${k + 1}. ${t}`).join('\n');
      else right = `With at most 5x leverage and a range of at least ±${Math.ceil((Math.abs(SIM.at(-1)! - SIM[0]) / SIM[0]) * 100)}%, the position survives the 7 days.`;
      const hay = (q.q + ' ' + (q.opts || q.items || q.bank || (q.pairs || []).flat()).join(' ') + ' ' + q.why).toLowerCase(),
        terms = glossFor(QZ.r, QZ.z).filter((g: string[]) => hay.includes(g[0].toLowerCase().split(' ')[0]));
      return {
        text: `${right}\n\n${q.why}${terms.length ? '\n\nWorth remembering:\n' + terms.map((g: string[]) => `- **${g[0]}**: ${g[1]}`).join('\n') : ''}`,
        node: (
          <Acts>
            <GoBtn href={hrefRoute(QZ.r, QZ.z)}>Lessons in this zone</GoBtn>
          </Acts>
        ),
        follow: [['Explain the key terms', 'q_terms']],
      };
    }
    case 'fork':
      return {
        text: `I’d start with **DeFi Fundamentals**. You have an Aave loan with a Health Factor of 1.42 and 4 unlimited approvals open. Route 1 covers exactly that: approvals in zone 1, liquidation in zone 3.

DeFi Strategies builds on it, and PerpPilot automates both at the end. All three stay open; you can switch anytime.`,
        node: (
          <Acts>
            <ChooseBtn r="r1" />
          </Acts>
        ),
      };
    case 'nextbadge': {
      let best: any = null;
      for (const c of CAT as any[])
        for (const it of c.levels) {
          const s = bState(it);
          if (s.state === 'progress' && (!best || s.total - s.done < best.s.total - best.s.done)) best = { it, s, c };
        }
      if (!best) return { text: 'No badge is in progress right now. Start a zone and I’ll show you what’s missing.' };
      const n = nextStep(best.it.rid);
      return {
        text: `You’re closest to **${best.it.title}** (${best.c.name}): ${best.s.done} of ${best.s.total} lessons done, ${best.s.hint.toLowerCase()}. Then the quiz: 4 of 5 correct and the badge is yours.`,
        node: n ? (
          <Acts>
            <StepBtn f={n} />
          </Acts>
        ) : undefined,
      };
    }
    case 'certhow': {
      const rid = S.chosen || 'r1',
        r = R(rid),
        left = r.zones.filter((_: any, zi: number) => !S.passed.has(rid + '.' + zi)).map((z: any) => z.name);
      return {
        text: `You get a certificate when every zone of a route is passed, together with the gold completion coin. ${left.length ? `In **${r.name}** you still need: ${left.join(', ')}.` : `You’ve completed **${r.name}**; your certificate is issued.`}`,
      };
    }
  }
  return { text: 'I don’t have anything on that right now.' };
}
