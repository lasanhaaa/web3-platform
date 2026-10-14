'use client';
/* Route choice after the required start (prototype vFork). */
import { R, gen } from '@/lib/curriculum';
import { I, SPARK } from '@/lib/icons';
import { Svg } from '@/lib/svg';
import { useProgress, routeCount } from '@/lib/progress';
import { ZTile } from '@/components/ui/bits';
import { useAcademyActs, img, Orb } from './parts';

export function ChooseRoute() {
  useProgress();
  const a = useAcademyActs();
  return (
    <div className="page">
      <button className="back" onClick={a.map}>
        <i>
          <Svg src={I.left} />
        </i>
        Academy
      </button>
      <div className="fade" style={{ marginTop: 28 }}>
        <p className="mono lt-eyebrow" style={{ color: 'var(--good)' }}>
          Required start complete
        </p>
        <h1 className="lt">Choose your route</h1>
        <p className="lt-sub">All three are open. Start with one; the others stay available anytime.</p>
      </div>
      <section className="card wg-rec fade">
        <Orb />
        <div>
          <span className="mono" style={{ color: 'rgba(255,255,255,.4)' }}>
            Wega recommends
          </span>
          <h3>DeFi Fundamentals first</h3>
          <p>You have an Aave loan at Health Factor 1.42 and 4 unlimited approvals open. Route 1 covers exactly that: approvals in zone 1, liquidation in zone 3.</p>
          <div className="wg-acts">
            <button className="btn primary sm" onClick={() => a.choose('r1')}>
              Start DeFi Fundamentals
            </button>
            <button className="btn ghost sm" onClick={() => a.wgask('fork', 'Which route is right for me?')}>
              Why?
            </button>
          </div>
        </div>
      </section>
      <div className="choices">
        {['r1', 'r2', 'r3'].map((id) => {
          const r = R(id),
            c = routeCount(id);
          return (
            <div key={id} className="card rcard">
              <div className="pic">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(r.img)} alt="" />
                {id === 'r1' && (
                  <span className="chip sm acc rec">
                    <Svg src={SPARK} />
                    Wega recommends
                  </span>
                )}
              </div>
              <div className="rcard-body">
                <span className="mono quiet">
                  {r.label} · Based on {gen(r.by)} call outline
                </span>
                <h3>{r.name}</h3>
                <p>{r.tagline}</p>
                <div className="zl">
                  {r.zones.map((z: any, zi: number) => (
                    <div key={zi}>
                      <ZTile n={zi + 1} s={24} />
                      {z.name}
                      <span className="n tnum">{z.lessons.length}</span>
                    </div>
                  ))}
                </div>
                <span className="meta tnum">
                  {c.t} lessons · {r.zones.length} badges · 1 certificate
                </span>
                <div className="foot">
                  <button className="btn primary" style={{ width: '100%' }} onClick={() => a.choose(id)}>
                    Start {r.name}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
