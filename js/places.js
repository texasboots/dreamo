// Places from words: "candy land", "jungle with a lake", "the moon". No 3D here, just a recipe the scene builds.
import { ENVS } from './model.js';

const T = (o) => o;
// Each theme adds to the recipe. Later words win for ground and sky.
const THEMES = {
  forest: T({ emoji: '🌲', ground: 'grass', trees: [['pine', 120], ['leafy', 100], ['bush', 40]], hills: 'rolling' }),
  wood: 'forest', woods: 'forest', woodland: 'forest',
  beach: T({ emoji: '🏝️', ground: 'sand', water: 'sea', trees: [['palm', 60], ['rock', 20]] }), coast: 'beach', seaside: 'beach', shore: 'beach', ocean: 'beach', sea: 'beach',
  island: T({ emoji: '🏝️', ground: 'sand', water: 'island', trees: [['palm', 40]] }), tropical: 'island', hawaii: 'island', paradise: 'island', caribbean: 'island',
  snow: T({ emoji: '🏔️', ground: 'snow', snowy: true, trees: [['pine', 140], ['rock', 20]], hills: 'mountains', look: { fog: '#e3edf6', sky: '#cfe0f2', bounce: '#dfe8f0' } }),
  snowy: 'snow', winter: 'snow', alps: 'snow', ski: 'snow', ice: 'snow', icy: 'snow', frozen: 'snow',
  arctic: T({ emoji: '🐧', ground: 'snow', snowy: true, water: 'sea', icebergs: true, trees: [['rock', 30]], extras: [['snowman', 6]], look: { fog: '#e6f0f8', sky: '#cfe0f2', bounce: '#e8f0f6' } }),
  antarctica: 'arctic', penguin: 'arctic', iceberg: 'arctic', polar: 'arctic',
  christmas: T({ emoji: '🎄', ground: 'snow', snowy: true, trees: [['pine', 160]], extras: [['snowman', 8]], hills: 'mountains', look: { fog: '#e3edf6', sky: '#cfe0f2', bounce: '#dfe8f0' } }),
  north: 'christmas', pole: 'christmas', santa: 'christmas',
  city: T({ emoji: '🏙️', ground: 'grass', city: true }), town: 'village', downtown: 'city', york: 'city', skyscraper: 'city', urban: 'city', tokyo: 'city', london: 'city', paris: 'city',
  village: T({ emoji: '🏘️', ground: 'grass', village: true, trees: [['leafy', 50]], hills: 'rolling' }), neighborhood: 'village', suburb: 'village', street: 'village',
  mountain: T({ emoji: '⛰️', ground: 'grass', trees: [['pine', 120], ['rock', 30]], hills: 'mountains' }), mountains: 'mountain', hill: 'mountain', hills: 'mountain', cliff: 'mountain',
  desert: T({ emoji: '🏜️', ground: 'color:#e2c48e', trees: [['cactus', 60], ['rock', 30]], hills: 'mesas', look: { fog: '#f2dfc0', sky: '#bfd9ef', bounce: '#d8b47e' } }),
  sahara: 'desert', egypt: 'desert', dune: 'desert', dunes: 'desert', cactus: 'desert', western: 'desert', canyon: 'desert', cowboy: 'desert', texas: 'desert',
  jungle: T({ emoji: '🌴', ground: 'color:#4f8a3a', trees: [['jungle', 140], ['palm', 40], ['bush', 80]], hills: 'green', look: { fog: '#cfe6d2', sky: '#b5d8e8', bounce: '#4f7f3a' } }),
  rainforest: 'jungle', amazon: 'jungle', tarzan: 'jungle',
  moon: T({ emoji: '🌕', ground: 'color:#a7a7ad', space: true, trees: [['rock', 60]], hills: 'craters', look: { fog: '#05060f', sky: '#8890a8', bounce: '#77777f' } }),
  space: T({ emoji: '🚀', ground: 'color:#8d8aa6', space: true, trees: [['crystal', 40], ['rock', 40]], hills: 'craters', look: { fog: '#05060f', sky: '#8890c8', bounce: '#6f6a8a' } }),
  galaxy: 'space', planet: 'space', star: 'space', stars: 'space', outer: 'space', alien: 'space',
  mars: T({ emoji: '🔴', ground: 'color:#c4673f', space: true, trees: [['rock', 70]], hills: 'mesas', hillColors: ['#9a4a2a', '#d07a4a'], look: { fog: '#3a1a10', sky: '#e0a080', bounce: '#a0502a' } }),
  candy: T({ emoji: '🍭', ground: 'color:#f9c6dc', trees: [['lolly', 60], ['lolly2', 50], ['lolly3', 50]], hills: 'pastel', look: { fog: '#fbe0ef', sky: '#ffd3ea', bounce: '#f7b6d6' } }),
  candyland: 'candy', sweet: 'candy', sweets: 'candy', lollipop: 'candy', sugar: 'candy', chocolate: 'candy', dessert: 'candy',
  rainbow: T({ emoji: '🌈', ground: 'color:#c9f0c0', trees: [['lolly', 40], ['lolly2', 40], ['lolly3', 40], ['blossom', 30]], hills: 'pastel', flowers: true, look: { fog: '#f6ecff', sky: '#d7e8ff', bounce: '#c9e8c0' } }),
  unicorn: 'rainbow',
  volcano: T({ emoji: '🌋', ground: 'color:#3b3433', water: 'lava', trees: [['dead', 40], ['rock', 50]], hills: 'volcano', look: { fog: '#5a3a30', sky: '#d08a6a', bounce: '#5a3028' } }),
  lava: 'volcano', fire: 'volcano', dragon: 'volcano',
  farm: T({ emoji: '🚜', ground: 'grass', farm: true, trees: [['leafy', 40], ['apple', 30]], extras: [['hayBales', 8]], hills: 'rolling' }), countryside: 'farm', ranch: 'farm', barn: 'farm', field: 'farm', fields: 'farm', country: 'farm',
  autumn: T({ emoji: '🍂', ground: 'color:#8a9a4a', trees: [['autumn', 180], ['bush', 30]], extras: [['pumpkins', 4]], hills: 'rolling', look: { fog: '#efe0c8', sky: '#c8d8ea', bounce: '#9a7a3a' } }), fall: 'autumn',
  spring: T({ emoji: '🌸', ground: 'grass', trees: [['blossom', 150], ['leafy', 40]], flowers: true, hills: 'rolling' }), blossom: 'spring', cherry: 'spring', japan: 'spring', sakura: 'spring',
  halloween: T({ emoji: '🎃', ground: 'color:#4a5a3a', trees: [['dead', 140]], extras: [['pumpkins', 8]], hills: 'dark', look: { fog: '#5a4a6a', sky: '#8a7aa8', bounce: '#3a3048' } }),
  spooky: 'halloween', haunted: 'halloween', creepy: 'halloween', graveyard: 'halloween', scary: 'halloween', ghost: 'halloween',
  fairy: T({ emoji: '🍄', ground: 'color:#7fb86a', trees: [['mushroom', 70], ['blossom', 50], ['crystal', 20]], flowers: true, hills: 'green', look: { fog: '#e2f0e6', sky: '#cfe0ff', bounce: '#7fa86a' } }),
  magic: 'fairy', enchanted: 'fairy', mushroom: 'fairy', elf: 'fairy', wonderland: 'fairy',
  crystal: T({ emoji: '💎', ground: 'color:#6a6488', trees: [['crystal', 120], ['rock', 30]], hills: 'crystal', look: { fog: '#c8b8f0', sky: '#b8b0e8', bounce: '#6a5a98' } }), cave: 'crystal', gem: 'crystal', diamond: 'crystal',
  underwater: T({ emoji: '🐠', ground: 'sand', underwater: true, trees: [['lolly2', 60], ['lolly', 40], ['rock', 40]], hills: 'reef', look: { fog: '#2f8fbf', sky: '#5ab8e0', bounce: '#3f8fb0' } }),
  mermaid: 'underwater', atlantis: 'underwater', coral: 'underwater', reef: 'underwater',
  park: T({ emoji: '🌳', ground: 'grass', trees: [['leafy', 80], ['bush', 40]], flowers: true, water: 'lake', hills: 'rolling' }), meadow: 'park', garden: 'park', flower: 'park', flowers: 'park',
  lake: T({ water: 'lake' }), pond: 'lake', river: 'lake',
  savanna: T({ emoji: '🦁', ground: 'color:#c8b46a', trees: [['leafy', 25], ['bush', 30], ['rock', 15]], hills: 'mesas', hillColors: ['#9a8a5a', '#b8a06a'], look: { fog: '#f0e2c0', sky: '#c0d8ec', bounce: '#b8a060' } }),
  safari: 'savanna', africa: 'savanna',
  swamp: T({ emoji: '🐊', ground: 'color:#4a5a32', water: 'swamp', trees: [['dead', 60], ['jungle', 40], ['bush', 50]], hills: 'dark', look: { fog: '#a8b098', sky: '#a8b8a8', bounce: '#4a5a32' } }), bog: 'swamp', marsh: 'swamp',
  cloud: T({ emoji: '☁️', ground: 'color:#f6f8ff', trees: [], hills: 'clouds', look: { fog: '#ffe6f2', sky: '#d8e8ff', bounce: '#ffffff' } }), clouds: 'cloud', sky: 'cloud', heaven: 'cloud',
};
const DEFAULT_LOOK = { grass: { fog: '#cfe3ee', sky: '#bcd8f0', bounce: '#5f7f45' }, sand: { fog: '#d6ecf5', sky: '#bfe4f7', bounce: '#d9c79a' }, snow: { fog: '#e3edf6', sky: '#cfe0f2', bounce: '#dfe8f0' } };

