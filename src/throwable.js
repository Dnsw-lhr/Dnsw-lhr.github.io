// Throwable toolkit tags: grab, fling, bounce off the walls. Static list under reduced motion.
export function initializeThrowable(container, reduced) {
  if (!container || reduced.matches) return;
  const chips = [...container.children];
  const box = container.getBoundingClientRect();
  if (!box.width) return;
  const bodies = chips.map(el => { const r = el.getBoundingClientRect(); return { el, x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height, vx: 0, vy: 0, spin: 0 }; });
  container.style.height = `${Math.max(box.height + 160, 300)}px`;
  container.classList.add('is-physics');
  container.parentElement.querySelector('.toy-hint')?.removeAttribute('hidden');
  let frame = null, drag = null;
  const place = b => { b.el.style.transform = `translate(${b.x}px,${b.y}px) rotate(${b.spin}deg)`; };
  bodies.forEach(place);
  // Toss the tools into the box so it opens with a little chaos.
  bodies.forEach((b, i) => { b.vx = (Math.random() - .5) * 12; b.vy = 7 + Math.random() * 7 + i * .6; b.spin = (Math.random() - .5) * 30; });
  function step() {
    if (!container.isConnected) return;
    const W = container.clientWidth, H = container.clientHeight; let moving = false;
    for (const b of bodies) {
      if (drag?.body === b) { moving = true; continue; }
      b.x += b.vx; b.y += b.vy; b.vx *= .94; b.vy *= .94; b.spin += (b.vx * 1.2 - b.spin) * .08;
      if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx) * .6; } if (b.x + b.w > W) { b.x = W - b.w; b.vx = -Math.abs(b.vx) * .6; }
      if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy) * .6; } if (b.y + b.h > H) { b.y = H - b.h; b.vy = -Math.abs(b.vy) * .6; }
      if (Math.abs(b.vx) + Math.abs(b.vy) > .05 || Math.abs(b.spin) > .1) moving = true;
    }
    // Blocks collide: push overlapping pairs apart along the shallow axis and trade momentum.
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox <= 0 || oy <= 0) continue;
      const heldA = drag?.body === a, heldB = drag?.body === b;
      const shareA = heldA ? 0 : heldB ? 1 : .5, shareB = 1 - shareA;
      if (ox < oy) {
        const dir = a.x + a.w / 2 < b.x + b.w / 2 ? -1 : 1;
        a.x += dir * ox * shareA; b.x -= dir * ox * shareB;
        const va = a.vx, vb = b.vx; if (!heldA) a.vx = (heldB ? vb * 1.1 : vb) * .85 + dir * .4; if (!heldB) b.vx = (heldA ? va * 1.1 : va) * .85 - dir * .4;
      } else {
        const dir = a.y + a.h / 2 < b.y + b.h / 2 ? -1 : 1;
        a.y += dir * oy * shareA; b.y -= dir * oy * shareB;
        const va = a.vy, vb = b.vy; if (!heldA) a.vy = (heldB ? vb * 1.1 : vb) * .85 + dir * .4; if (!heldB) b.vy = (heldA ? va * 1.1 : va) * .85 - dir * .4;
      }
      a.spin += (Math.random() - .5) * 4; b.spin += (Math.random() - .5) * 4; moving = true;
    }
    for (const b of bodies) {
      b.x = Math.max(0, Math.min(W - b.w, b.x)); b.y = Math.max(0, Math.min(H - b.h, b.y));
      place(b);
    }
    frame = moving ? requestAnimationFrame(step) : null;
  }
  frame = requestAnimationFrame(step);
  bodies.forEach(b => {
    b.el.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault(); b.el.setPointerCapture(event.pointerId);
      drag = { body: b, id: event.pointerId, dx: event.clientX - b.x, dy: event.clientY - b.y, lx: event.clientX, ly: event.clientY, t: event.timeStamp };
      b.el.classList.add('is-held'); b.vx = b.vy = 0; frame ||= requestAnimationFrame(step);
    });
    b.el.addEventListener('pointermove', event => {
      if (drag?.body !== b || event.pointerId !== drag.id) return;
      const dt = Math.max(8, event.timeStamp - drag.t) / 16;
      b.vx = (event.clientX - drag.lx) / dt; b.vy = (event.clientY - drag.ly) / dt;
      drag.lx = event.clientX; drag.ly = event.clientY; drag.t = event.timeStamp;
      b.x = Math.max(0, Math.min(container.clientWidth - b.w, event.clientX - drag.dx));
      b.y = Math.max(0, Math.min(container.clientHeight - b.h, event.clientY - drag.dy));
      b.spin = Math.max(-25, Math.min(25, b.vx * 2)); place(b); frame ||= requestAnimationFrame(step);
    });
    const release = event => {
      if (drag?.body !== b || event.pointerId !== drag.id) return;
      drag = null; b.el.classList.remove('is-held');
      b.vx = Math.max(-40, Math.min(40, b.vx)); b.vy = Math.max(-40, Math.min(40, b.vy));
      frame ||= requestAnimationFrame(step);
    };
    b.el.addEventListener('pointerup', release); b.el.addEventListener('pointercancel', release);
  });
}
