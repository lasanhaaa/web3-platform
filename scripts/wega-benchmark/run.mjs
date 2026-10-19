/* Wega benchmark: sends real member questions to Claude under several setups and measures tokens, cost and speed.
   Usage:  ANTHROPIC_API_KEY=sk-ant-... node run.mjs [--setups a,b] [--only id1,id2] [--repeat N] [--dry-run]
   Writes results/<timestamp>/ with results.csv, summary.md and answers.md. */
import Anthropic from '@anthropic-ai/sdk';
import { mkdirSync, writeFileSync } from 'node:fs';
import { MEMBER, QUESTIONS } from './questions.mjs';

// USD per million tokens, Anthropic list prices (October 2026). Cache writes (5 min) cost 1.25x input.
const PRICE = {
  'claude-haiku-5-5': { in: 0.1, out: 0.5, read: 0.01 },
  'claude-sonnet-5-5': { in: 2, out: 10, read: 0.2 },
  'claude-opus-5-5': { in: 4, out: 20, read: 0.2 },
};

// The ready-made chart templates the app already has. Claude only picks one and its settings; the app draws it.
const TOOLS = [
  {
    name: 'show_coin_chart',
    description: "Show the platform's price chart for a coin under your answer. Use it when the member asks how a coin has moved or where their own levels sit.",
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        coin: { type: 'string', enum: ['eth', 'btc', 'arb', 'usdc'] },
        period: { type: 'string', enum: ['1M', 'YTD', '1Y', '5Y'] },
        compare: { type: 'string', enum: ['none', 'eth', 'btc', 'arb', 'usdc'] },
        lines: { type: 'array', items: { type: 'string', enum: ['liquidation', 'lp_range', 'scenario'] } },
      },
      required: ['coin', 'period', 'compare', 'lines'],
      additionalProperties: false,
    },
  },
  {
    name: 'show_scenario',
    description: "Show the 'what if a coin drops' card: the member's net worth, Health Factor and LP position after a price drop. The app does the math.",
    strict: true,
    input_schema: {
      type: 'object',
      properties: { coin: { type: 'string', enum: ['eth', 'btc', 'arb'] }, drop_pct: { type: 'integer' } },
      required: ['coin', 'drop_pct'],
      additionalProperties: false,
    },
  },
  {
    name: 'show_exposure',
    description: "Show the bar of how much of the member's net worth depends on each coin.",
    strict: true,
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  },
  {
    name: 'link_lesson',
    description: 'Show a button to a lesson on the platform.',
    strict: true,
    input_schema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'], additionalProperties: false },
  },
];

const SETUPS = {
  // The prototype's /api/wega as it is: Sonnet 5.5 at its default effort, 700 tokens, no caching, no chart tools.
  today: { model: 'claude-sonnet-5-5', max_tokens: 700 },
  'haiku-low': { model: 'claude-haiku-5-5', max_tokens: 1500, effort: 'low', tools: true, cache: true },
  'sonnet-low': { model: 'claude-sonnet-5-5', max_tokens: 1500, effort: 'low', tools: true, cache: true },
  'opus-low': { model: 'claude-opus-5-5', max_tokens: 1500, effort: 'low', tools: true, cache: true },
  // What the developer worried about: the AI writes the chart itself. Only run on questions that want a chart.
  'sonnet-draws-charts': {
    model: 'claude-sonnet-5-5',
    max_tokens: 8000,
    effort: 'low',
    cache: true,
    chartsOnly: true,
    extra: '\nWhen a chart helps, draw it yourself: include an inline <svg> line chart with the real data points under your answer.',
  },
};

const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf('--' + n);
  return i < 0 ? null : args[i + 1];
};
const dry = args.includes('--dry-run');
const setupIds = (flag('setups') || Object.keys(SETUPS).join(',')).split(',');
const only = flag('only')?.split(',');
const repeat = Number(flag('repeat') || 1);

