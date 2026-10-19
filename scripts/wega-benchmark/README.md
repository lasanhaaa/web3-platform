# Wega benchmark

Measures what Wega's live answers really cost and how fast they are, by sending 20 typical member questions to Claude under several setups. It runs on its own and does not touch the app.

## Run it

```bash
cd scripts/wega-benchmark
npm install
node run.mjs --dry-run                       # what a run will cost, no API calls
ANTHROPIC_API_KEY=sk-ant-... node run.mjs    # the full run, under $2
```

Options: `--setups sonnet-low,haiku-low` runs only some setups, `--only hf-mine,eth-drop` only some questions, `--repeat 3` asks each question 3 times for steadier numbers.

Results land in `results/<time>/`:

- `summary.md`: cost per answer, tokens, speed and monthly cost per setup
- `answers.md`: every answer side by side, to judge whether a cheaper setup is still good enough
- `results.csv`: one row per answer

## Setups

| Setup | What it tests |
| --- | --- |
| `today` | The prototype's `/api/wega` as it is: Sonnet 5.5 at its default effort, `max_tokens` 700, no caching, no chart tools |
| `haiku-low` | Claude Haiku 5.5, effort low, chart templates as tools, prompt caching |
| `sonnet-low` | Claude Sonnet 5.5, same setup (the recommended default) |
| `opus-low` | Claude Opus 5.5, same setup |
| `sonnet-draws-charts` | Sonnet 5.5 asked to draw the chart itself as SVG, only on the 6 chart questions |

## What it assumes

- The member's data (rules, portfolio snapshot, model portfolio, strategies, coin prices) is the system prompt and is cached. The page or lesson the member is on goes with the question.
- Charts are the app's own templates (`show_coin_chart`, `show_scenario`, `show_exposure`, `link_lesson`). Claude only picks one; a tool call is answered with "shown" and Claude finishes its answer, as the app would.
- Prices in `run.mjs` are Anthropic list prices as of October 2026. Check them before deciding.
- Questions and member data live in `questions.mjs`. Swap in real member questions once there are some.
