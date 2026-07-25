/* ============================================================================
   VALUE CHAIN — shared game engine (ES module)
   Imported by BOTH the Durable Object (authoritative) and the browser client.
   Pure logic: no DOM, no network, no randomness except the seeded RNG below.

   SYNTHETIC data, structured to mirror the World Values Survey:
     · zones placed per the Inglehart-Welzel cultural map
     · people built from real WVS metadata axes (country, age, settlement,
       education, gender, occupation)
     · each question weighted by how divided the world really is on it
   ANTI-STEREOTYPE POLICY (DESIGN.md §10.1): named individuals, never national
   archetypes; most countries appear 2-3x with genuinely different values.

   NOTE: this file is the canonical engine. The single-player prototype at
   ../../index.html carries an inlined copy so it can run from file:// with no
   build step — if you change the data or scoring here, mirror it there.
   ============================================================================ */

export const DIMS = [
  {id:'lgbt',    q:'Same-sex couples should be accepted',            short:'Same-sex couples', pts:6},
  {id:'religion',q:'Religion is a big part of my life',              short:'Religion',         pts:5},
  {id:'divorce', q:"Divorce is OK if a marriage isn't working",      short:'Divorce',          pts:5},
  {id:'immig',   q:'People moving here from other countries make it better', short:'Newcomers',pts:5},
  {id:'gender',  q:'Girls and boys should get exactly the same chances', short:'Equal chances',pts:4},
  {id:'obey',    q:'Children should always obey their parents',      short:'Obeying parents',  pts:4},
  {id:'nation',  q:"I'm very proud of my country",                   short:'Country pride',    pts:4},
  {id:'author',  q:'We should show more respect for people in charge',short:'Respect leaders', pts:3},
  {id:'trust',   q:'Most people can be trusted',                     short:'Trust',            pts:3},
  {id:'environ', q:'Protecting nature matters more than making money',short:'Nature',          pts:3},
  {id:'democ',   q:'Everyone should have a say in how the country is run', short:'Everyone says',pts:2},
  {id:'work',    q:'Working hard is how you get ahead in life',      short:'Hard work',        pts:2},
  {id:'help',    q:'We should help people in other countries',       short:'Helping abroad',   pts:2},
  {id:'family',  q:'Family comes first',                             short:'Family first',     pts:1},
];
export const DI = Object.fromEntries(DIMS.map((d,i)=>[d.id,i]));

export const ZONES = {
  nordic:{name:'Northern Europe',  ink:'--ink-teal',   v:{lgbt:88,religion:20,divorce:85,immig:65,gender:92,obey:25,nation:45,author:30,trust:68,environ:78,democ:88,work:40,help:78,family:82}},
  anglo: {name:'English-speaking', ink:'--ink-violet', v:{lgbt:68,religion:60,divorce:70,immig:55,gender:82,obey:45,nation:78,author:55,trust:42,environ:52,democ:80,work:80,help:55,family:85}},
  latin: {name:'Latin America',    ink:'--ink-orange', v:{lgbt:58,religion:68,divorce:62,immig:50,gender:72,obey:55,nation:72,author:55,trust:25,environ:62,democ:68,work:70,help:52,family:92}},
  cath:  {name:'Southern Europe',  ink:'--ink-yellow', v:{lgbt:74,religion:45,divorce:72,immig:52,gender:84,obey:40,nation:55,author:45,trust:42,environ:68,democ:82,work:55,help:62,family:88}},
  orth:  {name:'Eastern Europe',   ink:'--ink-red',    v:{lgbt:22,religion:55,divorce:62,immig:34,gender:64,obey:56,nation:72,author:64,trust:30,environ:48,democ:54,work:55,help:40,family:86}},
  afrme: {name:'Africa & Mid-East',ink:'--ink-green',  v:{lgbt:6, religion:95,divorce:28,immig:40,gender:38,obey:80,nation:84,author:80,trust:22,environ:55,democ:60,work:74,help:55,family:95}},
  conf:  {name:'East Asia',        ink:'--ink-pink',   v:{lgbt:44,religion:25,divorce:55,immig:36,gender:62,obey:56,nation:64,author:62,trust:46,environ:58,democ:56,work:80,help:45,family:84}},
  sasia: {name:'South Asia',       ink:'--ink-blue',   v:{lgbt:26,religion:88,divorce:40,immig:42,gender:52,obey:74,nation:82,author:74,trust:30,environ:60,democ:66,work:82,help:48,family:94}},
};
(function(){
  const acc={}; DIMS.forEach(d=>acc[d.id]=0);
  const zs=Object.values(ZONES); zs.forEach(z=>DIMS.forEach(d=>acc[d.id]+=z.v[d.id]));
  const v={}; DIMS.forEach(d=>v[d.id]=Math.round(acc[d.id]/zs.length));
  ZONES.global={name:'Everywhere',ink:'--ink-faint',v};
})();

