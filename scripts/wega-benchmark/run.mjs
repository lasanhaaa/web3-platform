/* Wega benchmark: asks Wega's real questions under several setups and measures cost, tokens, speed and rule-keeping.
   Usage:  WEGA_API_KEY=sk-ant-... node run.mjs [--dry-run] [--cap 4.25] [--phases single,chats,shared,deep,repeat,judge]
                                               [--setups sonnet-low,haiku-low] [--only case1,case2] [--concurrency 4]
                                               [--resume results/<timestamp>]
   Writes results/<timestamp>/: rows.jsonl (every call, as it happens), results.csv, summary.md, summary.json,
   answers.md, judge.json. --resume continues a stopped run without paying again for what it already has. */
import Anthropic from '@anthropic-ai/sdk';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { RULES, PLATFORM, MEMBERS, PAGES, TOOLS, TOOL_RESULT, GUIDE, changes } from './prompt.mjs';
import { SINGLE, CHATS, SHARED } from './cases.mjs';

// USD per million tokens, Anthropic list prices (October 2026). A 5-minute cache write costs 1.25x input.
const PRICE = {
  'claude-haiku-5-5': { in: 0.1, out: 0.5, read: 0.01 },
  'claude-sonnet-5-5': { in: 2, out: 10, read: 0.2 },
  'claude-opus-5-5': { in: 4, out: 20, read: 0.2 },
};
const HAIKU = 'claude-haiku-5-5',
  SONNET = 'claude-sonnet-5-5',
  OPUS = 'claude-opus-5-5';

const SETUPS = {
  // The prototype's /api/wega as it is: Sonnet at its default effort (high), 700 tokens, no caching, no templates,
  // everything in one system prompt, chat history cut to the last 10 messages.
  today: { model: SONNET, max_tokens: 700, today: true },
  'haiku-low': { model: HAIKU, effort: 'low' },
  'haiku-medium': { model: HAIKU, effort: 'medium' },
  'sonnet-low': { model: SONNET, effort: 'low' },
  'sonnet-medium': { model: SONNET, effort: 'medium' },
  'opus-low': { model: OPUS, effort: 'low' },
  // Chats only: the same, without caching the conversation so far.
  'sonnet-low-nohistorycache': { model: SONNET, effort: 'low', noTail: true },
  // Template questions only: Wega writes the answer first and calls the template last, so the app can stop after one
  // request instead of sending "shown" back for a second one.
  'sonnet-low-oneround': { model: SONNET, effort: 'low', oneRound: true },
};
const ONE_ROUND_RULE = '\n- When you use a template, write your whole answer first and call the template at the very end. Nothing comes after it.';
const SINGLE_SETUPS = ['sonnet-low', 'haiku-low', 'today', 'opus-low', 'sonnet-medium', 'haiku-medium'];
// Every question runs on the cheap setups and today's; Opus and medium effort run on the 17 hardest, to save budget.
const CORE_SETUPS = ['sonnet-low', 'haiku-low', 'haiku-medium', 'today'];
const DEEP_SETUPS = ['opus-low', 'sonnet-medium', 'sonnet-low-oneround'];
const HARD = ['lesson-which', 'explain-mine', 'quiz-tell', 'why-wrong', 'academy-route1', 'strat-size', 'strat-timing', 'strat-deprecated', 'list-deprecated', 'eth-drop', 'vs-model', 'peg', 'mix-nodata', 'guide-failed', 'copy', 'call-variational-de', 'news'];
const CHAT_SETUPS = ['sonnet-low', 'haiku-low', 'today', 'sonnet-low-nohistorycache'];
const SHARED_SETUPS = { 'sonnet-low': null, 'opus-low': ['chips-lesson', 'recap-week'] };
const REPEAT_CASES = ['lesson-what', 'quiz-hint', 'strat-timing', 'eth-drop', 'changed', 'call-blast', 'news', 'guide-start'];
const JUDGE = { model: SONNET, effort: 'low', max_tokens: 4000 };

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf('--' + n);
  return i < 0 ? d : args[i + 1];
};
const dry = args.includes('--dry-run');
const CAP = Number(flag('cap', '4.25'));
const phases = flag('phases', 'single,chats,shared,deep,repeat,judge,judge-oneround').split(',');
const resume = flag('resume');
const only = flag('only')?.split(',');
const pickSetups = flag('setups')?.split(',');
const CONC = Number(flag('concurrency', '4'));
// Main phases stop early enough to leave room for the judge.
const STOP_MAIN = CAP - (phases.includes('judge') ? 0.55 : 0);

const client = new Anthropic({
  // WEGA_API_KEY for cloud sessions, where ANTHROPIC_API_KEY is reserved. The base URL is fixed because
  // Claude Code sessions point ANTHROPIC_BASE_URL at their own proxy.
  apiKey: process.env.WEGA_API_KEY || process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com',
  maxRetries: 4,
});

const cost = (model, u) => {
  const p = PRICE[model];
  return (u.input_tokens * p.in + u.output_tokens * p.out + u.cache_creation_input_tokens * p.in * 1.25 + u.cache_read_input_tokens * p.read) / 1e6;
};
let spent = 0;