for (const id of setupIds) if (!SETUPS[id]) throw new Error(`Unknown setup "${id}". Setups: ${Object.keys(SETUPS).join(', ')}`);
const plan = setupIds.flatMap((sid) =>
  QUESTIONS.filter((q) => (!only || only.includes(q.id)) && (!SETUPS[sid].chartsOnly || q.chart)).flatMap((q) => Array.from({ length: repeat }, (_, r) => ({ sid, q, r }))),
);

if (dry) {
  // Rough estimate (4 characters per token) of what one run costs, without calling the API.
  const tok = (s) => Math.ceil(s.length / 4);
  let usd = 0;
  for (const { sid, q } of plan) {
    const s = SETUPS[sid],
      p = PRICE[s.model];
    usd += ((tok(MEMBER + q.page + q.q) + (s.tools ? 600 : 0)) * p.in + (s.chartsOnly ? 3500 : 400) * p.out) / 1e6;
  }
  console.log(`${plan.length} calls across ${setupIds.join(', ')}. Estimated cost of this run: about $${usd.toFixed(2)}.`);
  process.exit(0);
}

const client = new Anthropic();
const cost = (m, u) => {
  const p = PRICE[m];
  return (u.input_tokens * p.in + u.output_tokens * p.out + (u.cache_creation_input_tokens || 0) * p.in * 1.25 + (u.cache_read_input_tokens || 0) * p.read) / 1e6;
};