const MODS = {
  youngUrbanGrad:{religion:-16,lgbt:20,divorce:12,gender:12,immig:12,obey:-16,author:-12,nation:-8,trust:4,environ:12,democ:4,work:-6,help:8,family:-4},
  olderRural:    {religion:12,lgbt:-16,divorce:-10,gender:-12,immig:-10,obey:16,author:12,nation:8,trust:-2,environ:-4,democ:-4,work:4,help:-6,family:4},
  military:      {nation:18,author:20,obey:12,work:8,gender:-8,immig:-8,lgbt:-8,trust:-6},
  women:         {gender:9,environ:6,nation:-6,author:-5,work:-4,lgbt:3,help:5},
  business:      {work:12,environ:-10,trust:8,author:6,immig:5,democ:-2},
  care:          {environ:8,gender:8,trust:8,author:-6,lgbt:5,work:-6,help:10},
  farming:       {religion:7,obey:8,environ:-6,trust:-5,author:6,work:4,immig:-5},
  student:       {democ:6,environ:8,lgbt:8,obey:-10,work:-8,help:6},
  urbanGlobal:   {religion:-6,lgbt:6,environ:4,immig:4,author:-4},
};

export const PEOPLE = [
  {id:'in1',name:'Ananya',age:24,place:'Bengaluru, India',job:'software developer',zone:'sasia',mods:['youngUrbanGrad'],breadth:1},
  {id:'in2',name:'Rajesh', age:58,place:'rural Bihar, India',job:'grows rice on a small farm',zone:'sasia',mods:['olderRural','farming'],breadth:1},
  {id:'in3',name:'Meera',  age:41,place:'Pune, India',job:'secondary school teacher',zone:'sasia',mods:['care','women'],breadth:1},
  {id:'us1',name:'Tyler',  age:27,place:'Seattle, USA',job:'data analyst',zone:'anglo',mods:['youngUrbanGrad','business'],breadth:1},
  {id:'us2',name:'Deborah',age:54,place:'rural Alabama, USA',job:'shop assistant, church volunteer',zone:'anglo',mods:['olderRural','women'],breadth:1},
  {id:'us3',name:'Marcus', age:45,place:'Detroit, USA',job:'factory technician',zone:'anglo',mods:[],breadth:2},
  {id:'ng1',name:'Chidi',  age:31,place:'Lagos, Nigeria',job:'runs a phone repair business',zone:'afrme',mods:['business','urbanGlobal'],breadth:1},
  {id:'ng2',name:'Fatima', age:63,place:'rural Kano, Nigeria',job:'farmer',zone:'afrme',mods:['olderRural','farming','women'],breadth:1},
  {id:'br1',name:'Lucas',  age:20,place:'São Paulo, Brazil',job:'university student',zone:'latin',mods:['student','youngUrbanGrad'],breadth:1},
  {id:'br2',name:'Neusa',  age:66,place:'rural Bahia, Brazil',job:'farm worker',zone:'latin',mods:['olderRural','farming','women'],breadth:1},
  {id:'se1',name:'Elin',   age:29,place:'Malmö, Sweden',job:'hospital nurse',zone:'nordic',mods:['care','women'],breadth:1},
  {id:'se2',name:'Bengt',  age:71,place:'rural Dalarna, Sweden',job:'retired forestry worker',zone:'nordic',mods:['olderRural'],breadth:1},
  {id:'jp1',name:'Yuki',   age:26,place:'Tokyo, Japan',job:'graphic designer',zone:'conf',mods:['youngUrbanGrad'],breadth:1},
  {id:'jp2',name:'Toshio', age:68,place:'rural Akita, Japan',job:'rice farmer',zone:'conf',mods:['olderRural','farming'],breadth:1},
  {id:'cn1',name:'Wei',    age:33,place:'Shenzhen, China',job:'electronics engineer',zone:'conf',mods:['business','youngUrbanGrad'],breadth:1},
  {id:'cn2',name:'Lian',   age:57,place:'rural Gansu, China',job:'market gardener',zone:'conf',mods:['olderRural','farming','women'],breadth:1},
  {id:'ru1',name:'Dmitri', age:49,place:'Chelyabinsk, Russia',job:'factory foreman',zone:'orth',mods:[],breadth:2},
  {id:'ru2',name:'Sofia',  age:23,place:'Moscow, Russia',job:'medical student',zone:'orth',mods:['youngUrbanGrad','student'],breadth:1},
  {id:'eg1',name:'Hassan', age:60,place:'rural Sohag, Egypt',job:'farmer',zone:'afrme',mods:['olderRural','farming'],breadth:1},
  {id:'eg2',name:'Nour',   age:30,place:'Cairo, Egypt',job:'pharmacist',zone:'afrme',mods:['youngUrbanGrad','women','care'],breadth:1},
  {id:'pl1',name:'Halina', age:74,place:'small-town Podlasie, Poland',job:'retired, helps at the church',zone:'cath',mods:['olderRural','women'],breadth:1},
  {id:'it1',name:'Giulia', age:68,place:'small-town Puglia, Italy',job:'retired seamstress',zone:'cath',mods:['olderRural','women'],breadth:1},
  {id:'fr1',name:'Karim',  age:38,place:'Lyon, France',job:'bus driver',zone:'cath',mods:[],breadth:2},
  {id:'de1',name:'Anja',   age:44,place:'Stuttgart, Germany',job:'engineer at a car plant',zone:'cath',mods:['business','women'],breadth:1},
  {id:'nl1',name:'Sanne',  age:25,place:'Amsterdam, Netherlands',job:'café manager and musician',zone:'nordic',mods:['youngUrbanGrad'],breadth:1},
  {id:'ar1',name:'Diego',  age:36,place:'Córdoba, Argentina',job:'army officer',zone:'latin',mods:['military'],breadth:1},
  {id:'mx1',name:'Carmen', age:47,place:'Guadalajara, Mexico',job:'runs a hardware shop',zone:'latin',mods:['business','women'],breadth:1},
  {id:'co1',name:'Andrés', age:52,place:'rural Huila, Colombia',job:'coffee grower',zone:'latin',mods:['farming','olderRural'],breadth:1},
  {id:'ke1',name:'Amara',  age:35,place:'Nairobi, Kenya',job:'nurse',zone:'afrme',mods:['care','women'],breadth:1},
  {id:'tr1',name:'Emre',   age:43,place:'Konya, Turkey',job:'shopkeeper',zone:'afrme',mods:['business'],breadth:1},
  {id:'pk1',name:'Bilal',  age:39,place:'Lahore, Pakistan',job:'long-distance truck driver',zone:'afrme',mods:[],breadth:2},
  {id:'id1',name:'Sri',    age:34,place:'Surabaya, Indonesia',job:'primary school teacher',zone:'afrme',mods:['care','women'],breadth:1},
  {id:'kr1',name:'Jihoon', age:28,place:'Busan, South Korea',job:'junior office worker',zone:'conf',mods:['youngUrbanGrad'],breadth:1},
  {id:'gb1',name:'Margaret',age:70,place:'rural Yorkshire, UK',job:'retired postal worker',zone:'anglo',mods:['olderRural','women'],breadth:1},
  {id:'ca1',name:'Noah',   age:22,place:'Vancouver, Canada',job:'environmental science student',zone:'anglo',mods:['student','youngUrbanGrad','care'],breadth:1},
  {id:'no1',name:'Ingrid', age:46,place:'Stavanger, Norway',job:'offshore engineer',zone:'nordic',mods:['business','women'],breadth:1},
  {id:'g1',name:'Women',       age:null,place:'everywhere',job:'half the people on Earth',zone:'global',mods:['women'],breadth:5},
  {id:'g2',name:'Under-30s',   age:null,place:'everywhere',job:'young people all over the world',zone:'global',mods:['youngUrbanGrad'],breadth:5},
  {id:'g3',name:'City people', age:null,place:'everywhere',job:'people who live in big cities',zone:'global',mods:['urbanGlobal'],breadth:4},
  {id:'g4',name:'Country people',age:null,place:'everywhere',job:'people far from cities',zone:'global',mods:['olderRural','farming'],breadth:4},
];

