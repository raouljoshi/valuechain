# Value Chain — Game Concept & Design Rationale

*A card game where you build coalitions of shared values across a divided world — and score most for the bridges nobody expected.*

> The name is a deliberate in-joke from the source conversation ("we'll attract the world's
> management consultants"). But it is also literally accurate: you build **chains** connected by
> shared **values**. Working title: **Value Chain**.

---

## 1. What this is

A digital card game built on top of a global values survey (the **World Values Survey**, see §3).
Every card is a **group of real people** — "Argentine army officers", "young urban Swedish women",
"Indian smallholder farmers", or the deliberately broad "women, worldwide". Each card carries that
group's actual stance across ~14 value dimensions (religion, abortion, gender equality, trust,
nationalism, …).

The core action is simple enough to teach in one sentence:

> **Lay down a card next to another card only where the two groups genuinely agree — and keep the
> chain going.**

The depth comes entirely from *which* agreement you choose to build on. Connecting two groups that
are alike, on something almost everyone believes, is easy and worth little. Connecting two groups
that agree on *almost nothing else* — an Argentine soldier and a Swedish preschool teacher, on a
question that splits the planet in half — is hard, rare, and worth a lot.

That single scoring asymmetry is the whole design thesis: **the game pays you to go looking for
common ground between people who look nothing alike.** Which is exactly the behaviour the project
wants to cultivate.

---

## 2. Design goals (in priority order)

1. **Engaging as a game first.** If it isn't fun without the mission, the mission never lands. It
   must have real tactics — the "should I play the safe long chain or the risky high-scoring bridge?"
   tension of Scrabble or Ticket to Ride.
2. **Honours the data.** Connections must be *true*. If the game says two groups agree, the
   underlying survey has to back it up. Synthetic data is fine for the prototype (§8) **as long as
   its structure mirrors real survey patterns** so the design is validated against realistic shapes.
3. **Fosters international understanding as a by-product of good play, not a lecture.** No quizzes,
   no "did you know". The understanding arrives as an *"huh, I didn't expect those two to line up"*
   moment — the mechanic and the message are the same act.
4. **Low complexity ceiling for the player, high complexity floor for the engine.** Chess is complex
   in play but trivial in rules. All statistical machinery (distributions, confidence intervals,
   similarity indices) stays hidden. The player sees flags, faces, a stance bar, and a score.

---

## 3. The source data, and how the game honours it

