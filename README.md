# Value Chain

A card game where you build coalitions of shared values across a divided world — and score most
for the bridges nobody expected. Built on the structure of the **World Values Survey**.

Every card is a person — *Ananya, 24, a software developer in Bengaluru*; *Hassan, 60, a farmer in
rural Sohag*. You connect two cards only where those people genuinely agree, and the game pays you
most for finding common ground between people who agree on almost nothing else. The mechanic *is*
the message.

Built for **ages 10 and up**: whole-number scores, answers in plain words, a five-step tutorial.

**A chain is worth its links × how many parts of the world it spans, and every chain has only 6
seats.** You will see far more people than you have room for, so the game is really about who you
turn away. The way to win is to fill each chain with people from as many different worlds as you can
— a broad coalition scores double a narrow one. The strategy *is* the message.

> Most countries appear two or three times in the deck, with genuinely different values — so the deck
> itself teaches that a country is not one thing. See [DESIGN.md §10.1](DESIGN.md).

## Files

| File | What it is |
|---|---|
| **[DESIGN.md](DESIGN.md)** | The concept: source-data analysis, research, scoring model, and recommendations on every key design fork. Start here. |
| **[index.html](index.html)** | A self-contained, playable **solo** prototype. No build, no server. |
| **[multiplayer/](multiplayer/README.md)** | **Play with friends** over the internet — Cloudflare Workers + Durable Objects. Shared chains, individual scores. |

## Run the prototype

Just open the file in any browser:

```bash
open index.html
```

Then: follow the five-step tutorial, tap a person in your cards, and either start a new chain or tap
a glowing **they agree!** slot. When two people share several answers, you choose *which* one to
connect on — that's the whole game.

There are two modes: **Free play** (random deck) and **Today's deck** (seeded by date, so everyone
gets the same cards on the same day).

## Look, feel, and what it's built on

Visual identity is **risograph zine** — flat spot inks, halftone, thick keylines, deliberate print
misregistration, condensed poster type. Deliberately not the dark-navy-plus-one-teal-accent look the
earlier build had.

It is built on **plain DOM + Web Animations API + WebAudio**, not a game engine. That's a considered
call, not laziness: Phaser and Pixi render text as canvas textures, and these cards are text-dense,
which would cost crisp type, screen-reader access and cheap translation — the last mattering a lot
for a game about international understanding. Canvas is used for exactly one thing, the particle
system, because that's the one thing it's better at. **boardgame.io** (MIT) is the recommended engine
for the multiplayer layer when that lands. Full reasoning in [DESIGN.md §11](DESIGN.md).

Sound is synthesized at runtime, so there are no audio assets and no external requests — the whole
game is one file.

## Status

Concept + working prototype, verified in-browser. Data is **synthetic** but structured to mirror real
WVS patterns (see [DESIGN.md §8](DESIGN.md)); swapping in real survey data is a data-layer change,
not a redesign.

Deliberately *not* built: the global leaderboard (needs a backend — a fake one would be dishonest),
coalition mode, and online duel. These are documented as extension points in
[DESIGN.md §6](DESIGN.md), not half-built.

The most valuable next step is playtesting with actual 10-year-olds — no amount of analysis
substitutes for it.
