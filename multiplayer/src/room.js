import { DurableObject } from 'cloudflare:workers';
import {
  PEOPLE, BY_ID, DIMS, DI, ZONES,
  legalDims, movePoints, chainZones, scoreLink,
  SEATS, MIN_CHAIN, HAND, MARKET, chainsFor, deckFor,
  mulberry32, shuffle,
} from '../public/engine.js';

/* ============================================================================
   GameRoom — one Durable Object per room code.

   The server is authoritative: clients send intents, never state. Every move is
   re-validated here, so a tampered client cannot invent a link that the survey
   data does not support.

   Uses the WebSocket Hibernation API, so an idle room (friends who wandered off
   mid-game) costs nothing while staying connected.
   ============================================================================ */
export class GameRoom extends DurableObject {
  constructor(ctx, env){
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      this.g = (await this.ctx.storage.get('g')) || null;
    });
  }

  async fetch(request){
    const url = new URL(request.url);
    if(request.headers.get('Upgrade') !== 'websocket')
      return new Response('expected websocket', { status: 426 });

    const name = (url.searchParams.get('name') || 'Player').slice(0, 16);
    const pid  = url.searchParams.get('pid') || crypto.randomUUID();
    const code = url.searchParams.get('code') || '????';

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    // survives hibernation, so we still know who this socket belongs to on wake
    server.serializeAttachment({ pid, name });
    this.ctx.acceptWebSocket(server);

    if(!this.g) this.g = this.blank(code);
    const existing = this.g.players.find(p => p.pid === pid);
    if(existing){ existing.name = name; existing.gone = false; }
    else if(this.g.phase === 'lobby'){
      this.g.players.push({ pid, name, score: 0, hand: [], gone:false,
                            host: this.g.players.length === 0 });
    } else {
      // joined after the start: spectate
      this.g.spectators = (this.g.spectators || 0) + 1;
    }
    await this.save();
    this.broadcast();
    return new Response(null, { status: 101, webSocket: client });
  }

  blank(code){
    return { code, phase:'lobby', players:[], chains:[], deck:[], market:[],
             turn:0, log:[], seed: Math.floor(Math.random()*1e9), spectators:0 };
  }

  async webSocketMessage(ws, raw){
    let m; try { m = JSON.parse(raw); } catch { return; }
    const att = ws.deserializeAttachment() || {};
    const me  = this.g?.players.find(p => p.pid === att.pid);
    if(!this.g || !me) return;

    try {
      switch(m.t){
        case 'start':  this.start(me); break;
        case 'play':   this.play(me, m); break;
        case 'newchain': this.newChain(me, m); break;
        case 'swap':   this.swap(me, m); break;
        case 'again':  this.again(me); break;
        default: return;
      }
    } catch(err){
      ws.send(JSON.stringify({ t:'error', msg: err.message }));
      return;
    }
    await this.save();
    this.broadcast();
  }

  async webSocketClose(ws){
    const att = ws.deserializeAttachment() || {};
    const p = this.g?.players.find(x => x.pid === att.pid);
    if(p) p.gone = true;
    if(this.g) await this.save();
    this.broadcast();
  }

  /* ---------------- game actions (all validated server-side) ------------- */

  start(me){
    if(!me.host) throw new Error('Only the host can start.');
    if(this.g.phase !== 'lobby') throw new Error('Already started.');
    if(this.g.players.length < 2) throw new Error('Need at least 2 players.');

    const n = this.g.players.length;
    const rng = mulberry32(this.g.seed);
    const deck = shuffle(PEOPLE.map(p => p.id), rng).slice(0, deckFor(n));
    this.g.maxChains = chainsFor(n);
    this.g.players.forEach(p => { p.hand = []; p.score = 0; });
    for(let i=0;i<HAND;i++) this.g.players.forEach(p => { if(deck.length) p.hand.push(deck.pop()); });
    this.g.market = [];
    for(let i=0;i<MARKET;i++) if(deck.length) this.g.market.push(deck.pop());
    this.g.deck = deck;
    this.g.chains = [];
    this.g.turn = 0;
    this.g.phase = 'play';
    this.g.log = [{ k:'sys', text:`Game on — ${n} players, ${this.g.maxChains} chains, ${SEATS} seats each.` }];
  }

  requireTurn(me){
    if(this.g.phase !== 'play') throw new Error('Not playing.');
    if(this.g.players[this.g.turn].pid !== me.pid) throw new Error('Not your turn.');
  }

  play(me, m){
    this.requireTurn(me);
    const hi = me.hand.indexOf(m.cardId);
    if(hi < 0) throw new Error('You do not hold that card.');
    const ch = this.g.chains[m.chainIdx];
    if(!ch) throw new Error('No such chain.');
    if(ch.nodes.length >= SEATS) throw new Error('That chain is full.');

    const card   = BY_ID[m.cardId];
    const anchor = BY_ID[m.end === 'h' ? ch.nodes[0] : ch.nodes[ch.nodes.length-1]];
    if(m.end === 'h' && ch.nodes.length < 2) throw new Error('Play on the other end.');

    // re-derive legality from the data; never trust the client's numbers
    const opts = legalDims(anchor, card, ch.used);
    const sc = opts.find(o => o.dimId === m.dimId);
    if(!sc) throw new Error('Those two do not agree on that.');

    const mp = movePoints(ch, card, sc);
    if(m.end === 'h'){ ch.nodes.unshift(m.cardId); ch.links.unshift({dimId:sc.dimId,score:sc.total,kind:sc.kind,by:me.pid}); }
    else             { ch.nodes.push(m.cardId);    ch.links.push({dimId:sc.dimId,score:sc.total,kind:sc.kind,by:me.pid}); }
    ch.used.push(sc.dimId);

    me.score += mp.points;
    me.hand.splice(hi,1);
    this.g.log.unshift({ k: sc.kind==='bridge' ? 'bridge' : (mp.pioneer ? 'pioneer' : 'link'),
      who: me.name, a: anchor.name, b: card.name, dim: sc.dimId,
      pts: mp.points, base: mp.base, mult: mp.zonesAfter, pioneer: mp.pioneer });
    this.g.log = this.g.log.slice(0, 30);
    this.after(me);
  }

  newChain(me, m){
    this.requireTurn(me);
    const hi = me.hand.indexOf(m.cardId);
    if(hi < 0) throw new Error('You do not hold that card.');
    if(this.g.chains.length >= this.g.maxChains) throw new Error('No room for another chain.');
    this.g.chains.push({ nodes:[m.cardId], links:[], used:[] });
    me.hand.splice(hi,1);
    this.g.log.unshift({ k:'start', who: me.name, b: BY_ID[m.cardId].name });
    this.after(me);
  }

  swap(me, m){
    this.requireTurn(me);
    const hi = me.hand.indexOf(m.cardId);
    if(hi < 0) throw new Error('You do not hold that card.');
    me.hand.splice(hi,1);
    this.g.log.unshift({ k:'swap', who: me.name, b: BY_ID[m.cardId].name });
    this.after(me);
  }

  /** refill the actor's hand, advance the turn, and end the game when stuck */
  after(me){
    if(this.g.market.length){ me.hand.push(this.g.market.shift());
      if(this.g.deck.length) this.g.market.push(this.g.deck.pop()); }
    else if(this.g.deck.length) me.hand.push(this.g.deck.pop());

    const anyCards = this.g.players.some(p => p.hand.length);
    const seatsLeft = this.g.chains.some(c => c.nodes.length < SEATS)
                   || this.g.chains.length < this.g.maxChains;
    if(!anyCards || !seatsLeft){ this.g.phase = 'over'; return; }

    for(let i=1;i<=this.g.players.length;i++){
      const nx = (this.g.turn + i) % this.g.players.length;
      if(this.g.players[nx].hand.length){ this.g.turn = nx; return; }
    }
    this.g.phase = 'over';
  }

  again(me){
    if(!me.host) throw new Error('Only the host can restart.');
    this.g.phase = 'lobby';
    this.g.seed = Math.floor(Math.random()*1e9);
    this.g.chains = []; this.g.log = [];
    this.g.players.forEach(p => { p.hand = []; p.score = 0; });
  }

  /* ---------------- views ---------------- */

  /** Per-player view: everyone sees the shared board, only their own hand. */
  view(pid){
    const g = this.g;
    const me = g.players.find(p => p.pid === pid);
    return {
      t:'state', code:g.code, phase:g.phase, you:pid,
      seats:SEATS, minChain:MIN_CHAIN, maxChains:g.maxChains || chainsFor(Math.max(2,g.players.length)),
      turnPid: g.phase==='play' && g.players.length ? g.players[g.turn].pid : null,
      players: g.players.map(p => ({ pid:p.pid, name:p.name, score:p.score,
                                     cards:p.hand.length, host:!!p.host, gone:!!p.gone })),
      chains: g.chains.map(c => ({ nodes:c.nodes, links:c.links, used:c.used, zones:chainZones(c) })),
      hand: me ? me.hand : [],
      market: g.market, deck: g.deck.length, log: g.log,
    };
  }

  broadcast(){
    for(const ws of this.ctx.getWebSockets()){
      const att = ws.deserializeAttachment() || {};
      try { ws.send(JSON.stringify(this.view(att.pid))); } catch {}
    }
  }

  save(){ return this.ctx.storage.put('g', this.g); }
}