The transcript describes "millions of responses" with respondent metadata — gender, education level,
town size, income — and value questions like *importance of religion*, *nationalism*, *is divorce
okay*. That is the **World Values Survey (WVS)** and its sibling the **European Values Study**: ~120
countries, seven waves, nationally representative samples of 1,000+ per country, ~250 items in 14
thematic modules. ([WVS overview](https://en.wikipedia.org/wiki/Inglehart%E2%80%93Welzel_cultural_map_of_the_world))

Crucially, decades of WVS analysis collapse most cross-national variation onto **two axes**
(Inglehart–Welzel), which together explain >70% of the variance across **ten indicators**:

| Axis | Anchored by indicators |
|---|---|
| **Traditional ↔ Secular-rational** | importance of God, national pride, respect for authority, obedience vs. independence in children, abortion (rejected) |
| **Survival ↔ Self-expression** | economic security over self-expression, (un)happiness, homosexuality (rejected), never signed a petition, low interpersonal trust |

([Inglehart & Welzel, cultural map](http://piketty.pse.ens.fr/files/InglehartWelzel2011.pdf),
[Wikipedia](https://en.wikipedia.org/wiki/Inglehart%E2%80%93Welzel_cultural_map_of_the_world))

**Why this matters for the design:** the two-axis structure is a *gift* to a card game.

- It means groups cluster into recognizable cultural zones (Nordic, Latin American, African-Islamic,
  Confucian, Orthodox…), so a player can build intuition. Nordic groups sit secular +
  self-expression; African-Islamic groups sit traditional + survival; Latin America is the famous
  outlier (traditional *but* self-expressive).
- It means "surprising" is **mathematically definable**: two groups far apart on the map that
  nonetheless share a specific value = a rare bridge. We can compute a **similarity index** between
  any two cards up front (the transcript's exact instinct), and pay out inversely to it.
- It gives us honest, load-bearing dimensions to put on the cards. The prototype's 14 dimensions are
  a superset of these ten indicators plus a few gameplay-friendly extras (divorce, gender equality at
  work, immigration, environment, family importance).

**The "family is important" test (from the transcript).** Family importance is near-universally
endorsed worldwide — so connecting on it must score almost nothing. Abortion, homosexuality, and
religion split the planet — connecting on those must score big. The prototype encodes exactly this
as a per-dimension **polarization weight**, calibrated to real WVS spread. Honouring the data *is*
the scoring model.

**Metadata → cards.** WVS respondent metadata (country, gender, age band, education, town size,
income) is exactly enough to slice vivid groups. As the transcript notes, we take mild artistic
licence turning "urban high-income academic" into "the engineer" for flavour and art — but the value
vector underneath stays tied to the real slice.

---

## 4. The core loop (MVP — buildable now)

Modelled on dominoes/Rummikub simplicity, as the transcript proposes.

- Each card = a group with a hidden-until-relevant **value vector** (0–100 per dimension).
- **Hand:** you hold 7 cards. A face-up **market** shows 3 cards; there's a blind **draw pile**.
- **A turn:** play one card, *or* swap one card (discard → draw). Then refill to 7.
- **Playing a card:** attach it to either open end of an existing chain **only on a dimension where
  the two groups agree** (their stances are within a tolerance band), or start a **new chain**.
- **The one elegant constraint:** you may not connect on the *same dimension twice in a row* within a
  chain. A coalition held together by only one shared value is fragile; the rule forces you to
  traverse the value space. (Directly from the transcript.)
- **Scoring is banked immediately** on each link — "home safe" — so nothing can be retroactively
  stolen (see the multiplayer fork, §6).
- **Game end:** draw pile exhausted (or turn limit). Highest banked score wins. Then a **reflection
  screen** replays your best bridges on a world map.

### The scoring model (the heart)

Each link's score multiplies three honest signals plus an optional bonus:

```
linkScore = polarizationBase  ×  surpriseMultiplier  ×  nicheMultiplier   +  resonanceBonus

polarizationBase   how divided the world is on THIS dimension   (family ≈ low, abortion ≈ high)
surpriseMultiplier how far apart the two groups are OVERALL      (cultural distance → bridge bonus)
nicheMultiplier    how specific the two groups are              (a single persona > "all women")
resonanceBonus     a separate reward for a very TIGHT agreement between two niche groups
```

- **surpriseMultiplier** is the mission, expressed as math: bridging distant groups pays.
- **nicheMultiplier** implements the transcript's "niche > aggregated" intuition — broad groups
  ("all Americans") sit near the world mean, match easily, and pay little; a sharply-defined persona
  is extreme, hard to match, and pays more.
- **resonanceBonus** deliberately keeps the *opposite* strategy alive: two tightly-aligned niche
  groups (Argentine + American military on nationalism) form a "strong band" worth chasing too.

That last point resolves the central debate in the transcript ("do we reward strong bands or
improbable bands?") — **we reward both, via different terms, so two real strategies coexist:** go
long and safe (many easy links), or go short and spicy (few rare bridges). That is the Scrabble
"play XYLOPHONE or just play X" choice, and it's what gives the game legs.

---

## 5. Key design forks — analysis & recommendations

The transcript is full of genuine forks left open. Here is each one, the options, and a
recommendation with reasoning. **Bold = recommended.**

### Fork A — What is a card: persona or aggregate group?
- *Individual persona* (niche, extreme, vivid, high-scoring, hard to match).
- *Aggregate group* ("all women") — broad, near-mean, easy, low-scoring, but enables the "aggregate
  up a dimension for spice" twist the transcript liked.
- **→ Recommend: both, on one continuous "breadth" scale.** Every card has a breadth value; niche
  and broad are the two ends of the same axis, and breadth feeds the niche multiplier directly. No
  separate systems, maximum variety. Include a few deliberately huge cards ("women, worldwide") as
  low-risk connectors and comic relief.

### Fork B — Connection rule: binary or scaled?
- *Binary* yes/no agreement — too crude, everything is a coin flip.
- *Scaled* stance (e.g. 0–100) with a tolerance band; connect if within N.
- *Range overlap* using each group's full distribution / confidence interval.
- **→ Recommend: scaled means + tolerance band for the MVP**, with each group's internal **spread**
  (narrow for niche, wide for broad) exposed only as flavour ("this group is unusually united on
  this"). Range-overlap is the theoretically correct v2 — it naturally makes broad groups match more
  easily (wide range = more overlap) — but it's a statistical nicety the MVP can approximate with
  spread-as-tolerance. Ship scaled, design toward ranges.

### Fork C — Scoring philosophy: strong bands or surprising bridges?
- *Strong bands*: reward tight agreement between similar groups → predictable, cohesive.
- *Surprising bridges*: reward rare agreement between distant groups → serves the mission.
- **→ Recommend: surprising bridges as the headline, strong bands as a secondary bonus** (§4). This
  is the single most important recommendation: the surprise term is where the *international
  understanding* payload lives, so it must be the dominant scoring driver — but keeping a strong-band
  bonus preserves a second viable strategy and stops the game feeling one-note.

### Fork D — Coalition complexity: chain (agree-with-neighbour) or coalition (agree-with-all)?
- *Chain*: a new card need only agree with the card it touches. Simple, scalable, MVP-friendly.
- *Coalition*: a new card must agree with **every** card already in the group; scoring grows
  ~exponentially because cohesion gets exponentially harder. Thematic ("can this coalition actually
  hold together?") but heavier, and near-impossible to score by hand.
- **→ Recommend: ship the chain; design coalition as a toggle-on advanced mode.** The chain is the
  MVP. Coalition mode reuses the same cards and similarity engine, adds an exponential reward curve,
  and is the natural "expansion". Because it needs live recomputation against the whole set, it's
  digital-only — which is fine, this is a digital game. Keep it out of v1 to protect the complexity
  ceiling (Design goal 4).

### Fork E — Hand & turn economy.
- *Fixed hand, play-one-draw-one* — cleanest, always in motion.
- *Accumulate then dump a mega-play* — needs an anti-hoarding penalty (score penalty for cards left
  in hand at end).
- *Open market vs. blind draw* — a face-up river adds planning; pure blind draw adds swing.
- **→ Recommend: fixed hand of 7, play-or-swap each turn, with a 3-card face-up market + blind draw.**
  Gives a real tactical decision every turn (take the perfect market card vs. gamble on the pile)
  without hoarding degeneracy. This is the standard, proven, low-friction economy.

### Fork F — Board: personal chains or one shared board?
- *Personal chains* — parallel solitaire, low interaction.
- *Shared board, points banked on play* — my move changes your options; an unexpected card can wreck
  your planned bridge, forcing a replan. High interaction, no fiddly "steal" bookkeeping because
  points are already banked.
- **→ Recommend: shared board with immediate banking** for multiplayer. It delivers the transcript's
  "your actions affect my possibilities" without a destructive attack subsystem. (Solo mode is
  effectively a personal shared board — same rules, one player.)

### Fork G — Same dimension twice in a row.
- **→ Recommend: keep the ban.** It's one rule, it's thematic (fragile single-issue coalitions), and
  it forces value-space traversal so chains stay interesting. Cheap, high-value.

### Fork H — Persona determinism.
- **→ Recommend: deterministic for MVP.** Two "Indian farmer" cards have identical vectors. Variety
  comes from *different* slices (Indian farmer vs. Indian urban graduate), not from noise on the same
  slice. Add stochastic draws from the real distribution only if v2 needs more replay variance.

### Fork I — Branching chains.
- **→ Recommend: linear chains for MVP**, branching reserved for coalition mode. Branching multiplies
  UI and rules complexity for marginal early benefit.

---

## 6. Modes & roadmap

Three modes were floated; they form a clean release ladder.

1. **Solo (MVP, this prototype).** A satisfying single-player puzzle: maximize score from the deck.
   Provable, shippable, teaches the mechanic. Also the tutorial for everything else.
2. **Duel / online multiplayer (v2).** Shared board, banked points, the "an Argentine general just
   crashed my plan" interaction of Fork F. Optional light "break a chain" action as an advanced
   toggle.
3. **Global daily (v3 — the retention engine).** Á la the NYT / Dagens Nyheter daily puzzle: three
   shared **global cards** drop each day; everyone in the world plays the same hand; a **global
   leaderboard** ranks the longest / highest-scoring chains; a "where in the world is everyone
   building?" map closes the loop. This mode is both the strongest retention hook *and* the strongest
   expression of the mission — thousands of strangers, same cards, all hunting for common ground.

**Recommended sequencing:** nail Solo → prove the fun and the "aha" → Global daily next (cheap
async multiplayer, huge mission leverage) → synchronous Duel last (hardest to build, smallest reach).

---

## 7. Making it foster understanding (without preaching)

Research on serious games for empathy is consistent: change comes from **perspective-taking** and
**dismantling stereotypes through unexpected commonality**, not from information delivery
([Far From Home study](https://pmc.ncbi.nlm.nih.gov/articles/PMC12190043/),
[cross-cultural game design](https://minifiniti.com/blogs/game-talk/games-teach-cross-cultural-communication/)).
Value Chain is aligned by construction — the scoring *is* a perspective-taking incentive — but four
deliberate touches sharpen it:

- **The reveal on every bridge.** When you connect two distant groups, the game states the shared
  ground plainly: *"Both ~72/100 on protecting the environment. On almost everything else, these two
  groups disagree."* That sentence is the entire pedagogy, delivered as a reward.
- **End-of-round reflection.** Your best bridges replay on a world map — the takeaway is *"look at
  the unlikely alliances you found,"* not a score alone.
- **Honest polarization.** The game never pretends everyone secretly agrees. High scores require
  connecting on genuinely divisive questions — you feel the real fault lines *and* the real overlaps.
- **Anti-stereotype guardrails** (§9): the transcript worries about "crazy stereotypes"; the design
  answers by always grounding a persona in visible data and using the *surprise* to break the
  stereotype the art might imply.

---

## 8. Data strategy — synthetic now, real later

The prototype ships with **synthetic data whose structure mirrors the WVS**, so every design decision
is tested against realistic shapes:

- **8 cultural zones** with base value vectors placed per the Inglehart–Welzel map (Nordic, Anglo,
  Latin American, Catholic Europe, Orthodox/Ex-Soviet, African-Islamic, Confucian, South Asian).
- **Demographic modifiers** (young-urban-graduate, older-rural, military, women, business, care-work,
  farming) applied as deltas — the real WVS metadata axes.
- **14 dimensions**, a superset of the 10 Inglehart–Welzel indicators plus divorce, gender-at-work,
  immigration, environment, family importance — each with a polarization weight calibrated to how
  divided the world actually is on it (family low; abortion/homosexuality/religion high).
- **Personas** = zone + modifiers + flavour label + a breadth value, with vectors computed by the
  same engine real data would feed.

**Swapping in real data** is then a data-layer change, not a redesign: replace the computed vectors
with WVS group means, replace the spreads with real standard deviations, replace the polarization
weights with measured global variance per item. The engine, scoring, and UI are unchanged. The
synthetic layer is explicitly labelled in the code so it can't be mistaken for real findings.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Stereotyping** ("crazy stereotypes", per the transcript) | Every persona is grounded in a visible stance profile; the game's *point* is the surprising connection that breaks the stereotype; art stays archetypal-not-caricature; avoid slurs/loaded imagery; label groups as "a typical respondent from …", never "all X are …". |
| **Misrepresenting the data** | Synthetic data is labelled as such in-code and in-UI; real-data mode must cite wave/year; connections are only claimed where the distribution supports them. |
| **Reducing people to a number** | Show spread, not just a mean ("this group is *divided* on this"); the reflection screen emphasizes shared humanity, not ranking cultures. |
| **Complexity creep** | Hard MVP scope line (Forks D, I deferred); stats never surfaced to the player (Design goal 4). |
| **One-note strategy** | Dual scoring paths (surprise vs. resonance, Fork C) keep both "long safe" and "short spicy" viable. |

---

## 10. What the prototype demonstrates

`index.html` is a self-contained, playable **Solo** prototype (open it in any browser — no build, no
server). It implements: the 14 WVS-grounded dimensions, ~30 persona cards across 8 cultural zones,
the scaled-agreement connection rule, the no-repeat-dimension constraint, the full three-factor
scoring with transparent breakdowns, the "bridge reveal", multiple chains on a shared board, the
market/draw economy, and an end-of-round reflection. It is the concrete answer to *"could you build
an MVP tomorrow?"* — yes, and here it is.

Everything in §5 that was deferred (coalition mode, duel, global daily) is left as clearly-marked
extension points rather than half-built.