async function ask(s, q) {
  const system = [{ type: 'text', text: MEMBER + (s.extra || ''), ...(s.cache ? { cache_control: { type: 'ephemeral' } } : {}) }];
  const messages = [{ role: 'user', content: `${q.page}\n\n${q.q}` }];
  const base = { model: s.model, max_tokens: s.max_tokens, system, ...(s.effort ? { output_config: { effort: s.effort } } : {}), ...(s.tools ? { tools: TOOLS } : {}) };
  const t0 = performance.now();
  let first = null;
  const total = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
  let text = '',
    stop = '',
    rounds = 0;
  const charts = [];
  // A chart tool call is answered with "shown" and Claude finishes its answer, as the app would do it.
  while (rounds < 3) {
    rounds++;
    const stream = client.messages.stream({ ...base, messages });
    stream.on('streamEvent', (e) => {
      if (first == null && e.type === 'content_block_delta' && (e.delta.type === 'text_delta' || e.delta.type === 'input_json_delta')) first = performance.now() - t0;
    });
    const msg = await stream.finalMessage();
    for (const k of Object.keys(total)) total[k] += msg.usage[k] || 0;
    stop = msg.stop_reason;
    const uses = [];
    for (const b of msg.content) {
      if (b.type === 'text') text += b.text;
      if (b.type === 'tool_use') {
        uses.push(b);
        charts.push(`${b.name}(${JSON.stringify(b.input)})`);
      }
    }
    if (stop !== 'tool_use') break;
    messages.push({ role: 'assistant', content: msg.content });
    messages.push({ role: 'user', content: uses.map((b) => ({ type: 'tool_result', tool_use_id: b.id, content: 'Shown to the member under your answer.' })) });
  }
  return { usage: total, ms: performance.now() - t0, firstMs: first, text, stop, rounds, charts };
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dir = `results/${stamp}`;
mkdirSync(dir, { recursive: true });
const rows = [];
for (const [i, { sid, q, r }] of plan.entries()) {
  const s = SETUPS[sid];
  process.stdout.write(`[${i + 1}/${plan.length}] ${sid} · ${q.id}${repeat > 1 ? ' #' + (r + 1) : ''} ... `);
  try {
    const a = await ask(s, q);
    const usd = cost(s.model, a.usage);
    rows.push({ sid, model: s.model, q, ...a, usd });
    console.log(`$${usd.toFixed(4)} · ${(a.ms / 1000).toFixed(1)}s · ${a.usage.output_tokens} out${a.stop === 'max_tokens' ? ' · CUT OFF' : ''}`);
  } catch (e) {
    console.log('error: ' + (e?.message || e));
    rows.push({ sid, model: s.model, q, error: String(e?.message || e) });
  }
}

const ok = rows.filter((x) => !x.error);
const csv = [
  'setup,model,question,input_tokens,cache_write_tokens,cache_read_tokens,output_tokens,usd,seconds,first_token_seconds,stop_reason,rounds,charts,error',
  ...rows.map((x) =>
    [x.sid, x.model, x.q.id, x.usage?.input_tokens, x.usage?.cache_creation_input_tokens, x.usage?.cache_read_input_tokens, x.usage?.output_tokens, x.usd?.toFixed(5), x.ms && (x.ms / 1000).toFixed(2), x.firstMs && (x.firstMs / 1000).toFixed(2), x.stop, x.rounds, JSON.stringify((x.charts || []).join(' ')), JSON.stringify(x.error || '')].join(','),
  ),
].join('\n');
writeFileSync(`${dir}/results.csv`, csv + '\n');

const avg = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
const med = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};
const usd = (v) => '$' + (v < 0.1 ? v.toFixed(4) : v.toFixed(2));
let md = `# Wega benchmark, ${stamp}\n\n${ok.length} answers, ${rows.length - ok.length} errors. Prices: Anthropic list prices, October 2026.\n\n`;
md += '| Setup | Model | Avg cost per answer | Avg tokens in / out | Cache read share | Median time | Median first word | Cut off | Chart calls |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n';
const per = {};
for (const sid of setupIds) {
  const g = ok.filter((x) => x.sid === sid);
  if (!g.length) continue;
  const inTok = g.map((x) => x.usage.input_tokens + x.usage.cache_creation_input_tokens + x.usage.cache_read_input_tokens);
  per[sid] = avg(g.map((x) => x.usd));
  md += `| ${sid} | ${SETUPS[sid].model} | ${usd(per[sid])} | ${Math.round(avg(inTok))} / ${Math.round(avg(g.map((x) => x.usage.output_tokens)))} | ${Math.round((100 * avg(g.map((x) => x.usage.cache_read_input_tokens))) / avg(inTok))}% | ${(med(g.map((x) => x.ms)) / 1000).toFixed(1)}s | ${(med(g.map((x) => x.firstMs || x.ms)) / 1000).toFixed(1)}s | ${g.filter((x) => x.stop === 'max_tokens').length} of ${g.length} | ${g.filter((x) => x.charts.length).length} |\n`;
}
md += '\n## Monthly cost\n\nPer member per month, and for the whole platform, using each setup\'s average cost per answer.\n\n| Setup | 30 questions / member | 60 / member | 200 / member | 100 members × 60 | 500 members × 60 | 2,000 members × 60 |\n| --- | --- | --- | --- | --- | --- | --- |\n';
for (const [sid, c] of Object.entries(per)) md += `| ${sid} | ${usd(c * 30)} | ${usd(c * 60)} | ${usd(c * 200)} | ${usd(c * 6000)} | ${usd(c * 30000)} | ${usd(c * 120000)} |\n`;
md += `\nThis run cost ${usd(ok.reduce((s, x) => s + x.usd, 0))} in total.\n`;
writeFileSync(`${dir}/summary.md`, md);

let ans = `# Wega benchmark answers, ${stamp}\n\nRead these to judge quality: a cheaper setup only counts if its answers are as good.\n`;
for (const q of QUESTIONS.filter((q) => ok.some((x) => x.q === q))) {
  ans += `\n## ${q.id}: ${q.q}\n`;
  for (const x of ok.filter((x) => x.q === q)) ans += `\n**${x.sid}** (${usd(x.usd)}, ${(x.ms / 1000).toFixed(1)}s${x.stop === 'max_tokens' ? ', CUT OFF' : ''})${x.charts.length ? ' · chart: `' + x.charts.join(' ') + '`' : ''}\n\n${x.text.trim()}\n`;
}
writeFileSync(`${dir}/answers.md`, ans);
console.log(`\n${md}\nSaved to ${dir}/`);
