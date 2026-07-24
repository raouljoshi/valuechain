# Value Chain

A card game where you build coalitions of shared values across a divided world — and score most
for the bridges nobody expected. Built on the structure of the **World Values Survey**.

Every card is a group of real people ("Argentine army officers", "Swedish preschool teachers",
"women, worldwide"). You connect two cards only where the groups genuinely agree, and the game pays
you most for finding common ground between people who agree on almost nothing else. The mechanic
*is* the message.

## Files

| File | What it is |
|---|---|
| **[DESIGN.md](DESIGN.md)** | The concept: source-data analysis, research, scoring model, and recommendations on every key design fork. Start here. |
| **[index.html](index.html)** | A self-contained, playable **Solo** prototype. No build, no server. |

## Run the prototype

Just open the file in any browser:

```bash
open index.html
```

Then: read the one-screen "How to play", select a hand card, and either start a new chain or click a
glowing **connect** slot. When two groups share several values, you choose *which* one to bridge on —
that's the whole game.

## Status

This is a concept + MVP prototype. Data is **synthetic** but structured to mirror real WVS patterns
(see [DESIGN.md §8](DESIGN.md)); swapping in real survey data is a data-layer change, not a redesign.
Deferred-but-designed features (coalition mode, online duel, the global daily puzzle) are documented
as extension points, not half-built.