/* ---------- building a request ---------- */
const WRITER = `${RULES}\n\nYou are writing content ahead of time. It is reviewed by the team and then shown to every member as it is.`;
const member = (c) => MEMBERS[c.member || 'alex'];
function request(s, c, history) {
  const page = PAGES[c.page];
  if (!page) throw new Error(`Page "${c.page}" has no content (missing data file?)`);
  const base = { model: s.model, max_tokens: s.max_tokens || 2000, ...(s.effort ? { output_config: { effort: s.effort } } : {}) };
  if (s.raw) return { ...base, system: WRITER, messages: history };
  if (s.today) {
    // Prototype layout: one uncached system prompt with the page at the end; text-only history.
    return { ...base, system: `${RULES}\n\n${PLATFORM}\n\n${member(c).text}\n\n${page}`, messages: history.slice(-10) };
  }
  // Templates and rules and platform data first, cached once for every member; then the member; then page and question.
  return {
    ...base,
    tools: TOOLS,
    system: [
      { type: 'text', text: RULES + (s.oneRound ? ONE_ROUND_RULE : '') },
      { type: 'text', text: PLATFORM, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: member(c).text },
    ],
    messages: history,
    // In chats, cache the conversation so far too, so the next turn reads it at a tenth of the price.
    ...(c.chat && !s.noTail ? { cache_control: { type: 'ephemeral' } } : {}),
  };
}

const zero = () => ({ input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 });
async function call(s, c, history) {
  const req = request(s, c, history);
  const total = zero();
  const t0 = performance.now();
  let first = null,
    text = '',
    stop = '',
    rounds = 0;
  const charts = [];
  const msgs = [...req.messages];
  // A template call is answered with "shown" and Wega finishes its answer, as the app would do it.
  while (rounds < 3) {
    rounds++;
    const stream = client.messages.stream({ ...req, messages: msgs });
    stream.on('text', () => {
      if (first == null) first = performance.now() - t0;
    });
    const msg = await stream.finalMessage();
    for (const k of Object.keys(total)) total[k] += msg.usage[k] || 0;
    stop = msg.stop_reason;
    const uses = msg.content.filter((b) => b.type === 'tool_use');
    for (const b of msg.content) if (b.type === 'text') text += (text ? '\n' : '') + b.text;
    for (const b of uses) charts.push({ name: b.name, input: b.input });
    msgs.push({ role: 'assistant', content: msg.content });
    if (stop !== 'tool_use') break;
    if (s.oneRound && text) break;
    msgs.push({ role: 'user', content: uses.map((b) => ({ type: 'tool_result', tool_use_id: b.id, content: TOOL_RESULT })) });
  }
  const usd = cost(s.model, total);
  spent += usd;
  return { usage: total, usd, ms: performance.now() - t0, firstMs: first, text: text.trim(), stop, rounds, charts, msgs };
}

