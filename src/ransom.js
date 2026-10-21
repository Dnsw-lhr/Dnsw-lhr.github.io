// "Ransom note" lettering for titles: each letter gets its own font, box and tilt.
// Deterministic per text + seed, so letters never jump around between renders.
export const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function random(seed) {
  let t = seed >>> 0;
  return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; };
}
const hash = value => [...value].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

export function ransomLetters(value, seed = 1) {
  const next = random(hash(String(value)) + seed * 977);
  return String(value).split(' ').map(word => `<span class="rw">${[...word].map((char, i) => {
    const plain = /[^\p{L}\p{N}]/u.test(char);
    const roll = next();
    const variant = plain ? 0 : roll < .44 ? 0 : roll < .7 ? 1 : roll < .88 ? 2 : 3;
    const font = Math.floor(next() * 5);
    const rotate = ((next() - .5) * (plain ? 6 : 16)).toFixed(1);
    const size = (i === 0 ? 1.16 : .86 + next() * .26).toFixed(2);
    const lift = ((next() - .5) * .12).toFixed(2);
    return `<span class="rl f${font} v${variant}" style="--r:${rotate}deg;--s:${size};--y:${lift}em">${esc(char)}</span>`;
  }).join('')}</span>`).join(' ');
}

// Accessible wrapper: screen readers get the plain words, sighted visitors get the cut-outs.
export const ransom = (value, seed = 1, className = '') => `<span class="sr-only">${esc(value)}</span><span class="ransom ${className}" aria-hidden="true">${ransomLetters(value, seed)}</span>`;