const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
export const placeKey = t => String(t || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const theme = w => { let t = THEMES[w] ?? THEMES[w.replace(/s$/, '')]; while (typeof t === 'string') t = THEMES[t]; return t; };

export function placeSpec(text) {
  const key = placeKey(text);
  if (ENVS[key]) return { preset: key };
  const spec = { name: key, emoji: '🌍', ground: null, trees: [], hills: null, water: null, extras: [], look: null };
  let found = 0;
  for (const w of key.split(' ')) {
    const t = theme(w); if (!t) continue; found++;
    for (const [k, v] of Object.entries(t)) {
      if (k === 'trees' || k === 'extras') spec[k].push(...v);
      else if (k === 'look') spec.look = v;
      else if (k === 'water' && spec.water && v === 'lake') continue;
      else spec[k] = v;
    }
  }
  if (!found) { // a place we don't know: invent one from the words, always the same for the same words
    const h = hash(key), pick = (a, n) => a[(h >>> n) % a.length];
    Object.assign(spec, pick([THEMES.forest, THEMES.beach, THEMES.desert, THEMES.jungle, THEMES.fairy, THEMES.spring, THEMES.autumn, THEMES.mountain, THEMES.candy, THEMES.crystal, THEMES.farm, THEMES.park], 0), { name: key });
    spec.trees = [...spec.trees]; spec.extras = [...(spec.extras || [])];
    if ((h >>> 5) % 3 === 0 && !spec.water) spec.water = 'lake';
  }
  if (!spec.ground) spec.ground = 'grass';
  if (!spec.trees.length && spec.hills !== 'clouds' && !spec.city) spec.trees = [['leafy', 60], ['bush', 30]];
  spec.look = { ...(spec.look || DEFAULT_LOOK[spec.ground] || { fog: '#d8e4ea', sky: '#c8dcec', bounce: '#8a8a7a' }), ground: spec.ground };
  return spec;
}

const groundCss = { grass: '#6a9a42', sand: '#ecd9a6', snow: '#f6f9fc' };
export function placeInfo(env) {
  const key = placeKey(env);
  if (ENVS[key]) return ENVS[key];
  const s = placeSpec(key), g = groundCss[s.ground] || s.ground.replace('color:', '');
  const name = key ? key.replace(/\b\w/g, m => m.toUpperCase()) : 'Somewhere';
  return { name, emoji: s.emoji, css: `linear-gradient(${s.space ? '#05060f' : s.look.sky},${s.space ? '#2a2a40' : s.look.fog} 55%,${g} 56%)` };
}