/* ---------- automatic checks ---------- */
const words = (t) => t.replace(/[*_`#>|-]/g, ' ').split(/\s+/).filter(Boolean).length;
const DE = /\b(und|der|die|das|ist|nicht|du|dein|deine|ich|mit|für|eine|einen|auf|wenn|auch|zu|sich|wird|kannst)\b/gi;
const EN = /\b(the|and|is|you|your|to|of|with|for|this|that|it|can|are|if|not|what)\b/gi;
const langOf = (t) => ((t.match(DE) || []).length > (t.match(EN) || []).length ? 'German' : 'English');
function checks(c, r) {
  const limit = /150 words/.test(PAGES[c.page]) ? 150 : 120;
  // A lesson link is always fine ("point to a lesson when one fits"), so it only counts where it is the template asked for.
  const picked = r.charts.map((x) => x.name).filter((n) => n !== 'link_lesson' || c.tpl?.includes('link_lesson'));
  let tpl = 'not scored';
  if (c.tpl && !c.tpl.length) tpl = picked.length ? 'extra' : 'right';
  else if (c.tpl) tpl = picked.some((p) => c.tpl.includes(p)) ? 'right' : picked.length ? 'wrong' : 'missed';
  return {
    words: words(r.text),
    limit,
    overLimit: words(r.text) > limit,
    cut: r.stop === 'max_tokens',
    tpl,
    leak: c.leak ? c.leak.test(r.text) : false,
    wrongLang: langOf(r.text) !== member(c).lang,
    format: /^#{1,6} |\|.*\|.*\|/m.test(r.text),
  };
}

/* ---------- running ---------- */
async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}
const rows = [];
const log = (s) => process.stdout.write(s + '\n');
const fmt$ = (v) => '$' + (v == null ? '-' : v < 0.1 ? v.toFixed(4) : v.toFixed(2));

const keyOf = (r) => [r.phase, r.sid, r.id, r.turn || '', r.rep || ''].join('|');
let done = new Map();
const save = (row) => {
  rows.push(row);
  const { msgs, ...keep } = row;
  appendFileSync(`${dir}/rows.jsonl`, JSON.stringify(keep) + '\n');
};
async function runOne(phase, sid, c, history, extra = {}, s = SETUPS[sid]) {
  const prior = done.get(keyOf({ phase, sid, id: c.id, ...extra }));
  if (prior && !(phase === 'chat')) return prior;
  if (spent >= (phase === 'judge' ? CAP : STOP_MAIN)) {
    save({ phase, sid, id: c.id, skipped: true, ...extra });
    return null;
  }
  try {
    const r = await call(s, c, history);
    const row = { phase, sid, model: s.model, id: c.id, f: c.f, ...extra, ...r, check: phase === 'judge' || phase === 'shared' ? null : checks(c, r) };
    save(row);
    log(`${phase.padEnd(6)} ${String(sid).padEnd(26)} ${(c.id + (extra.turn ? ' t' + extra.turn : extra.rep ? ' #' + extra.rep : '')).padEnd(32)} ${fmt$(r.usd)}  ${(r.ms / 1000).toFixed(1)}s  ${r.usage.output_tokens} out${r.stop === 'max_tokens' ? '  CUT OFF' : ''}   total ${fmt$(spent)}`);
    return row;
  } catch (e) {
    const msg = String(e?.message || e).slice(0, 300);
    save({ phase, sid, id: c.id, error: msg, ...extra });
    log(`${phase} ${sid} ${c.id}: error ${msg}`);
    return null;
  }
}
const phaseDeep = () => phaseSingle(DEEP_SETUPS, SINGLE.filter((c) => HARD.includes(c.id) && (!only || only.includes(c.id))));
const userMsg = (c) => ({ role: 'user', content: `${PAGES[c.page]}\n\n${c.q}` });

async function phaseSingle(setups = CORE_SETUPS, cases = SINGLE.filter((c) => !only || only.includes(c.id))) {
  for (const sid of setups.filter((x) => x !== 'sonnet-low-oneround' && (!pickSetups || pickSetups.includes(x)))) {
    // The first question writes the shared cache; the rest run in parallel and read it.
    await runOne('single', sid, cases[0], [userMsg(cases[0])]);
    await pool(cases.slice(1), CONC, (c) => runOne('single', sid, c, [userMsg(c)]));
  }
  if (!setups.includes('sonnet-low-oneround') || (pickSetups && !pickSetups.includes('sonnet-low-oneround'))) return;
  const tplCases = SINGLE.filter((c) => c.tpl?.length && (!only || only.includes(c.id)));
  if (!tplCases.length) return;
  await runOne('single', 'sonnet-low-oneround', tplCases[0], [userMsg(tplCases[0])]);
  await pool(tplCases.slice(1), CONC, (c) => runOne('single', 'sonnet-low-oneround', c, [userMsg(c)]));
}

async function phaseChats() {
  for (const sid of CHAT_SETUPS.filter((x) => !pickSetups || pickSetups.includes(x))) {
    await pool(CHATS, 3, async (ch) => {
      const c = { ...ch, chat: true };
      if (ch.turns.every((_, t) => done.has(keyOf({ phase: 'chat', sid, id: ch.id, turn: t + 1 })))) return;
      let history = [];
      for (const [t, q] of ch.turns.entries()) {
        const content = t === 0 ? `${PAGES[ch.page]}\n\n${q}` : q;
        history.push({ role: 'user', content });
        const r = await runOne('chat', sid, { ...c, q }, history, { turn: t + 1 });
        if (!r) return;
        // The prototype keeps text only; the API setups keep the full turn (thinking, template calls, results).
        history = SETUPS[sid].today ? [...history, { role: 'assistant', content: r.text || '…' }] : r.msgs;
      }
    });
  }
}

async function phaseShared() {
  const P = {
    lessonSource: PAGES['lesson-transcript'] || PAGES.lesson,
    changes: changes(),
    research: PAGES.research,
    guide: GUIDE.GMTrade,
  };
  for (const [sid, ids] of Object.entries(SHARED_SETUPS)) {
    await pool(SHARED.filter((j) => !ids || ids.includes(j.id)), CONC, (j) => {
      // Plain one-off request: no templates, no member.
      const s = { ...SETUPS[sid], max_tokens: j.max_tokens, raw: true };
      return runOne('shared', sid, { id: j.id, f: j.f, page: 'wega' }, [{ role: 'user', content: j.prompt(P) }], {}, s);
    });
  }
}

async function phaseRepeat() {
  const cases = SINGLE.filter((c) => REPEAT_CASES.includes(c.id));
  await pool(cases, CONC, (c) => runOne('repeat', 'sonnet-low', c, [userMsg(c)], { rep: 2 }));
}

/* The judge reads every setup's answer to one question side by side, without knowing which setup wrote which. */
const JUDGE_SYSTEM = `You grade answers of Wega, the AI helper of a DeFi members' club, against its rules and its data. Be strict and short.

Wega's rules:
${RULES}

The data Wega had:
${PLATFORM}`;
const GRADE_SCHEMA = {
  type: 'object',
  properties: {
    grades: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          score: { type: 'integer', description: '1 = wrong or harmful, 3 = usable with flaws, 5 = correct, helpful, follows every rule' },
          made_up: { type: 'boolean', description: 'States a number, date, reason or quote that is not in the data' },
          advice: { type: 'boolean', description: 'Tells the member to buy, sell, enter or exit' },
          misses_point: { type: 'boolean', description: "Doesn't answer the question or ignores the page" },
          quiz_leak: { type: 'boolean', description: 'Reveals or confirms the answer of a quiz question that is still open (false when no quiz question is open)' },
          note: { type: 'string', description: '10 words at most' },
        },
        required: ['label', 'score', 'made_up', 'advice', 'misses_point', 'quiz_leak', 'note'],
        additionalProperties: false,
      },
    },
  },
  required: ['grades'],
  additionalProperties: false,
};
// phase 'judge' grades the main setups; 'judge-oneround' grades template answers in one request against two requests.
async function phaseJudge(phase = 'judge', setups = SINGLE_SETUPS) {
  const single = rows.filter((r) => r.phase === 'single' && r.text && setups.includes(r.sid));
  const ids = [...new Set(single.map((r) => r.id))].filter((id) => phase === 'judge' || setups.every((s) => single.some((r) => r.id === id && r.sid === s)));
  await pool(ids, CONC, async (id) => {
    if (done.has(keyOf({ phase, sid: 'judge', id })) || spent >= CAP) return;
    const c = SINGLE.find((x) => x.id === id);
    const answers = single.filter((r) => r.id === id).sort(() => Math.random() - 0.5);
    const labels = answers.map((_, i) => String.fromCharCode(65 + i));
    const body = `${member(c).text}\n\n${PAGES[c.page]}\n\nThe member asked: ${c.q}\n\n${answers.map((a, i) => `--- Answer ${labels[i]} ---\n${a.text}${a.charts.length ? `\n[template shown: ${a.charts.map((x) => x.name).join(', ')}]` : ''}`).join('\n\n')}\n\nGrade every answer.`;
    try {
      const stream = client.messages.stream({
        model: JUDGE.model,
        max_tokens: JUDGE.max_tokens,
        output_config: { effort: JUDGE.effort, format: { type: 'json_schema', schema: GRADE_SCHEMA } },
        system: [{ type: 'text', text: JUDGE_SYSTEM, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: body }],
      });
      const msg = await stream.finalMessage();
      const u = { ...zero(), ...msg.usage };
      const usd = cost(JUDGE.model, u);
      spent += usd;
      const out = JSON.parse(msg.content.find((b) => b.type === 'text').text);
      const grades = out.grades.filter((g) => answers[labels.indexOf(g.label)]).map((g) => ({ ...g, sid: answers[labels.indexOf(g.label)].sid, score: Math.max(1, Math.min(5, g.score)) }));
      save({ phase, sid: 'judge', model: JUDGE.model, id, usage: u, usd, grades });
      log(`${phase}  ${id.padEnd(32)} ${fmt$(usd)}   total ${fmt$(spent)}`);
    } catch (e) {
      save({ phase, sid: 'judge', id, error: String(e?.message || e).slice(0, 300) });
      log(`judge ${id}: error ${e?.message || e}`);
    }
  });
}

/* ---------- dry run: counts the cached prefix with the free token counter and estimates the rest ---------- */
async function dryRun() {
  const est = {};
  for (const m of [HAIKU, SONNET, OPUS]) {
    const c = SINGLE[0];
    const r = request({ model: m, effort: 'low' }, c, [userMsg(c)]);
    const n = await client.messages.countTokens({ model: m, system: r.system, tools: r.tools, messages: r.messages });
    est[m] = { total: n.input_tokens, perChar: n.input_tokens / (JSON.stringify(r.tools).length + RULES.length + PLATFORM.length + member(c).text.length + userMsg(c).content.length) };
  }
  const tailTok = (m, c) => Math.ceil((member(c).text.length + userMsg(c).content.length) * est[m].perChar);
  const prefixTok = (m) => est[m].total - tailTok(m, SINGLE[0]);
  // Output tokens per answer, as measured in the first runs (templates add a second request).
  const OUT = { today: 600, 'haiku-low': 550, 'haiku-medium': 700, 'sonnet-low': 420, 'sonnet-medium': 600, 'opus-low': 420 };
  let total = 0;
  const line = (k, v) => {
    total += v;
    log(`${k.padEnd(40)} ${fmt$(v)}`);
  };
  log(`Cached prefix (templates + rules + platform data): Haiku ${prefixTok(HAIKU)}, Sonnet ${prefixTok(SONNET)}, Opus ${prefixTok(OPUS)} tokens.\n`);
  for (const sid of [...CORE_SETUPS, ...DEEP_SETUPS.filter((x) => x !== 'sonnet-low-oneround')]) {
    const s = SETUPS[sid],
      p = PRICE[s.model];
    let v = 0;
    for (const c of CORE_SETUPS.includes(sid) ? SINGLE : SINGLE.filter((c) => HARD.includes(c.id))) {
      const tail = tailTok(s.model, c),
        pre = prefixTok(s.model);
      v += (s.today ? (pre + tail) * p.in : pre * p.read + tail * p.in) / 1e6 + (OUT[sid] * p.out) / 1e6;
    }
    line(`single · ${sid}`, v + (s.today ? 0 : (prefixTok(s.model) * p.in * 0.25) / 1e6));
  }
  for (const sid of CHAT_SETUPS) {
    const s = SETUPS[sid],
      p = PRICE[s.model];
    let v = 0;
    for (const ch of CHATS)
      for (let t = 0; t < ch.turns.length; t++) {
        const hist = tailTok(s.model, { ...ch, q: ch.turns[0] }) + t * 400;
        v += (s.today ? (prefixTok(s.model) + hist) * p.in : prefixTok(s.model) * p.read + (s.noTail ? hist : 400) * p.in * 1.25 + (s.noTail ? 0 : hist * p.read)) / 1e6 + (300 * p.out) / 1e6;
      }
    line(`chats · ${sid} · ${CHATS.length} x 4 turns`, v);
  }
  for (const [sid, ids] of Object.entries(SHARED_SETUPS)) {
    const p = PRICE[SETUPS[sid].model],
      n = ids ? ids.length : SHARED.length;
    line(`shared · ${sid} · ${n} jobs`, n * ((3000 * p.in + 1500 * p.out) / 1e6));
  }
  line(`repeat · sonnet-low · ${REPEAT_CASES.length} x 1`, REPEAT_CASES.length * 0.011);
  line(`judge · ${SINGLE.length} questions`, SINGLE.length * ((prefixTok(SONNET) * 0.2 + 3000 * 2 + 600 * 10) / 1e6));
  log(`\nEstimated total: ${fmt$(total)} (cap ${fmt$(CAP)}). Output lengths are guesses; the run stops at the cap.`);
}

/* ---------- reports ---------- */
const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const med = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};
const inTok = (u) => u.input_tokens + u.cache_creation_input_tokens + u.cache_read_input_tokens;
// What the same answer costs when nobody asked in the last 5 minutes and the shared cache must be written again.
// A second request (after a template) reads what the first one just wrote, so only one write is added.
const coldUsd = (r) => r.usd + ((r.usage.cache_read_input_tokens / r.rounds) * (PRICE[r.model].in * 1.25 - PRICE[r.model].read)) / 1e6;
const warmUsd = (r) => r.usd - (r.usage.cache_creation_input_tokens * PRICE[r.model].in * 0.25 + r.usage.cache_creation_input_tokens * (PRICE[r.model].in - PRICE[r.model].read)) / 1e6;

function group(rs) {
  const g = rs.filter((r) => r.usage);
  if (!g.length) return null;
  const graded = g.filter((r) => r.grade);
  const c = (k) => g.filter((r) => r.check?.[k]).length;
  return {
    n: g.length,
    usd: avg(g.map((r) => r.usd)),
    warm: avg(g.map(warmUsd)),
    cold: avg(g.map(coldUsd)),
    in: avg(g.map((r) => inTok(r.usage))),
    cachedPct: (100 * avg(g.map((r) => r.usage.cache_read_input_tokens))) / (avg(g.map((r) => inTok(r.usage))) || 1),
    out: avg(g.map((r) => r.usage.output_tokens)),
    words: avg(g.map((r) => r.check?.words || 0)),
    first: med(g.map((r) => r.firstMs || r.ms)) / 1000,
    time: med(g.map((r) => r.ms)) / 1000,
    cut: c('cut'),
    over: c('overLimit'),
    leak: c('leak'),
    wrongLang: c('wrongLang'),
    format: c('format'),
    tplRight: g.filter((r) => r.check?.tpl === 'right').length,
    tplScored: g.filter((r) => r.check && r.check.tpl !== 'not scored').length,
    tplMissed: g.filter((r) => r.check?.tpl === 'missed').length,
    tplWrong: g.filter((r) => ['wrong', 'extra'].includes(r.check?.tpl)).length,
    score: graded.length ? avg(graded.map((r) => r.grade.score)) : null,
    madeUp: graded.filter((r) => r.grade.made_up).length,
    advice: graded.filter((r) => r.grade.advice).length,
    missesPoint: graded.filter((r) => r.grade.misses_point).length,
    judgeLeak: graded.filter((r) => r.grade.quiz_leak).length,
    graded: graded.length,
  };
}
const FEATURE = { 1: 'Lesson chat', 3: 'Explain it differently', 5: 'Quiz hint', 6: 'Why is that correct?', 8: 'Academy pages', 9: 'Open strategy', 11: 'Strategies list', 12: 'Panel', 13: '/wega chat', 14: 'Ask about this passage', 19: 'Guide me through entering', 20: 'What changed', 21: 'Live calls', 22: 'News check' };
// Share of questions that find the shared cache cold, if questions arrive at random over 14 waking hours a day.
const coldShare = (members, q) => Math.exp(-((members * q) / (30 * 14 * 60)) * 5);

function report(dir, stamp) {
  const S = {};
  const single = rows.filter((r) => r.phase === 'single');
  // Checks are worked out again here, so a report rebuilt from rows.jsonl uses the current rules.
  for (const r of single) if (r.text != null && r.charts) r.check = checks(SINGLE.find((c) => c.id === r.id), r);
  for (const j of rows.filter((r) => r.phase === 'judge' && r.grades)) for (const g of j.grades) {
    const a = single.find((r) => r.id === j.id && r.sid === g.sid && r.text);
    if (a) a.grade = g;
  }
  const ALL_Q = [...CORE_SETUPS, 'sonnet-low-oneround'].filter((sid) => single.filter((r) => r.sid === sid && r.usage).length === SINGLE.length);
  for (const sid of ALL_Q) S[sid] = group(single.filter((r) => r.sid === sid));
  const setups = ALL_Q.filter((s) => S[s]);
  // Opus and medium effort only answered the hardest questions, so every setup is compared on those too.
  const H = {};
  for (const sid of [...SINGLE_SETUPS, 'sonnet-low-oneround']) H[sid] = group(single.filter((r) => r.sid === sid && HARD.includes(r.id)));
  const byFeature = {};
  for (const f of Object.keys(FEATURE)) {
    byFeature[f] = {};
    for (const sid of setups) byFeature[f][sid] = group(single.filter((r) => r.sid === sid && String(r.f) === f));
  }
  const pair = (sid, a, b) => {
    const A = single.filter((r) => r.sid === sid && a(r) && r.usage),
      B = single.filter((r) => r.sid === sid && b(r) && r.usage);
    return { a: group(A), b: group(B) };
  };
  const situations = {};
  for (const sid of ['sonnet-low', 'haiku-low']) {
    if (!S[sid]) continue;
    situations[sid] = {
      'English vs German (same questions)': pair(sid, (r) => ['eth-drop', 'changed', 'strat-timing'].includes(r.id), (r) => ['eth-drop-de', 'changed-de', 'strat-timing-de'].includes(r.id)),
      'Member with wallet data vs none': pair(sid, (r) => ['exposure', 'changed', 'news'].includes(r.id), (r) => ['exposure-nodata', 'changed-nodata', 'news-nodata'].includes(r.id)),
      'Lesson outline vs full transcript': pair(sid, (r) => ['lesson-what', 'lesson-negative-de'].includes(r.id), (r) => ['lesson-what-transcript', 'lesson-negative-de-transcript'].includes(r.id)),
      'Small page vs page with the full research report': pair(sid, (r) => ['exposure', 'vs-model', 'changed'].includes(r.id), (r) => ['news'].includes(r.id)),
    };
  }
  const tplIds = SINGLE.filter((c) => c.tpl?.length).map((c) => c.id);
  const j1 = rows.filter((r) => r.phase === 'judge-oneround' && r.grades).flatMap((r) => r.grades);
  const oneRoundJudge = ['sonnet-low', 'sonnet-low-oneround'].map((sid) => {
    const g = j1.filter((x) => x.sid === sid);
    return { sid, n: g.length, score: avg(g.map((x) => x.score)), madeUp: g.filter((x) => x.made_up).length, missesPoint: g.filter((x) => x.misses_point).length };
  });
  const one = group(single.filter((r) => r.sid === 'sonnet-low-oneround'));
  if (one && S['sonnet-low'])
    situations['sonnet-low']['Template answers: two requests vs one'] = { a: group(single.filter((r) => r.sid === 'sonnet-low' && tplIds.includes(r.id))), b: one };
  const chats = {};
  for (const sid of CHAT_SETUPS) {
    const g = rows.filter((r) => r.phase === 'chat' && r.sid === sid && r.usage);
    if (!g.length) continue;
    chats[sid] = { turns: [1, 2, 3, 4].map((t) => group(g.filter((r) => r.turn === t))), total: g.reduce((s, r) => s + r.usd, 0) / CHATS.length };
  }
  const shared = rows.filter((r) => r.phase === 'shared' && r.usage).map((r) => ({ id: r.id, setup: r.sid, usd: r.usd, in: inTok(r.usage), out: r.usage.output_tokens, seconds: r.ms / 1000 }));
  const rep = rows.filter((r) => (r.phase === 'repeat' || (r.phase === 'single' && r.sid === 'sonnet-low')) && REPEAT_CASES.includes(r.id) && r.usage);
  const variance = REPEAT_CASES.map((id) => {
    const g = rep.filter((r) => r.id === id);
    return { id, n: g.length, min: Math.min(...g.map((r) => r.usd)), max: Math.max(...g.map((r) => r.usd)), outMin: Math.min(...g.map((r) => r.usage.output_tokens)), outMax: Math.max(...g.map((r) => r.usage.output_tokens)) };
  }).filter((v) => v.n);
  const errors = rows.filter((r) => r.error).length,
    skipped = rows.filter((r) => r.skipped).length;

  writeFileSync(`${dir}/summary.json`, JSON.stringify({ stamp, spent, setups: S, hardest: H, oneRoundJudge, byFeature, situations, chats, shared, variance, errors, skipped }, null, 1));

  const pct = (a, b) => (b ? `${a} of ${b}` : '-');
  let md = `# Wega benchmark, ${stamp}\n\n${rows.filter((r) => r.usage).length} calls, ${errors} errors, ${skipped} skipped at the cap. This run cost ${fmt$(spent)}. Prices: Anthropic list prices, October 2026.\n\n`;
  md += `## Setups, ${SINGLE.length} single questions\n\nCost per answer when the shared cache is warm (someone asked in the last 5 minutes) and cold. Score: the judge's 1-5 grade.\n\n| Setup | Warm | Cold | Tokens in (cached) / out | Words | First word | Full answer | Score | Made up | Advice | Template right | Over limit | Cut off | Wrong language | Quiz leak (check / judge) |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
  for (const sid of setups) {
    const g = S[sid];
    md += `| ${sid} | ${fmt$(g.warm)} | ${fmt$(g.cold)} | ${Math.round(g.in)} (${Math.round(g.cachedPct)}%) / ${Math.round(g.out)} | ${Math.round(g.words)} | ${g.first.toFixed(1)}s | ${g.time.toFixed(1)}s | ${g.score?.toFixed(2) ?? '-'} | ${g.madeUp} | ${g.advice} | ${pct(g.tplRight, g.tplScored)} | ${g.over} | ${g.cut} | ${g.wrongLang} | ${g.leak} / ${g.judgeLeak} |\n`;
  }
  md += `\n## The ${HARD.length} hardest questions, every setup\n\n| Setup | Warm | Cold | Tokens in / out | Words | First word | Full answer | Score | Made up | Advice | Template right |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
  for (const [sid, g] of Object.entries(H)) if (g) md += `| ${sid} | ${fmt$(g.warm)} | ${fmt$(g.cold)} | ${Math.round(g.in)} / ${Math.round(g.out)} | ${Math.round(g.words)} | ${g.first.toFixed(1)}s | ${g.time.toFixed(1)}s | ${g.score?.toFixed(2) ?? '-'} | ${g.madeUp} | ${g.advice} | ${pct(g.tplRight, g.tplScored)} |\n`;
  md += `\n## Cost per answer by feature (warm)\n\n| # | Feature | ${setups.join(' | ')} |\n| --- | --- | ${setups.map(() => '---').join(' | ')} |\n`;
  for (const [f, name] of Object.entries(FEATURE)) md += `| ${f} | ${name} | ${setups.map((s) => (byFeature[f][s] ? `${fmt$(byFeature[f][s].warm)} (${Math.round(byFeature[f][s].out)} out)` : '-')).join(' | ')} |\n`;
  md += `\n## Situations\n\n| Setup | Situation | First | Second | Change |\n| --- | --- | --- | --- | --- |\n`;
  for (const [sid, sit] of Object.entries(situations))
    for (const [k, v] of Object.entries(sit)) if (v.a && v.b) md += `| ${sid} | ${k} | ${fmt$(v.a.warm)}, ${Math.round(v.a.in)} in / ${Math.round(v.a.out)} out | ${fmt$(v.b.warm)}, ${Math.round(v.b.in)} in / ${Math.round(v.b.out)} out | ${v.b.warm > v.a.warm ? '+' : ''}${Math.round((100 * (v.b.warm - v.a.warm)) / v.a.warm)}% |\n`;
  if (j1.length) md += `\nJudge, template answers side by side: ${oneRoundJudge.map((x) => `${x.sid} ${x.score.toFixed(2)} (${x.n} answers, ${x.madeUp} made up, ${x.missesPoint} miss the point)`).join(' · ')}.\n`;
  md += `\n## Follow-up chats (${CHATS.length} chats x 4 turns)\n\nAverage cost of each turn; the conversation so far is resent every turn.\n\n| Setup | Turn 1 | Turn 2 | Turn 3 | Turn 4 | Whole chat | Tokens in at turn 4 (cached) |\n| --- | --- | --- | --- | --- | --- | --- |\n`;
  for (const [sid, ch] of Object.entries(chats)) md += `| ${sid} | ${ch.turns.map((t) => fmt$(t?.usd)).join(' | ')} | ${fmt$(ch.total)} | ${ch.turns[3] ? `${Math.round(ch.turns[3].in)} (${Math.round(ch.turns[3].cachedPct)}%)` : '-'} |\n`;
  md += `\n## Written once, shared by every member\n\n| Job | Setup | Cost | Tokens in / out | Time |\n| --- | --- | --- | --- | --- |\n`;
  for (const s of shared) md += `| ${SHARED.find((j) => j.id === s.id).what} | ${s.setup} | ${fmt$(s.usd)} | ${s.in} / ${s.out} | ${s.seconds.toFixed(0)}s |\n`;
  md += `\n## Same question, run 3 times (sonnet-low)\n\n| Question | Cost min-max | Tokens out min-max |\n| --- | --- | --- |\n`;
  for (const v of variance) md += `| ${v.id} | ${fmt$(v.min)}-${fmt$(v.max)} | ${v.outMin}-${v.outMax} |\n`;
  md += `\n## Monthly cost of typed questions\n\nCost per answer mixes warm and cold cache by platform size (questions spread over 14 hours a day; a cold cache means nobody asked in the last 5 minutes).\n\n| Setup | Per member, 30 q | 60 q | 200 q | 100 members x 60 | 500 x 60 | 2,000 x 60 |\n| --- | --- | --- | --- | --- | --- | --- |\n`;
  const mix = (g, m) => g.warm + coldShare(m, 60) * (g.cold - g.warm);
  for (const sid of setups) {
    const g = S[sid];
    md += `| ${sid} | ${fmt$(mix(g, 500) * 30)} | ${fmt$(mix(g, 500) * 60)} | ${fmt$(mix(g, 500) * 200)} | ${fmt$(mix(g, 100) * 6000)} | ${fmt$(mix(g, 500) * 30000)} | ${fmt$(mix(g, 2000) * 120000)} |\n`;
  }
  writeFileSync(`${dir}/summary.md`, md);

  let ans = `# Wega benchmark answers, ${stamp}\n\nEvery answer with its cost, checks and grade. A cheaper setup only counts if its answers are as good.\n`;
  for (const c of SINGLE) {
    const g = single.filter((r) => r.id === c.id && r.text);
    if (!g.length) continue;
    ans += `\n## ${c.id} (feature ${c.f}, ${c.page}, ${member(c).lang}): ${c.q}\n`;
    for (const r of g)
      ans += `\n**${r.sid}** · ${fmt$(r.usd)} · ${(r.ms / 1000).toFixed(1)}s · ${r.check.words} words${r.check.cut ? ' · CUT OFF' : ''}${r.charts.length ? ' · template `' + r.charts.map((x) => `${x.name}(${JSON.stringify(x.input)})`).join(' ') + '`' : ''}${r.grade ? ` · score ${r.grade.score}${r.grade.made_up ? ' · MADE UP' : ''}${r.grade.advice ? ' · ADVICE' : ''} · ${r.grade.note}` : ''}\n\n${r.text}\n`;
  }
  ans += `\n# Chats\n`;
  for (const ch of CHATS)
    for (const sid of CHAT_SETUPS) {
      const g = rows.filter((r) => r.phase === 'chat' && r.id === ch.id && r.sid === sid && r.text);
      if (!g.length) continue;
      ans += `\n## ${ch.id} · ${sid}\n`;
      for (const r of g) ans += `\n**Turn ${r.turn}: ${ch.turns[r.turn - 1]}** (${fmt$(r.usd)}${r.charts.length ? ', template ' + r.charts.map((x) => x.name).join(' ') : ''})\n\n${r.text}\n`;
    }
  ans += `\n# Shared content\n`;
  for (const r of rows.filter((r) => r.phase === 'shared' && r.text)) ans += `\n## ${r.id} · ${r.sid} (${fmt$(r.usd)})\n\n${r.text}\n`;
  writeFileSync(`${dir}/answers.md`, ans);

  const csv = [
    'phase,setup,model,case,feature,turn,rep,input_tokens,cache_write_tokens,cache_read_tokens,output_tokens,usd,seconds,first_text_seconds,stop_reason,rounds,templates,words,over_limit,template_check,quiz_leak,wrong_language,score,made_up,advice,skipped,error',
    ...rows.map((x) =>
      [
        x.phase, x.sid, x.model, x.id, x.f, x.turn, x.rep,
        x.usage?.input_tokens, x.usage?.cache_creation_input_tokens, x.usage?.cache_read_input_tokens, x.usage?.output_tokens,
        x.usd?.toFixed(6), x.ms && (x.ms / 1000).toFixed(2), x.firstMs && (x.firstMs / 1000).toFixed(2), x.stop, x.rounds,
        JSON.stringify((x.charts || []).map((c) => c.name).join(' ')), x.check?.words, x.check?.overLimit, x.check?.tpl, x.check?.leak, x.check?.wrongLang,
        x.grade?.score, x.grade?.made_up, x.grade?.advice, x.skipped || '', JSON.stringify(x.error || ''),
      ].join(','),
    ),
  ].join('\n');
  writeFileSync(`${dir}/results.csv`, csv + '\n');
  writeFileSync(`${dir}/judge.json`, JSON.stringify(single.filter((r) => r.grade).map((r) => ({ id: r.id, setup: r.sid, ...r.grade })), null, 1));
  return md;
}

/* ---------- main ---------- */
if (dry) {
  await dryRun();
  process.exit(0);
}
const dir = resume || `results/${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
const stamp = dir.split('/').pop();
mkdirSync(dir, { recursive: true });
if (resume && existsSync(`${dir}/rows.jsonl`)) {
  const prior = readFileSync(`${dir}/rows.jsonl`, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  // Keep what succeeded; skipped and failed calls run again. Chats keep only complete conversations.
  const ok = prior.filter((r) => r.usage);
  const chatDone = new Set(ok.filter((r) => r.phase === 'chat').map((r) => `${r.sid}|${r.id}`).filter((k) => ok.filter((r) => r.phase === 'chat' && `${r.sid}|${r.id}` === k).length === 4));
  const keep = ok.filter((r) => r.phase !== 'chat' || chatDone.has(`${r.sid}|${r.id}`));
  rows.push(...keep);
  writeFileSync(`${dir}/rows.jsonl`, keep.map((r) => JSON.stringify(r)).join('\n') + (keep.length ? '\n' : ''));
  done = new Map(keep.map((r) => [keyOf(r), r]));
  spent = keep.reduce((t, r) => t + (r.usd || 0), 0);
  log(`Resuming ${dir}: ${keep.length} calls kept, ${fmt$(spent)} already spent.`);
}
log(`Run ${stamp}, cap ${fmt$(CAP)}, phases ${phases.join(', ')}\n`);
if (phases.includes('single')) await phaseSingle();
if (phases.includes('chats')) await phaseChats();
if (phases.includes('shared')) await phaseShared();
if (phases.includes('deep')) await phaseDeep();
if (phases.includes('repeat')) await phaseRepeat();
// The recommended setup on every question, for its own row in the tables.
if (phases.includes('oneround-all')) await pool(SINGLE, CONC, (c) => runOne('single', 'sonnet-low-oneround', c, [userMsg(c)]));
if (phases.includes('judge')) await phaseJudge();
if (phases.includes('judge-oneround')) await phaseJudge('judge-oneround', ['sonnet-low', 'sonnet-low-oneround']);
const md = report(dir, stamp);
log(`\n${md}\nSaved to ${dir}/ · total spent ${fmt$(spent)}`);
