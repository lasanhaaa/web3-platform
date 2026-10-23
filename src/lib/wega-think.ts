/* What Wega says it is doing while it thinks (felipe, Oct 23: show the thinking the way other AI chats do). Each step
   names data Wega really has for that question: the member's snapshot, prices, the strategies and the model portfolio,
   the Academy, the live calls. The last step is always the writing. */
export const WRITING = 'Writing the answer';

/** The steps for a prompt chip's intent, a ready question's href (/wega/…) or a typed question. */
export function thinkSteps(key = '', screen?: string): string[] {
  const k = key.toLowerCase();
  let s: string[];
  if (/^s_(fit|size)/.test(k)) s = ['Reading your snapshot', 'Looking at the strategies'];
  else if (/^s_changes/.test(k)) s = ['Checking the model portfolio', 'Comparing it with your last visit'];
  else if (/^s_/.test(k)) s = [screen === 'strategies' && /^s_(explain|risk|setup)/.test(k) ? 'Looking at the strategy' : 'Looking at the strategies', 'Checking the model portfolio'];
  else if (/scenario|whatif|^sim|\bdrops?\b|crash/.test(k)) s = ['Reading your snapshot', 'Running the scenario'];
  else if (/asset|price|peg|coin|\b(eth|btc|bitcoin|arb|usdc)\b/.test(k)) s = ['Checking the latest prices'];
  else if (/portfolio|risk|idle|alloc|^hf|conc|approv|alert|l_port|liquidat|stablecoin/.test(k)) s = ['Reading your snapshot', 'Checking the numbers'];
  else if (/strateg|k=fit|carry|staking|changes|model/.test(k)) s = ['Looking at the strategies', 'Checking the model portfolio'];
  else if (/\bcall\b/.test(k)) s = ['Looking at the last live call'];
  else if (/^l_/.test(k)) s = ['Looking at this part of the lesson'];
  else if (/learn|zone|next|progress|review|prac|quiz|badge|cert|fork|^time|k=il\b/.test(k)) s = ['Checking your progress'];
  else if (/k=(use|start|membership|data)/.test(k)) s = ['Looking it up'];
  else if (screen === 'lesson') s = ['Looking at this part of the lesson'];
  else if (screen === 'strategies') s = ['Looking at the strategies'];
  else s = ['Thinking'];
  return [...s, WRITING];
}
