// Full-screen glass break with a hitstop:
//  0ms    impact: the black screen (with its text) cracks from the point of impact, a white flash, everything freezes.
//  600ms  explosion: every piece bursts outward toward the camera and away, fast, revealing the world.
export const HITSTOP_MS = 600;
export function shatterScreen({ source, impact, reduced, onImpact, onBurst, onDone }) {
  if (reduced.matches) return false;
  const W = innerWidth, H = innerHeight, diag = Math.hypot(W, H);
  const c = impact || { x: W / 2, y: H / 2 };
  const rand = (a, b) => a + Math.random() * (b - a);
  const rays = 16, rings = [.05, .13, .26, .46, 1.25];
  const angle0 = rand(0, Math.PI * 2);
  const angles = Array.from({ length: rays }, (_, i) => angle0 + (i + rand(-.3, .3)) * Math.PI * 2 / rays);
  const vertex = angles.map(a => rings.map((r, k) => { const rr = r * diag * (k === rings.length - 1 ? 1 : rand(.78, 1.22)); const aa = a + (k ? rand(-.08, .08) : 0); return { x: c.x + Math.cos(aa) * rr, y: c.y + Math.sin(aa) * rr }; }));

  const layer = document.createElement('div');
  layer.className = 'shatter-layer'; layer.setAttribute('aria-hidden', 'true');
  const sourceRect = source?.getBoundingClientRect();
  const pieces = [];
  const addPiece = (points, ring) => {
    const piece = document.createElement('div');
    piece.className = 'shard';
    piece.style.clipPath = `polygon(${points.map(p => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(',')})`;
    piece.style.background = `linear-gradient(${rand(0, 360).toFixed(0)}deg,#050505,#${['141414', '0d0d0d', '191817', '0a0a0a'][Math.floor(rand(0, 4))]})`;
    if (source) { const copy = source.cloneNode(true); copy.removeAttribute('id'); copy.classList.add('shard-copy'); Object.assign(copy.style, { left: `${sourceRect.left}px`, top: `${sourceRect.top}px`, width: `${sourceRect.width}px` }); piece.append(copy); }
    const cx = points.reduce((s, p) => s + p.x, 0) / points.length, cy = points.reduce((s, p) => s + p.y, 0) / points.length;
    piece.style.transformOrigin = `${cx}px ${cy}px`;
    pieces.push({ piece, cx, cy, ring }); layer.append(piece);
  };
  for (let i = 0; i < rays; i++) {
    const j = (i + 1) % rays;
    addPiece([c, vertex[i][0], vertex[j][0]], 0);
    for (let k = 0; k < rings.length - 1; k++) addPiece([vertex[i][k], vertex[j][k], vertex[j][k + 1], vertex[i][k + 1]], k + 1);
  }
  // Cracks appear all at once on impact (no drawing in: it's a single hit).
  const svgNS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'shatter-cracks'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const line = (points, width) => { const path = document.createElementNS(svgNS, 'path'); path.setAttribute('d', 'M' + points.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')); path.style.strokeWidth = width; svg.append(path); };
  vertex.forEach(v => line([c, ...v], '1.8px'));
  for (let k = 0; k < rings.length - 1; k++) vertex.forEach((v, i) => line([v[k], vertex[(i + 1) % rays][k]], k < 2 ? '1.4px' : '.9px'));
  const flash = document.createElement('div'); flash.className = 'shatter-flash';
  const glow = document.createElement('div'); glow.className = 'shatter-glow'; glow.style.left = `${c.x}px`; glow.style.top = `${c.y}px`;
  layer.append(svg, glow, flash);
  document.body.append(layer);

  // Impact + hitstop: a one-frame jolt, then a frozen frame with a soft white flash.
  onImpact?.();
  layer.animate([{ transform: 'translate(-5px,3px) scale(1.004)' }, { transform: 'none', offset: .08 }, { transform: 'none' }], { duration: HITSTOP_MS });
  flash.animate([{ opacity: .55 }, { opacity: .18, offset: .15 }, { opacity: .08 }], { duration: HITSTOP_MS, fill: 'forwards' });

  // Explosion: pieces burst out from the impact, toward the camera, spinning.
  let longest = 0;
  setTimeout(() => {
    onBurst?.();
    flash.animate([{ opacity: .35, background: '#fffaf2' }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
    svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' });
    for (const { piece, cx, cy, ring } of pieces) {
      const dx = cx - c.x, dy = cy - c.y, d = Math.hypot(dx, dy) || 1;
      const force = rand(.7, 1.15) * (diag * .38 + (4 - ring) * 60);
      const delay = ring * 30 + rand(0, 60), duration = rand(1150, 1700);
      longest = Math.max(longest, delay + duration);
      piece.animate([
        { transform: 'translate3d(0,0,0)', opacity: 1 },
        { transform: `translate3d(${(dx / d * force * .32).toFixed(1)}px,${(dy / d * force * .32 + rand(10, 70)).toFixed(1)}px,${rand(60, 220).toFixed(0)}px) rotateX(${rand(-140, 140).toFixed(0)}deg) rotateY(${rand(-140, 140).toFixed(0)}deg) rotateZ(${rand(-90, 90).toFixed(0)}deg)`, opacity: 1, offset: .55 },
        { transform: `translate3d(${(dx / d * force).toFixed(1)}px,${(dy / d * force + rand(260, 520)).toFixed(1)}px,${rand(100, 380).toFixed(0)}px) rotateX(${rand(-280, 280).toFixed(0)}deg) rotateY(${rand(-280, 280).toFixed(0)}deg) rotateZ(${rand(-170, 170).toFixed(0)}deg) scale(${rand(.6, 1.05).toFixed(2)})`, opacity: 0 },
      ], { duration, delay, easing: 'cubic-bezier(.25,.55,.45,1)', fill: 'both' });
    }
    setTimeout(() => { layer.remove(); onDone?.(); }, longest + 120);
  }, HITSTOP_MS);
  return true;
}
