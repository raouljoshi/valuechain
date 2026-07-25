# Value Chain — multiplayer

Play with friends over the internet. **The chains are shared; the points are yours.**

Built on Cloudflare Workers + Durable Objects. One Durable Object per room code holds the
authoritative game state and fans out moves over hibernating WebSockets, so an idle room (friends
who wandered off mid-game) costs essentially nothing.

## Deploy it to your own account

You need a Cloudflare account. Durable Objects with the SQLite backend — which is what this uses —
are available on the **free plan**.

```bash
cd multiplayer && npm install
```

Log in (opens a browser; this is the only step that touches your account):

```bash
npx wrangler login
```

Then deploy:

```bash
npx wrangler deploy
```

Wrangler prints a `https://value-chain.<your-subdomain>.workers.dev` URL. That link is the game —
send it to friends. To run it locally first:

```bash
npx wrangler dev
```

> I can't deploy this for you: it needs your Cloudflare credentials, and you should be the one
> holding those. Everything above is the whole procedure.

## How multiplayer differs from solo

| | Solo | Multiplayer |
|---|---|---|
| Chains | yours | **shared by everyone** |
| Points | one score | **one score per player**, banked the moment you play |
| Chain multiplier | your chain's regions | **a commons** — it pays whoever plays into it next |
| Chains available | 3 | `players + 2`, capped at 6 |
| Seats per chain | 6 | 6 |

**The interesting bit.** A link is worth `its base points × the number of world regions the chain
spans`. Because chains are shared, widening one raises the payout for *everyone who plays after
you* — including the people you're trying to beat. So there's a real dilemma: build the commons, or
free-ride on a chain someone else made valuable? Whoever actually widens a chain gets a **+15
pioneer bonus**, which is what stops free-riding from simply dominating.

Seats are contested too. With 6 seats a chain and a hard chain limit, your friends will take the
spot you were planning for. That's the transcript's *"dina handlingar påverkar mina möjligheter"* —
your moves change my options — made literal.

## Structure

```
wrangler.jsonc      config: DO binding, SQLite migration, static assets
src/index.js        Worker: /api/new mints a room code, /api/room/:code upgrades to the DO
src/room.js         GameRoom Durable Object — authoritative rules, WebSocket hibernation
public/engine.js    shared game engine, imported by BOTH server and browser
public/index.html   client: lobby + shared board
```

**The server is authoritative.** Clients send intents (`play this card here on this question`),
never state. Every move is re-derived from the survey data server-side, so a tampered client cannot
invent an agreement the data doesn't support. Hands are private: each player's view contains only
their own cards, and others' hands appear as counts.

Verified with bot clients over real WebSockets — 2- and 4-player games to completion, plus explicit
checks that the server rejects: starting when not host, playing out of turn, playing a card you
don't hold, and claiming a question two people don't actually agree on.

## Known gaps

- **No reconnect-into-a-running-game.** Join after the start and you spectate until the next round.
- **No room expiry.** Durable Objects persist; abandoned rooms linger. Add an alarm to clean up.
- **No spectator UI**, no chat, no rematch lobby beyond the host's "play again".
- **`public/engine.js` is duplicated** as an inlined block in `../index.html`, because the solo
  prototype is deliberately a single file that runs from `file://` with no build step. If you change
  the data or scoring, change both.
