# Wega on Strategies, and ideas for the whole platform

Strategies is the core of Web3 Universe and the page is live, so Wega fits into the existing layout instead of changing it. Decade's lesson is that AI earns trust in finance when it does the math with your own numbers, explains instead of selling, and only interrupts when something needs you. Everything below follows that.

All amounts, positions and returns in the prototype are sample data.

## What the prototype adds to Strategies

The page keeps the Figma structure: header, model portfolio table and donut, filter row, card grid, single-scroll modal. Wega adds five things.

| Where | What Wega adds | Why |
|---|---|---|
| Above the model portfolio | **Since your last visit** strip: what the team changed (entry paused, weight raised, strategy closed), with "What it means for me" | Members come back weekly. The first question is "what changed and do I need to act?" |
| Card footer, next to difficulty | **Readiness**: "Ready" or "2 lessons to go", based on the lessons each strategy needs | Connects the Academy to the product. A member sees which strategies they're prepared for without leaving the page |
| Sort menu | **Best fit for you**: ready first, then the member's goal, then lower difficulty, with a note that it ranks fit and not expected return | A personal view of the same grid, never a recommendation to buy |
| Strategy modal, after "What it is" | **For you · Wega**: lessons still missing (one click to each), size at the model's max weight on the member's portfolio, and a what-if: a BTC move against both legs for hedged strategies, or yield over time for the others | Answers "can I do this, how much, and what happens if the market moves?" with the member's own numbers |
| Risks and live calls in the modal | A **For you** line under each risk, **Check my setup** (compares the member's open legs with the steps), **Notify me** when entries are paused, and the minute each live call discusses the strategy | Turns generic risk text into the member's exposure, and the hour-long call into the 2 minutes that matter |

Wega's panel on this page knows which strategy is open. Its chips change to "Explain it simply", "How much would I put in?", "What are the risks for me?" and "Check my setup".

### What it needs from the product

- **Lesson progress per member** (already exists for the Academy) and a mapping from each strategy to the lessons it needs. The content team owns the mapping.
- **Strategy change log**: status, weight and entry changes with a date, so "since your last visit" is generated, not written.
- **Read-only wallet connection** for "Check my setup" and sizing on the real portfolio. Without it, Wega uses the member's last snapshot from My Portfolio.
- **Live call transcripts with timestamps**, so Wega can find where a strategy is discussed.

## Ideas for the whole platform

1. **Snapshots that fill themselves.** My Portfolio's "Create Snapshot" asks members to type positions by hand. A read-only wallet connection fills it, and the member confirms. Every other idea gets better data from this one.
2. **Drift against the model portfolio.** Show the member's allocation next to the model's, and explain the gaps ("you hold no carry trades; the model holds 16%"). Explain, never instruct.
3. **Alerts only when action is needed.** Health Factor near liquidation, an LP out of range, entries reopening for a strategy the member follows, a strategy closed that the member holds. Nothing else.
4. **Disclose referral links.** Strategies use ref links (Variational, Extended). Wega labels them ("we earn a referral fee here") and never ranks by them. Decade's "no biased suggestions" is a trust feature, and members notice.
5. **One goal, remembered.** The member sets a goal once ("stablecoin yield while holding ETH"). The study plan, Best fit sort and Wega's answers all use it.
6. **Searchable live calls.** Transcripts with chapters, glossary terms linked, and "discussed at 14:32" links from strategies, lessons and Research.
7. **Track Record that explains itself.** Wega answers "why was September negative?" from the change log and positions, in two sentences.
8. **A human when it matters.** When Wega can't answer or the member is about to enter an Advanced strategy, offer to send the question to the next live call or a moderator in Community.
9. **A Wega widget for the Overview.** Not a new page: one widget in the existing widget library with the weekly brief (net worth change, what changed, the one thing worth doing).
10. **Glossary everywhere.** Terms in Strategies, Research and Events link to the Glossary entry and the lesson that teaches them.

## How to measure it

The PostHog plan covers this: [PostHog KPIs for Web3 Universe](https://claude.ai/code/artifact/342284ce-6fd5-4896-90d5-53f6d563ca14). For Strategies, track how many modal opens reach "How to enter", the share of Wega answers followed by an action (lesson opened, notify set, setup checked), and whether members who are "Ready" enter more often than members who aren't.

## Open questions

- The Figma modal's "What it is" for Perp DEX Airdrops stops mid-sentence ("…paid out very good airdrops in the past, and"). The prototype completes it; the content team should confirm the wording.
- Perp DEX Airdrops shows Mechanism "Looping" and Capital "$110.000" in Figma. Are these placeholders?
- Should "Best fit for you" go through a compliance check before launch? The copy says it ranks fit and is not advice.
- Who owns the strategy-to-lessons mapping: the content team or the strategy authors?
