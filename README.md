# Web3 Universe platform prototype

A navigable prototype of the Web3 Universe platform: the Academy (routes, zones, lessons, quizzes), Badges & Certificates with the original badgeweb3 3D badges, Strategies, and Wega, the AI copilot (the "Ask wega" button at the top right of every page, its side panel and the Wega page). All portfolio numbers, returns and quiz questions are sample data.

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

## Deploy

The repo is connected to Vercel: every push to a branch gets a preview link, and `main` is production. Set `ANTHROPIC_API_KEY` (and optionally `WEGA_MODEL`) in the Vercel project's environment variables for Wega's live answers.

## Pages

| URL | Screen |
|---|---|
| `/academy` | Academy home: the current course as one big card, the other courses below |
| `/academy/choose` | Choose a route after the Academy |
| `/academy/[route]/[zone]` | A course: its zones as a vertical timeline of lessons and quizzes |
| `/academy/[route]/[zone]/[lesson]` | Lesson, laid out like Coursera's video page: the course's lessons on the left (Hide menu), the video with full screen, then Transcript (sample), Notes (saved with the video time, in this browser) and Strategies that build on the lesson. "Ask wega" opens Wega as a column on the right and folds the lessons menu; on phones Wega is a sheet |
| `/academy/[route]/[zone]/quiz` | Zone quiz (5 question types, 3 lives) |
| `/badges` | Certificates first, then all badges (earned, locked and what's missing) |
| `/strategies` | Strategies; `?s=<id>` opens a strategy |
| `/wega` | Wega as a chat: a hub with topics and recent chats, answers with charts from the sample portfolio |

## Where things are

- `src/app`: routes. Every Academy URL is prerendered with `generateStaticParams`.
- `src/components`: one folder per area (academy, lesson, quiz, badges, strategies, wega for the button and side panel, wega-page for the Wega page, shell).
- `src/lib`: course data, quiz bank, sample portfolio, progress store, Wega's scripted brain (`wega-brain.tsx`, `wega-strategies.tsx`, `wega-page.ts`). Progress and Wega chats are kept in the browser (localStorage); there is no backend besides `/api/wega`.
- `src/styles`: global CSS. `00-design-system.css` is a copy of the platform design system tokens; don't edit it here.
- `public/w3u-badges.js` and `public/renders`: the original badgeweb3 engine and badge renders.
- `docs/platform-ideas.md`: what Wega adds to Strategies and ideas for the whole platform.