const clamp=x=>Math.max(0,Math.min(100,x));
PEOPLE.forEach(p=>{
  const base=ZONES[p.zone].v, v={};
  DIMS.forEach(d=>{ let x=base[d.id]; p.mods.forEach(m=>{ if(MODS[m]&&MODS[m][d.id]!=null) x+=MODS[m][d.id]; }); v[d.id]=clamp(Math.round(x)); });
  p.v=v; p.zoneName=ZONES[p.zone].name; p.ink=ZONES[p.zone].ink;
});
export const BY_ID = Object.fromEntries(PEOPLE.map(p=>[p.id,p]));

export function distance(a,b){
  let s=0; DIMS.forEach(d=>{const g=a.v[d.id]-b.v[d.id]; s+=g*g;}); return Math.sqrt(s/DIMS.length);
}
/* Tolerance GROWS with difference: two near-identical people must match closely,
   while two very different people count a rough alignment as real common ground.
   Without this the game's most valuable connections are impossible. */
export function tolerance(a,b,dist){
  const d=dist!=null?dist:distance(a,b);
  return 8 + d*0.22 + (a.breadth-1)*1.2 + (b.breadth-1)*1.2;
}
export const agreesOn=(a,b,dimId,dist)=>Math.abs(a.v[dimId]-b.v[dimId])<=tolerance(a,b,dist);
export const stanceWord=v=>v>=60?'YES':(v<=40?'NO':'MIXED');
export const stanceCls =v=>v>=60?'y':(v<=40?'n':'m');

