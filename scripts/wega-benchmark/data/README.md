# Benchmark data

The benchmark reads members-only platform content from this folder. It is not committed, because the repository is
public and the content is part of what members pay for. Copy it from the project's shared folder
(`wega-benchmark/data/`) or from the live platform (app.web3universe.de, signed in), one plain-text file each:

| File | What it holds | Where it comes from |
| --- | --- | --- |
| `track-record.txt` | Model portfolio total, two weekly snapshots (Protocol, Strategy, Holdings, Weight, Farm return tables) and the strategy statuses | Track Record and Strategies pages |
| `strategy-gmtrade.txt`, `strategy-variational.txt`, `strategy-hyperliquid.txt` | The full strategy modal text, in German as published | Strategies, one modal each |
| `research-week41.txt` | One weekly briefing, full text | Research |
| `live-calls.txt` | The live call feed with titles, lengths and chapter timestamps | Live calls |
| `lesson-frf-transcript.txt` | A stand-in transcript for the lesson "Funding rate farming basics", only to measure what a transcript adds to the cost. Made by `node standin.mjs` | Generated |

Another folder works too: `WEGA_DATA=/path/to/folder node run.mjs`.
