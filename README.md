# Web3 Universe platform prototype

A navigable prototype of the Web3 Universe platform: the Academy (routes, zones, lessons, quizzes), Badges & Certificates with the original badgeweb3 3D badges, Strategies, and Wega, the AI copilot on every page. All portfolio numbers, returns and quiz questions are sample data.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The sidebar's "Prototype · State" picker switches between demo progress states (new member, Academy quiz open, midway through Route 1, last quiz open).

## Wega's live answers

Prompt chips always use scripted answers. Free questions typed into Wega go to Claude when a key is set:

```bash
ANTHROPIC_API_KEY=... npm run dev
# optional: WEGA_MODEL=claude-sonnet-5-5
```

Without a key, Wega shows "Sample mode" and answers free questions with the closest scripted answer.

## Pages

| URL | Screen |
|---|---|
| `/academy` | Academy home: progress, study plan, daily review |
| `/academy/choose` | Choose a route after the Academy |
| `/academy/[route]/[zone]` | A route's zone with its lessons |
| `/academy/[route]/[zone]/[lesson]` | Lesson player with chapters, quick check and Wega notes |
| `/academy/[route]/[zone]/quiz` | Zone quiz (5 question types, 3 lives) |
| `/badges` | Badges & Certificates |
| `/strategies` | Strategies; `?s=<id>` opens a strategy |

## Where things are

- `src/app`: routes. Every Academy URL is prerendered with `generateStaticParams`.
- `src/components`: one folder per area (academy, lesson, quiz, badges, strategies, wega, shell).
- `src/lib`: course data, quiz bank, sample portfolio, progress store, Wega's scripted brain (`wega-brain.tsx`, `wega-strategies.tsx`).
- `src/styles`: global CSS. `00-design-system.css` is a copy of the platform design system tokens; don't edit it here.
- `public/w3u-badges.js` and `public/renders`: the original badgeweb3 engine and badge renders.
- `docs/platform-ideas.md`: what Wega adds to Strategies and ideas for the whole platform.