export function scoreLink(a,b,dimId){
  const dim=DIMS[DI[dimId]], topic=dim.pts, dist=distance(a,b);
  let distBonus=0;
  if(dist>=55) distBonus=11; else if(dist>=45) distBonus=8;
  else if(dist>=35) distBonus=5; else if(dist>=25) distBonus=3; else if(dist>=15) distBonus=1;
  const bothNiche=a.breadth<=2&&b.breadth<=2;
  const specBonus=bothNiche?2:((a.breadth<=2||b.breadth<=2)?1:0);
  const gap=Math.abs(a.v[dimId]-b.v[dimId]);
  const tightBonus=(gap<=4&&bothNiche)?2:0;
  let kind='link';
  if(dist>=45) kind='bridge'; else if(tightBonus) kind='bond';
  return {total:topic+distBonus+specBonus+tightBonus,topic,distBonus,specBonus,tightBonus,
          dist:Math.round(dist),kind,dimId,gap};
}

/* ---------------------------------------------------------------------------
   MULTIPLAYER RULES
   The chains are shared; the points are personal. A link is worth its base
   value MULTIPLIED by the number of world regions the chain spans — so the
   multiplier is a commons that everyone at the table benefits from. PIONEER
   is paid to whoever actually widens it, so building the commons beats
   free-riding on it.
   --------------------------------------------------------------------------- */
export const SEATS=6, MIN_CHAIN=3, PIONEER=15, HAND=7, MARKET=3;
export const chainsFor  = n => Math.min(6, Math.max(3, n+2));
export const deckFor    = n => Math.min(PEOPLE.length, 14 + n*8);
export const chainZones = ch => new Set(ch.nodes.map(id=>BY_ID[id].zone)).size;

/** All questions two people may legally be joined on, given what the chain has spent. */
export function legalDims(a,b,used){
  const d=distance(a,b);
  return DIMS.filter(x=>!used.includes(x.id)&&agreesOn(a,b,x.id,d))
             .map(x=>scoreLink(a,b,x.id));
}
/** What a placement is worth to the player making it. */
export function movePoints(ch,card,sc){
  const zonesAfter=new Set([...ch.nodes.map(id=>BY_ID[id].zone),card.zone]).size;
  const pioneer = zonesAfter>chainZones(ch) ? PIONEER : 0;
  return {points: sc.total*zonesAfter + pioneer, zonesAfter, pioneer, base:sc.total};
}

/* seeded RNG so a room's deal is reproducible and auditable */
export function mulberry32(a){
  return function(){ a|=0; a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296; };
}
export function shuffle(arr,rng){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
