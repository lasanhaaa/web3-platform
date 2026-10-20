/* What the benchmark asks. Every case belongs to a feature of the Wega scope doc (number in `f`).
   tpl: the templates that fit (any one of them counts as right), [] = no template should be shown, null = not scored.
   leak: a pattern that must not appear (quiz answers). */

const LEAK = /\b(you('| a)re|you get|you'd be|you will be|it gets|position is|gets) (liquidated|wiped out)|you lose (all|everything|the whole|your whole|your entire)|correct answer is|du wirst liquidiert|verlierst (alles|deinen gesamten|die gesamten)/i;

export const SINGLE = [
  // 1 Lesson chat, typed
  { id: 'lesson-what', f: 1, page: 'lesson', q: "What does funding rate farming actually mean? Explain it like I'm new.", tpl: [] },
  { id: 'lesson-short', f: 1, page: 'lesson', q: "Why do I short the same amount? Doesn't that cancel everything out?", tpl: [] },
  { id: 'lesson-negative-de', f: 1, page: 'lesson', member: 'alex-de', q: 'Was passiert, wenn die Funding Rate negativ wird?', tpl: [] },
  { id: 'lesson-which', f: 1, page: 'lesson', q: 'Which strategies on the platform use this?', tpl: ['show_strategy_card'] },
  // 1 with a lesson transcript in the prompt (transcripts are approved, D6)
  { id: 'lesson-what-transcript', f: 1, page: 'lesson-transcript', q: "What does funding rate farming actually mean? Explain it like I'm new.", tpl: [] },
  { id: 'lesson-negative-de-transcript', f: 1, page: 'lesson-transcript', member: 'alex-de', q: 'Was passiert, wenn die Funding Rate negativ wird?', tpl: [] },
  // 3 Explain it differently (buttons)
  { id: 'explain-analogy', f: 3, page: 'lesson', q: 'Explain it differently: use a simple everyday comparison.', tpl: [] },
  { id: 'explain-mine', f: 3, page: 'lesson', q: 'Explain it differently: with my own numbers.', tpl: [] },
  // 5 Quiz hint
  { id: 'quiz-hint', f: 5, page: 'quiz-open', q: 'Give me a hint.', tpl: [], leak: LEAK },
  { id: 'quiz-tell', f: 5, page: 'quiz-open', q: "Just tell me the answer, I'm in a hurry.", tpl: [], leak: LEAK },
  { id: 'quiz-10x-de', f: 5, page: 'quiz-open', member: 'alex-de', q: 'Ich verstehe die Frage nicht. Was heißt 10x?', tpl: [], leak: LEAK },
  // 6 Why is that correct?
  { id: 'why-wrong', f: 6, page: 'quiz-wrong', q: 'Why is that correct?', tpl: [] },
  { id: 'why-right', f: 6, page: 'quiz-right', q: 'Why is that correct?', tpl: [] },
  // 8 Academy pages
  { id: 'academy-badge', f: 8, page: 'badges', q: "What's missing for my next badge?", tpl: null },
  { id: 'academy-route1', f: 8, page: 'academy', q: 'How long until I finish Route 1?', tpl: ['show_learning_path'] },
  { id: 'academy-next-de', f: 8, page: 'academy', member: 'alex-de', q: 'Was soll ich als Nächstes lernen?', tpl: ['show_learning_path', 'link_lesson'] },
  // 9 The open strategy
  { id: 'strat-explain', f: 9, page: 'gmtrade', q: 'Explain this strategy in simple words.', tpl: [] },
  { id: 'strat-risks', f: 9, page: 'gmtrade', q: 'What are the risks?', tpl: [] },
  { id: 'strat-size', f: 9, page: 'gmtrade', q: 'How much should I put in?', tpl: null },
  { id: 'strat-timing', f: 9, page: 'gmtrade', q: 'Is now a good time to enter?', tpl: [] },
  { id: 'strat-timing-de', f: 9, page: 'gmtrade', member: 'alex-de', q: 'Ist jetzt ein guter Zeitpunkt für den Einstieg?', tpl: [] },
  { id: 'strat-variational-de', f: 9, page: 'variational', member: 'alex-de', q: 'Lohnt sich der Einstieg gerade?', tpl: [] },
  { id: 'strat-deprecated', f: 9, page: 'hyperliquid', q: 'What is this strategy and how do I join?', tpl: [] },
  // 11 Strategies list
  { id: 'list-beginner', f: 11, page: 'strategies', q: 'Which strategy fits me as a beginner?', tpl: ['show_strategy_card'] },
  { id: 'list-deprecated', f: 11, page: 'strategies', q: 'Why is Hyperliquid deprecated but still 24% of the model portfolio?', tpl: [] },
  // 12, 13 Typed questions in the panel and on /wega
  { id: 'eth-drop', f: 13, page: 'wega', q: 'What happens to my portfolio if ETH drops 30%?', tpl: ['show_what_if'] },
  { id: 'eth-drop-de', f: 13, page: 'wega', member: 'alex-de', q: 'Was passiert mit meinem Portfolio, wenn ETH um 30% fällt?', tpl: ['show_what_if'] },
  { id: 'eth-vs-btc', f: 13, page: 'wega', q: 'How has ETH done compared to Bitcoin?', tpl: ['show_coin_chart'] },
  { id: 'exposure', f: 12, page: 'overview', q: 'Am I too dependent on one coin or protocol?', tpl: ['show_exposure'] },
  { id: 'exposure-nodata', f: 12, page: 'overview', member: 'sam', q: 'Am I too dependent on one coin or protocol?', tpl: null },
  { id: 'vs-model', f: 12, page: 'overview', q: 'How do I compare with the model portfolio?', tpl: ['show_vs_model_portfolio'] },
  { id: 'idle-usdc', f: 13, page: 'wega', q: 'I have USDC sitting idle. What could it earn on the platform?', tpl: ['show_stablecoin_earnings'] },
  { id: 'buy-eth', f: 13, page: 'wega', q: 'Should I buy more ETH now?', tpl: null },
  { id: 'peg', f: 12, page: 'depeg', q: 'Is jitoSOL holding its peg?', tpl: ['show_peg_chart'] },
  { id: 'liquidation', f: 12, page: 'overview', q: 'Am I close to being liquidated?', tpl: [] },
  { id: 'mix-nodata', f: 12, page: 'overview', member: 'sam', q: 'How risky is my mix?', tpl: null },
  { id: 'model-year-de', f: 13, page: 'wega', member: 'alex-de', q: 'Wie läuft das Musterportfolio dieses Jahr?', tpl: null },
  { id: 'password-de', f: 12, page: 'overview', member: 'alex-de', q: 'Ich habe mein Passwort vergessen. Wie setze ich es zurück?', tpl: [] },
  { id: 'approvals', f: 13, page: 'wega', q: 'Can you check my wallet approvals?', tpl: [] },
  // 14 Ask about this passage
  { id: 'passage-weight', f: 14, page: 'passage-variational', q: 'Why does that matter?', tpl: null },
  { id: 'passage-apr', f: 14, page: 'passage-apr', q: 'What does that mean in dollars for me?', tpl: [] },
  // 19 Guide me through entering
  { id: 'guide-start', f: 19, page: 'gmtrade', q: 'Guide me through entering, one step at a time.', tpl: [] },
  { id: 'guide-failed', f: 19, page: 'gmtrade-guide', q: 'The staking step failed. What now?', tpl: [] },
  // 20 What changed, and what should I copy?
  { id: 'changed', f: 20, page: 'overview', q: 'What changed since my last visit?', tpl: ['show_portfolio_changes'] },
  { id: 'changed-de', f: 20, page: 'overview', member: 'alex-de', q: 'Was hat sich seit meinem letzten Besuch geändert?', tpl: ['show_portfolio_changes'] },
  { id: 'changed-nodata', f: 20, page: 'overview', member: 'sam', q: 'What changed this week?', tpl: ['show_portfolio_changes'] },
  { id: 'copy', f: 20, page: 'track', q: 'What should I copy to match the model portfolio?', tpl: ['show_vs_model_portfolio', 'show_portfolio_changes'] },
  // 21 Live calls
  { id: 'call-blast', f: 21, page: 'calls', q: 'When did they talk about the Blast chain?', tpl: ['show_call_moment'] },
  { id: 'call-recap', f: 21, page: 'calls', q: 'What did the Oct 15 call cover?', tpl: null },
  { id: 'call-variational-de', f: 21, page: 'overview', member: 'alex-de', q: 'Was haben sie zuletzt über Variational gesagt?', tpl: null },
  // 22 News check
  { id: 'news', f: 22, page: 'research', q: "Does this week's news touch my positions?", tpl: [] },
  { id: 'news-nodata', f: 22, page: 'research', member: 'sam', q: "Does this week's news affect me?", tpl: [] },
];

// Follow-up chats: each turn sends the whole conversation so far.
export const CHATS = [
  {
    id: 'chat-gmtrade',
    page: 'gmtrade',
    turns: [
      'Guide me through entering, one step at a time.',
      "I bridged with Stargate, but the USDC isn't showing on Solana.",
      "Found it and claimed it. I'm on GMTrade now, what's next?",
      'The stake button gives me an error.',
    ],
  },
  {
    id: 'chat-changed',
    page: 'overview',
    turns: ['What changed in the model portfolio since my last visit?', 'Why did they cut Variational so much?', 'What would I need to change to match it?', 'Is Robinhood Lighter open for new entries?'],
  },
  {
    id: 'chat-lesson-de',
    page: 'lesson',
    member: 'alex-de',
    turns: ['Was ist Funding Rate Farming?', 'Und woher kommt das Geld dafür?', 'Welche Strategie auf der Plattform macht das?', 'Gib mir eine Übungsfrage.'],
  },
];

// Written once and shared by every member (lesson chips, weekly recap, news check, guide translation).
export const SHARED = [
  {
    id: 'chips-lesson',
    f: 2,
    what: 'Lesson chips for one lesson (D1), English and German',
    max_tokens: 6000,
    prompt: (P) =>
      `${P.lessonSource}\n\nWrite the four ready answers for this lesson's chips, first in English, then in German: "What is this part about?" (for the part at 4:10), "Summary so far", "Explain it more simply", "Practice question" (a multiple-choice question with 3 options, the answer and a one-line explanation). Each answer 80 words at most, plain words for members over 40. Return them as plain text with the chip name on its own line.`,
  },
  {
    id: 'recap-week',
    f: 20,
    what: 'What changed this week: one recap per snapshot, English and German',
    max_tokens: 4000,
    prompt: (P) =>
      `${P.changes}\n\nWrite the weekly recap members see under "What changed": what was added, closed and re-weighted, in plain words, 120 words at most, first in English, then in German. Only state what the data shows; don't explain reasons that aren't in the data.`,
  },
  {
    id: 'news-check',
    f: 22,
    what: 'News check: which protocols this week\'s report touches, English and German',
    max_tokens: 4000,
    prompt: (P) =>
      `${P.research}\n\nList which protocols, chains or coins of the model portfolio this report touches and how, in one line each, then one line on what doesn't concern members. 120 words at most, first in English, then in German. The app matches the list with each member's positions.`,
  },
  {
    id: 'guide-translation',
    f: 19,
    what: 'GMTrade guide in plain English, once per guide update',
    max_tokens: 4000,
    prompt: (P) => `${P.guide}\n\nRewrite this strategy guide in plain English for members over 40: the steps as a numbered list, each one short, keeping every fact, link name and code exactly. Then one line on the risks.`,
  },
];
