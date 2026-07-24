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

Each link's score **adds four small whole numbers** — no multiplication, no decimals, so a
10-year-old can verify the total in their head and learn the strategy from the breakdown:

```
linkScore = topic + differentLives + specificPeople + perfectMatch      (max ≈ 21)

topic           1–6   how divided the world is on THIS question (family = 1, same-sex couples = 6)
differentLives  0–11  how far apart these two people are overall  ← the mission, as math
specificPeople  0–2   how sharply defined they are ("all women" scores nothing here)
perfectMatch    0–2   a bonus for near-identical answers between two specific people
```

The reveal shows exactly this: `topic +1 · different lives +11 · specific people +2`.

**Why `differentLives` dominates.** It is deliberately the largest term. It means the game's biggest
rewards are only reachable by connecting people who look nothing alike — the behaviour the whole
project exists to encourage. `perfectMatch` keeps the transcript's "strong bond" strategy alive as a
smaller, secondary path (Fork C).

This resolves the central debate in the transcript ("do we reward strong bands or improbable
bands?") — **we reward both, via different terms, so two real strategies coexist:** go long and safe
(many easy links), or go short and spicy (few rare bridges). That is the Scrabble "play XYLOPHONE or
just play X" choice, and it's what gives the game legs.

### The connection rule, and one counter-intuitive fix

Two people connect on a question when their answers fall within a **tolerance band**. The band is not
fixed — **it widens the more different the two people are.**

That sounds backwards, so here is why it is right. With a fixed band, the prototype measured this:

| How different | Could connect at all | Avg shared values |
|---|---|---|
| Very similar | 100% | 11.2 |
| Bridge range | 33% | 1.3 |
| Most different | **0%** | 0 |

The highest-scoring, most mission-critical connections in the game were **literally impossible** —
the top bonus was unreachable dead code, while near-identical people had eleven easy options. Scaling
the band with distance fixes both ends at once: every pair is now reachable, shared values fall
smoothly from ~10 (similar) to ~1 (most different), and the average best score climbs monotonically
from 8 to 14. Rare connections stay rare and precious; they just stop being impossible.

It is also the more honest model. Two people whose lives share almost nothing but who both land
"roughly agree" on one question *have* found real common ground, and the game should say so.

**The moment this produces.** Hassan (60, farms in rural Sohag, Egypt) and Sanne (25, runs a café in
Amsterdam) are the most different pair in the deck. They share exactly one thing: *"Family comes
first."* That question is worth 1 point on its own — nearly everyone on Earth agrees with it — but
bridging that gulf makes it a **+14**, the most valuable link in the game. No one scripted that; it
fell out of the model. It is also, precisely, the point the game exists to make.

---

## 5. Key design forks — analysis & recommendations

The transcript is full of genuine forks left open. Here is each one, the options, and the reasoning.

> **Status: all forks below are now DECIDED and built.** The recommended option in each case is
> implemented in the prototype; Forks D, F and I are deliberately deferred to later versions as
> described. Fork B was additionally revised during balance testing — see §4, "one counter-intuitive
> fix".

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

1. **Solo (built).** A satisfying single-player puzzle: maximize score from the deck. Provable,
   shippable, teaches the mechanic. Also the tutorial for everything else.
2. **Today's deck (built, client-side).** The daily puzzle's foundation: the deck is shuffled from a
   date seed, so **everyone in the world gets the same cards today**, and your best score for the day
   is kept. What is deliberately *not* built is the server half — no global leaderboard is shown,
   because a fake one would be dishonest. Adding it is a backend task, not a design question.
3. **Global daily, full version (next — the retention engine).** À la the NYT daily puzzle: the
   shared deck plus a **global leaderboard** and a "where in the world is everyone building?" map.
   This is both the strongest retention hook *and* the strongest expression of the mission —
   thousands of strangers, same cards, all hunting for common ground.
4. **Duel / online multiplayer (last).** Shared board, banked points, the "an Argentine officer just
   crashed my plan" interaction of Fork F.

**Sequencing rationale:** Solo proves the fun and the "aha" → Global daily next (cheap async
multiplayer, huge mission leverage) → synchronous Duel last (hardest to build, smallest reach).

---

## 7. Making it foster understanding (without preaching)

Research on serious games for empathy is consistent: change comes from **perspective-taking** and
**dismantling stereotypes through unexpected commonality**, not from information delivery
([Far From Home study](https://pmc.ncbi.nlm.nih.gov/articles/PMC12190043/),
[cross-cultural game design](https://minifiniti.com/blogs/game-talk/games-teach-cross-cultural-communication/)).
Value Chain is aligned by construction — the scoring *is* a perspective-taking incentive — but four
deliberate touches sharpen it:

- **The reveal on every bridge.** When you connect two distant people, the game states the shared
  ground plainly: *"Hassan and Sanne both say YES. These two live very different lives and disagree
  about almost everything else — but here they think the same."* That sentence is the entire
  pedagogy, delivered as a reward rather than a lesson.
- **End-of-round reflection.** Your best bridges are replayed with each person's job and home
  restated — the takeaway is *"look at the surprising matches you found,"* not a score alone.
- **Honest polarization.** The game never pretends everyone secretly agrees. Most pairs disagree
  about most things, and you see that; high scores require finding the narrow, real overlap.
- **The deck teaches by structure** (§10.1): because most countries appear several times with
  different values, a player cannot form the belief that a country has *a* view. This is the
  guardrail the transcript asked for, made structural instead of cosmetic.

---

## 8. Data strategy — synthetic now, real later

The prototype ships with **synthetic data whose structure mirrors the WVS**, so every design decision
is tested against realistic shapes:

- **8 cultural zones** with base value vectors placed per the Inglehart–Welzel map (Northern Europe,
  English-speaking, Latin America, Southern Europe, Eastern Europe, Africa & Middle East, East Asia,
  South Asia).
- **Life-situation modifiers** (young-urban-graduate, older-rural, military, women, business,
  care-work, farming, student, urban) applied as deltas — the real WVS metadata axes.
- **14 questions** (§10.3), each weighted by how divided the world actually is on it — *family comes
  first* scores 1, *same-sex couples should be accepted* scores 6.
- **People** = zone + modifiers + name/age/place/job + a breadth value, with vectors computed by the
  same engine real data would feed. Most countries appear 2–3 times with different modifiers, which
  is what produces genuine within-country disagreement (§10.1).

**Swapping in real data** is then a data-layer change, not a redesign: replace the computed vectors
with WVS group means, replace the spreads with real standard deviations, replace the polarization
weights with measured global variance per item. The engine, scoring, and UI are unchanged. The
synthetic layer is explicitly labelled in the code so it can't be mistaken for real findings.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Stereotyping** ("crazy stereotypes", per the transcript) | The full policy in §10.1: named individuals rather than national archetypes; **most countries appear 2–3 times with different values** so the deck structurally refutes "a country is one thing"; work-based icons, never national clichés; ordinary jobs; no card speaks for a group. |
| **Misrepresenting the data** | Synthetic data labelled as such in-code and on every card panel; real-data mode must cite wave/year; connections are only claimed where the distribution supports them. |
| **Reducing people to a number** | Answers read as YES / NO / NOT SURE in full sentences, with numbers behind a toggle; the results screen restates each person's home and job, and emphasizes shared humanity rather than ranking cultures. |
| **Sensitive topics for a young audience** | Age-appropriate item set (§10.3); neutral, non-judgmental wording; no imagery attached to contested questions. A restorable adult/classroom mode keeps research fidelity available. |
| **Complexity creep** | Hard MVP scope line (Forks D, I deferred); stats never surfaced to the player (Design goal 4). |
| **One-note strategy** | Dual scoring paths (surprise vs. resonance, Fork C) keep both "long safe" and "short spicy" viable. |

---

## 10. Designing for ages 10+ — and against stereotype

Two constraints drove a significant revision: the audience is **10 and up**, and the transcript's own
worry that personas must not become "crazy stereotypes". They turn out to pull in the same direction.

### 10.1 The anti-stereotype persona policy

The first draft of the deck was exactly what the transcript feared: *Italian Nonna 🍝*, *Japanese
Salaryman*, *British Pensioner 🫖*, *Mexican Shop Owner 🌮*. Those are national mascots. A card
called "Italian Nonna" teaches a player that Italy **is** a nonna. Every one was cut. The rules now:

1. **A card is a person, not a nationality.** Every card has a first name, an age, a place and a job:
   *"Ananya, 24 · Bengaluru, India · software developer"*. You cannot reduce that to a costume.
2. **Most countries appear two or three times, with genuinely different values.** This is the single
   strongest anti-stereotype device available, because it is structural rather than cosmetic — the
   deck itself refutes "a country is one thing." India is Ananya (24, Bengaluru, software developer),
   Rajesh (58, rural Bihar, rice farmer) *and* Meera (41, Pune, teacher). Measured in the prototype,
   same-country pairs sit 10–28 apart on the same distance scale that tops out at 67 — real internal
   disagreement, not a reskin. A player who connects Rajesh to a Swedish farmer while Ananya sits
   unconnected has learned something no caption could teach.
3. **Icons describe work, never nationality.** A stethoscope, a wrench, a laptop. No food, no dress,
   no national cliché. The flag stays, because where someone lives is a fact about them.
4. **No card claims to speak for a group.** The card is one person; the panel says outright that they
   are made up but built from how real people with that age, home and job answered.
5. **Occupations are ordinary, not exotic.** Bus driver, nurse, factory technician, shop assistant,
   truck driver — the jobs most people actually have.

### 10.2 What "ages 10+" changed

- **Plain language everywhere.** "Polarization × surprise × niche" became `topic · different lives ·
  specific people`. "Cultural distance 66" became *"these two live very different lives."*
- **Whole-number, additive scoring** (§4) so the maths is legible and teaches strategy by being read.
- **Answers as words, not numbers.** Cards and panels say **YES / NO / NOT SURE**, with the 0–100
  detail available behind a "See all 14 answers" toggle rather than as a wall of bars.
- **The panel leads with meaning:** *They say YES to…* / *They say NO to…*, in full sentences.
- **A five-step illustrated tutorial** replaced a wall of text; a persistent coach line names the next
  action in one sentence and adapts to game state (including the dead-end case).
- **No duplicate cards.** Two identical people side by side reads as a bug to a child. Each game
  deals 32 unique people from a pool of 40, which also improves replayability.
- **Bigger type, 44px minimum touch targets, visible focus rings.**

### 10.3 Age-appropriate question set — a deliberate trade

The ten Inglehart–Welzel indicators include **abortion**, and the most polarizing WVS items are
mostly adult-facing. For a 10+ audience the set was adjusted: abortion is **out**; divorce,
acceptance of same-sex couples and importance of religion **stay** (they carry the polarization the
scoring needs, and are handled in neutral language); and accessible, genuinely divisive items were
added — *"children should always obey their parents"*, *"people moving here from other countries make
it better"*, *"we should help people in other countries"*.

This is a real trade and worth stating plainly: it costs some fidelity to the canonical ten-indicator
model in exchange for a game a 10-year-old can play at a kitchen table. A **classroom/adult mode**
that restores the full WVS item set is the obvious toggle, and nothing in the engine prevents it —
the dimension list is data.

---

## 11. What the prototype demonstrates

`index.html` is a self-contained, playable prototype (open it in any browser — no build, no server).
It implements the 14 WVS-grounded questions, **40 named people across 8 cultural zones** (32 dealt
per game, no duplicates), the distance-scaled agreement rule, the no-repeat-question constraint, the
four-part additive scoring with plain-language breakdowns, the bridge reveal, multiple chains, the
market/draw economy, the date-seeded "Today's deck", and an end-of-round reflection. It is the
concrete answer to *"could you build an MVP tomorrow?"* — yes, and here it is.

**Verified in-browser, not just written:** full turn loop (select → place → choose question → score →
refill); no console errors; daily mode deterministic and distinct from free play; zero duplicate
cards; and the balance sweep over all 780 possible pairings reported in §4, which is what caught the
unreachable-bridge defect.

Deferred items (coalition mode, duel, the leaderboard half of the global daily) are clearly-marked
extension points rather than half-built features.

### Known gaps / next tuning passes

- **Within-country spread is modest for some countries** (Nigeria's two people sit ~14 apart vs.
  Brazil's ~28). Realistic — the zone effect genuinely dominates demographics in the WVS — but the
  anti-stereotype payload is strongest where the gap is widest, so it is worth revisiting with real
  data.
- **No art.** Cards are typographic; illustration is the obvious next step and carries real
  stereotype risk, so §10.1's rules should bind the illustrator too.
- **Game length is untuned.** 32 cards is a guess; needs playtesting with actual 10-year-olds, which
  is the single most valuable next activity and cannot be substituted with analysis.
