# Wega benchmark

Measures what Wega's AI answers cost, how fast they come and whether they keep Wega's rules, for every AI feature in the Wega scope. It sends real platform questions to Claude under several setups. It runs on its own and does not touch the app.

## Run it

```bash
cd scripts/wega-benchmark
npm install
# put the platform data in data/ first (see data/README.md)
node run.mjs --dry-run                     # what a run will cost, using the free token counter
WEGA_API_KEY=sk-ant-... node run.mjs       # the full run, stops at --cap dollars (default 4.25)
```

`ANTHROPIC_API_KEY` works too. In a Claude Code cloud session that name is reserved, so use `WEGA_API_KEY` there, and add `NODE_USE_ENV_PROXY=1` so Node goes through the session's proxy.

Options:

- `--phases single,chats,shared,deep,repeat,judge` runs only some phases
- `--setups sonnet-low,haiku-low` runs only some setups; `--only eth-drop,news` only some questions
- `--cap 2` stops spending at $2; `--resume results/<time>` continues a stopped run without paying twice
- `node standin.mjs` writes the stand-in lesson transcript (under $0.01)

## What it runs

| Phase | What it measures |
| --- | --- |
| `single` | 52 questions, one per AI feature of the scope (lesson chat, quiz, strategies, panel, /wega, what changed, live calls, news), in English and German, for a member with wallet data and one without |
| `chats` | 3 follow-up chats of 4 turns, to see what the growing history costs, with and without caching it |
| `shared` | Content written once for every member: lesson chips, the weekly "what changed" recap, the news check, a strategy guide in plain English |
| `deep` | Opus 5.5, Sonnet at medium effort and "template in one request" on the 17 hardest questions |
| `repeat` | 8 questions again, to show how much the same question varies |
| `judge` | Sonnet 5.5 grades every answer to a question side by side, without knowing the setup: a 1 to 5 score and flags for made-up data, advice and quiz answers given away |

Every answer also gets automatic checks: word limit, cut off, the right template, language, quiz answer leaked.

## Setups

| Setup | What it is |
| --- | --- |
| `today` | The prototype's `/api/wega` as it is: Sonnet 5.5 at its default effort (high), `max_tokens` 700, no caching, no templates, everything in one system prompt |
| `haiku-low`, `haiku-medium` | Claude Haiku 5.5 at low or medium effort, with templates and caching |
| `sonnet-low`, `sonnet-medium` | Claude Sonnet 5.5, same |
| `opus-low` | Claude Opus 5.5, same |
| `sonnet-low-oneround` | Sonnet low, but Wega writes the answer first and calls the template last, so the app needs one request instead of two |
| `sonnet-low-nohistorycache` | Chats only: Sonnet low without caching the conversation so far |

## How a request is built

1. Templates (11 tools), rules and platform data (model portfolio, changes, strategies, Academy, prices, calls, research): the same for every member, cached. About 7,200 tokens.
2. The member: progress, badges, wallet balances. About 500 tokens.
3. The page and the question. From 40 tokens (Overview) to 2,500 (the full research report) or 7,400 (a lesson transcript).

Templates are the app's own: Wega only picks one (`show_strategy_card`, `show_portfolio_changes`, `show_call_moment`, `show_peg_chart`, `show_coin_chart`, `show_what_if`, `show_exposure`, `show_vs_model_portfolio`, `show_stablecoin_earnings`, `show_learning_path`, `link_lesson`). A template call is answered with "shown" and Wega finishes its answer, as the app would.

## Files

- `prompt.mjs`: rules, platform data, test members, pages and templates
- `cases.mjs`: the questions, chats and shared jobs, each tied to its feature number in the scope
- `run.mjs`: the runner, checks, judge and reports
- `results/<time>/`: `summary.md` (the tables), `answers.md` (every answer with its cost and grade), `results.csv` and `rows.jsonl` (one row per call), `judge.json`, `summary.json`

Prices in `run.mjs` are Anthropic list prices as of October 2026; check them before deciding.
