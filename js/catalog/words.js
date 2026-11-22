// Turning what people type into things: colour words, size words, other names for things, and a forgiving search.

export const COLORS = {
  red: '#e2574c', pink: '#f4b6dc', hotpink: '#ff5fa8', rose: '#f29b94', orange: '#f6a25a', yellow: '#f6d77a', gold: '#d9a441', golden: '#d9a441',
  green: '#8cc084', lime: '#a8d86a', mint: '#a8e6cf', teal: '#3f9f9a', turquoise: '#40c4c4', blue: '#7fb7e0', navy: '#2f3e6b', sky: '#9fd3f0',
  purple: '#a98ad6', violet: '#8a5ad6', lavender: '#d7c6ee', lilac: '#c8a8e8', brown: '#7a5a45', tan: '#d9b98a', beige: '#e8dcc6', cream: '#f3efe6',
  white: '#ffffff', black: '#2f3336', grey: '#8d949c', gray: '#8d949c', silver: '#c9ccd1', peach: '#f7c9a4', coral: '#f28b74', cherry: '#c22d2d',
  rainbow: 'rainbow', sparkly: '#e8d4ff', glitter: '#e8d4ff',
};
export const RAINBOW = ['#e2574c', '#f6a25a', '#f6d77a', '#8cc084', '#7fb7e0', '#a98ad6'];
export const SIZES = { tiny: 0.5, mini: 0.6, little: 0.75, small: 0.75, big: 1.4, large: 1.4, huge: 1.8, giant: 2, gigantic: 2.3, enormous: 2.3, mega: 2.2 };
const FILLER = new Set(['a', 'an', 'the', 'of', 'with', 'and', 'my', 'for', 'some', 'in', 'on', 'to', 'like', 'that', 'is', 'very', 'really', 'super', 'cool', 'awesome', 'cute', 'nice', 'pretty', 'fancy']);

// Other names for the things DREAMO already had.
export const OLD_WORDS = {
  sofa: 'couch settee sofa', armchair: 'arm chair comfy chair', coffeeTable: 'table low table', tv: 'television telly screen tv stand', bookshelf: 'books bookcase library shelf shelves',
  rug: 'carpet mat rug', rugRound: 'circle rug round carpet', floorLamp: 'lamp standing lamp light', plant: 'pot plant house plant flower pot', fireplace: 'fire place hearth chimney',
  piano: 'keyboard music grand piano', bed: 'double bed queen bed king bed', bedSingle: 'single bed kids bed', bunkBed: 'bunk beds bunkbed', wardrobe: 'closet armoire clothes',
  nightstand: 'night stand bedside table lamp', desk: 'homework desk study table', chair: 'seat dining chair', toybox: 'toys toy chest', counter: 'kitchen cabinet worktop cupboard',
  sinkCounter: 'kitchen sink sink tap', stove: 'oven cooker range hob', fridge: 'refrigerator freezer icebox', island: 'kitchen island breakfast bar', stool: 'bar stool',
  diningTable: 'table kitchen table dinner table', toilet: 'loo potty bathroom wc', bathtub: 'bath tub', basin: 'sink bathroom sink mirror', shower: 'showers',
  ceilingLamp: 'ceiling light pendant light', deskLamp: 'lamp tall lamp', discoBall: 'disco party mirror ball', stairs: 'staircase steps stair ladder upstairs',
  slide: 'slides water slide playground', pool: 'swimming pool swim', hotTub: 'hot tub jacuzzi spa', trampoline: 'jump bouncy', arcade: 'arcade game video game', cinema: 'movie screen projector theater',
  ballPit: 'ball pit balls', firePole: 'fireman pole pole', pingPong: 'table tennis', climbWall: 'rock wall climbing', teddy: 'teddy bear bear stuffed animal plush',
  treeLeafy: 'tree oak tree', treePine: 'pine christmas tree fir evergreen', palm: 'palm tree coconut tree', bush: 'shrub bushes', rock: 'stone rocks', flowers: 'flower bed flowers garden',
  hedge: 'hedges', fence: 'fences picket fence', path: 'path stone paving', patioSet: 'patio table umbrella outdoor table', lounger: 'sun bed deck chair', bbq: 'bbq grill barbecue',
  swingSet: 'swing swings playground', sandbox: 'sand pit sandpit', treehouse: 'tree house fort', car: 'car auto vehicle', mailbox: 'post box letter box mail',
  fountain: 'water fountain', gardenLamp: 'garden light outdoor lamp', bench: 'park bench seat', pond: 'pool lake water', garageBox: 'bike bicycle',
};

export const norm = t => String(t || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
export const sing = w => w.length > 3 && w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.length > 3 && /(ches|shes|sses|xes)$/.test(w) ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;

// Split typing into a colour, a size and the words that name the thing.
export function parse(text) {
  const out = { color: null, scale: 1, words: [], raw: norm(text) };
  for (const w of out.raw.split(' ')) {
    if (!w || FILLER.has(w)) continue;
    if (COLORS[w]) { out.color = COLORS[w]; continue; }
    if (SIZES[w]) { out.scale = SIZES[w]; continue; }
    out.words.push(sing(w));
  }
  return out;
}

function near(a, b) { // true when a and b differ by one letter (typo)
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, miss = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++miss > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return miss + (a.length - i) + (b.length - j) <= 1;
}

const keysOf = new WeakMap();
function keywords(def) {
  let k = keysOf.get(def);
  if (!k) {
    const name = norm(def.name), extra = norm((def.words || '') + ' ' + (OLD_WORDS[def.id] || ''));
    const camel = norm(def.id.replace(/([A-Z])/g, ' $1'));
    k = { name, all: ' ' + [name, camel, extra].join(' ') + ' ', list: [...new Set([name, camel, extra].join(' ').split(' ').filter(Boolean).map(sing))] };
    keysOf.set(def, k);
  }
  return k;
}

function wordScore(q, list) {
  let best = 0;
  for (const w of list) {
    if (w === q) return 3;
    if (q.length >= 3 && w.startsWith(q)) best = Math.max(best, 2);
    else if (q.length >= 4 && w.length >= 4 && near(q, w)) best = Math.max(best, 1.5);
    else if (q.length >= 5 && w.length >= 5 && (w.includes(q) || q.includes(w))) best = Math.max(best, 1);
  }
  return best;
}

// Best matches first. Each result: { def, score, full } where full = every word matched.
export function search(text, defs) {
  const p = parse(text);
  if (!p.words.length) return { parsed: p, results: [] };
  const phrase = ' ' + p.words.join(' ') + ' ';
  const results = [];
  for (const def of defs) {
    const k = keywords(def);
    let score = 0, hit = 0;
    for (const q of p.words) { const s = wordScore(q, k.list); if (s) { hit++; score += s; } }
    if (!hit) continue;
    if (k.all.includes(phrase)) score += 4;
    if (k.name === p.words.join(' ')) score += 4;
    if (!def.words) score += 0.5; // the first things DREAMO had are the plainest match
    results.push({ def, score: score + (hit === p.words.length ? 10 : 0), full: hit === p.words.length });
  }
  results.sort((a, b) => b.score - a.score || a.def.name.localeCompare(b.def.name));
  return { parsed: p, results };
}
