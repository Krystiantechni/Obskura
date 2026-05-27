// Merges new-namespace translations into existing locale files.
// Usage: node scripts/_merge_new_ns.js <lng>
// Reads: scripts/_newns/<lng>.json  (the 15 new namespaces, fully translated)
//        public/locales/<lng>/translation.json (existing 14 namespaces)
// Writes: public/locales/<lng>/translation.json with full key set, key order matching PL.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pl = require(path.join(ROOT, 'public/locales/pl/translation.json'));
const NEW_NS = ['aplikacja','forum','kariera','konto','mailingi','newsletter','onboarding','patroni','playerpage','prasa','spotkania','stany','tworcy','wsparcie'];

const lng = process.argv[2];
if (!lng) { console.error('need lng'); process.exit(1); }

const existingPath = path.join(ROOT, `public/locales/${lng}/translation.json`);
const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
const newns = JSON.parse(fs.readFileSync(path.join(ROOT, `scripts/_newns/${lng}.json`), 'utf8'));

// Build output following PL top-level order.
const out = {};
for (const key of Object.keys(pl)) {
  if (NEW_NS.includes(key)) {
    if (!(key in newns)) throw new Error(`${lng}: missing new ns ${key}`);
    out[key] = orderLike(pl[key], newns[key], `${key}`);
  } else {
    if (!(key in existing)) throw new Error(`${lng}: missing existing ns ${key}`);
    out[key] = existing[key];
  }
}

// Recursively reorder `data` to match `template` structure and detect missing keys.
function orderLike(template, data, p) {
  if (template === null || typeof template !== 'object') {
    if (data === undefined) throw new Error(`${lng}: missing leaf ${p}`);
    return data;
  }
  const res = {};
  for (const k of Object.keys(template)) {
    if (!(k in (data || {}))) throw new Error(`${lng}: missing key ${p}.${k}`);
    res[k] = orderLike(template[k], data[k], `${p}.${k}`);
  }
  return res;
}

fs.writeFileSync(existingPath, JSON.stringify(out, null, 2) + '\n', 'utf8');

// validate count
function count(x){let k=0;(function w(o){for(const v of Object.values(o)){k++;if(v&&typeof v==='object')w(v)}})(x);return k}
const c = count(out);
console.log(`${lng}: ${c} keys`);
if (c !== 1223) { console.error(`!!! ${lng} expected 1223 got ${c}`); process.exit(2); }
