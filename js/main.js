// DREAMO starts here.
import { Builder } from './app.js';
import { renderHome } from './ui/home.js';
import { store } from './store.js';
import { $ } from './ui/dom.js';

const show = id => { for (const s of ['home', 'builder']) $(s).hidden = s !== id; };
const goHome = () => { show('home'); renderHome(open); };
const builder = new Builder($('view'), goHome);
builder.saved = ok => { const el = $('saved'); if (!el) return; el.textContent = ok ? 'Saved ✓' : 'Could not save'; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); };
function open(house, fresh) {
  show('builder'); builder.open(house);
  if (fresh) { store.save(house); setTimeout(() => builder.saveNow(), 600); }
}
$('leave').onclick = () => builder.setWalk(false);
addEventListener('beforeunload', () => builder.house && builder.saveNow());
window.dreamo = builder;      // handy for testing in the console
goHome();
