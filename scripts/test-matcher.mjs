// Self-check for extension/matcher.js and src/lib/catalogue.js. Run: npm test
import assert from 'node:assert/strict';
import '../extension/matcher.js';
import { catalogueToRules } from '../src/lib/catalogue.js';

const { normalize, buildIndex, findMatch } = globalThis.Sentinel;

assert.equal(normalize('  Aye-Numba, NA Kiya!! '), 'aye numba na kiya');
assert.equal(normalize('Café'), 'cafe');

const { rules, stats } = catalogueToRules([
  { 'Song Title': 'Amma', 'Member Name': 'Abhisheka Wimalaweera', 'Matched Public Name': 'Abhisheka Wimalaweera' },
  { 'Song Title': 'amma', 'Member Name': 'Daddy', 'Matched Public Name': 'Daddy' },
  { 'Song Title': 'Aye Numba Na Kiya', 'Member Name': 'Abhisheka Wimalaweera', 'Matched Public Name': 'Abhisheka W.' },
  { 'Song Title': 'Sanda Kinduru', 'Member Name': 'Victor Ratnayake', 'Matched Public Name': 'Victor Ratnayake' },
]);
assert.equal(stats.songs, 3, 'duplicate titles merge');
assert.equal(stats.oneWordTitles, 1);
assert.deepEqual(rules.songs[0], ['Amma', [0, 1]], 'artists merged across duplicate rows');

const index = buildIndex(rules, [{ title: 'My Own Track' }]);
const m = (text) => findMatch(text, index);

assert.equal(m('Amma - cooking vlog'), null, 'one-word title alone never matches');
assert.equal(m('Ammawarune (Live)'), null, 'no match inside a longer word');
assert.equal(m('Amma | Abhisheka Wimalaweera')?.kind, 'song', 'title + credited artist matches');
assert.deepEqual(m('Amma | Abhisheka Wimalaweera').artists, ['Abhisheka Wimalaweera']);
assert.equal(m('AYE NUMBA NA KIYA (Official Video)')?.title, 'Aye Numba Na Kiya', '3+ word title alone matches');
assert.equal(m('Sanda Kinduru cover'), null, '2-word title without artist does not match');
assert.equal(m('Victor Ratnayake live in Kandy')?.kind, 'artist', '2+ word artist alone matches');
assert.equal(m('Daddy reacts'), null, 'one-word artist alone never matches');
assert.equal(m('my own track')?.kind, 'song', 'user-added title matches alone');
assert.equal(m(''), null);

console.log('matcher ok');
