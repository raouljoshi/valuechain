export { GameRoom } from './room.js';

/* Room codes people can read out loud: no vowels (avoids real words), no 0/O/1/I. */
const ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ23456789';
const makeCode = () => Array.from({length:4}, () =>
  ALPHABET[Math.floor(Math.random()*ALPHABET.length)]).join('');

export default {
  async fetch(request, env){
    const url = new URL(request.url);

    // a fresh room code; the DO itself is created lazily on first connect
    if(url.pathname === '/api/new'){
      return Response.json({ code: makeCode() });
    }

    // /api/room/ABCD  -> websocket into that room's Durable Object
    const m = url.pathname.match(/^\/api\/room\/([A-Z0-9]{4})$/i);
    if(m){
      const code = m[1].toUpperCase();
      const id = env.GAME_ROOM.idFromName(code);
      const stub = env.GAME_ROOM.get(id);
      url.searchParams.set('code', code);
      return stub.fetch(new Request(url, request));
    }

    return env.ASSETS.fetch(request);
  },
};
