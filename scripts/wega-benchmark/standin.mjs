/* Writes data/lesson-frf-transcript.txt: a stand-in transcript of a 24-minute German lesson, made from the lesson
   outline. No lesson transcripts exist yet (decision D6 approves making them); this one only lets the benchmark
   measure what a transcript of realistic length adds to each lesson answer. Costs well under $0.01 on Haiku. */
import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR } from './prompt.mjs';

const client = new Anthropic({ apiKey: process.env.WEGA_API_KEY || process.env.ANTHROPIC_API_KEY, baseURL: 'https://api.anthropic.com' });
const msg = await client.messages
  .stream({
    model: 'claude-haiku-5-5',
    max_tokens: 12000,
    output_config: { effort: 'low' },
    messages: [
      {
        role: 'user',
        content: `Write the spoken transcript of a 24-minute German video lesson, about 3,000 words, as one teacher talks. Lesson "Funding rate farming basics" in the course "DeFi Strategies", zone "Perp DEX & Funding", for beginners over 40. Outline: Funding rate farming collects funding without betting on the price: you hold the coin and short the same amount as a perp. The price moves cancel out. What is left is the funding you collect. Cover what funding is, who pays whom, why the two legs cancel the price risk, a worked example with 2,000 USDC, what can go wrong (negative funding, liquidation of the short leg, exchange risk, fees). Plain text with timestamps every minute or two like [04:10]. Use example numbers only, no real protocol names.`,
      },
    ],
  })
  .finalMessage();
const text = msg.content.find((b) => b.type === 'text').text;
writeFileSync(join(DATA_DIR, 'lesson-frf-transcript.txt'), `STAND-IN TRANSCRIPT, generated from the lesson outline to measure size and cost. Not a real lesson.\n\n${text}\n`);
const u = msg.usage;
console.log(`Wrote ${text.split(/\s+/).length} words. Cost $${((u.input_tokens * 0.1 + u.output_tokens * 0.5) / 1e6).toFixed(4)}.`);
