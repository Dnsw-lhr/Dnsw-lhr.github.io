// Thin animated threads that connect the topics floating around the world.
// They follow the panels when they're dragged and light up when a panel is hovered.
const EDGES = [['intro', 'games'], ['games', 'skills'], ['skills', 'contact'], ['intro', 'works'], ['games', 'works'], ['works', 'about'], ['works', 'art'], ['about', 'art'], ['contact', 'art']];
const NS = 'http://www.w3.org/2000/svg';

export function initializeLinks({ canvas }) {
  const svg = canvas.querySelector('.world-links');
  const node = id => id === 'works' ? canvas.querySelector('.works-heading') : id === 'about' ? canvas.querySelector('[data-district="story"]') : canvas.querySelector(`[data-district="${id}"]`);
  const box = element => { let x = 0, y = 0, p = element; while (p && p !== canvas) { x += p.offsetLeft; y += p.offsetTop; p = p.offsetParent; } return { x, y, w: element.offsetWidth, h: element.offsetHeight, cx: x + element.offsetWidth / 2, cy: y + element.offsetHeight / 2 }; };
  // Where the line from a box's centre toward a target leaves the box (plus a small gap).
  const exit = (b, tx, ty) => {
    const dx = tx - b.cx, dy = ty - b.cy;
    const t = Math.min(Math.abs((b.w / 2 + 14) / (dx || 1e-6)), Math.abs((b.h / 2 + 14) / (dy || 1e-6)));
    return { x: b.cx + dx * t, y: b.cy + dy * t };
  };
  const paths = EDGES.map(([a, b], i) => {
    const group = document.createElementNS(NS, 'g'); group.dataset.a = a; group.dataset.b = b;
    const path = document.createElementNS(NS, 'path'), start = document.createElementNS(NS, 'circle'), end = document.createElementNS(NS, 'circle'), pulse = document.createElementNS(NS, 'circle'), motion = document.createElementNS(NS, 'animateMotion');
    path.setAttribute('class', 'link-path'); path.style.animationDelay = `${-i * 1.7}s`;
    [start, end].forEach(c => { c.setAttribute('r', '4'); c.setAttribute('class', 'link-node'); });
    pulse.setAttribute('r', '3.5'); pulse.setAttribute('class', 'link-pulse');
    motion.setAttribute('dur', `${7 + i % 3}s`); motion.setAttribute('repeatCount', 'indefinite'); motion.setAttribute('begin', `${-i * 1.3}s`); motion.setAttribute('calcMode', 'spline'); motion.setAttribute('keyTimes', '0;1'); motion.setAttribute('keySplines', '.45 0 .55 1'); pulse.append(motion);
    group.append(path, start, end, pulse); svg.append(group);
    return { a, b, path, start, end, pulse, motion };
  });
  let frame = null;
  function draw() {
    frame = null;
    svg.setAttribute('viewBox', `0 0 ${canvas.offsetWidth} ${canvas.offsetHeight}`);
    for (const link of paths) {
      const A = node(link.a), B = node(link.b); if (!A || !B) continue;
      const a = box(A), b = box(B), p = exit(a, b.cx, b.cy), q = exit(b, a.cx, a.cy);
      // A gentle S-curve: control points pulled along the dominant axis.
      const horizontal = Math.abs(q.x - p.x) > Math.abs(q.y - p.y), k = .45;
      const c1 = horizontal ? { x: p.x + (q.x - p.x) * k, y: p.y } : { x: p.x, y: p.y + (q.y - p.y) * k };
      const c2 = horizontal ? { x: q.x - (q.x - p.x) * k, y: q.y } : { x: q.x, y: q.y - (q.y - p.y) * k };
      const d = `M${p.x.toFixed(1)} ${p.y.toFixed(1)} C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
      link.path.setAttribute('d', d);
      link.motion.setAttribute('path', d);
      link.start.setAttribute('cx', p.x); link.start.setAttribute('cy', p.y); link.end.setAttribute('cx', q.x); link.end.setAttribute('cy', q.y);
    }
  }
  const schedule = () => { frame ||= requestAnimationFrame(draw); };
  // Redraw when panels move (draggable-panels writes left/top) or the layout changes size.
  const panels = [...canvas.querySelectorAll('.world-district')];
  const observer = new MutationObserver(records => { if (records.some(r => r.target.style.left || r.target.style.top)) schedule(); });
  panels.forEach(panel => observer.observe(panel, { attributes: true, attributeFilter: ['style'] }));
  window.addEventListener('resize', schedule);
  document.fonts?.ready.then(schedule);
  // Hovering a topic lights up its threads.
  const idOf = panel => panel.dataset.district === 'story' ? 'about' : panel.dataset.district;
  [...panels, canvas.querySelector('.world-intro'), canvas.querySelector('.works-heading')].forEach(element => {
    const id = element.classList.contains('works-heading') ? 'works' : idOf(element);
    element.addEventListener('pointerenter', () => svg.querySelectorAll('g').forEach(g => g.classList.toggle('is-lit', g.dataset.a === id || g.dataset.b === id)));
    element.addEventListener('pointerleave', () => svg.querySelectorAll('g.is-lit').forEach(g => g.classList.remove('is-lit')));
  });
  draw();
  return { redraw: schedule, pause: paused => paused ? svg.pauseAnimations?.() : svg.unpauseAnimations?.() };
}
