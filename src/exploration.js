import { initializePanels } from './draggable-panels.js';
import { constrain, frame, zoomAt } from './camera.js';

// Drag / scroll / pinch camera over a finite world, with eased "glide" between framings.
export function initializeExploration({ stage, root, reduced, isBlocked }) {
  const canvas = stage.querySelector('.world-canvas');
  const readout = document.querySelector('.zoom-readout');
  const world = () => ({ width: canvas.offsetWidth, height: canvas.offsetHeight });
  const viewport = () => ({ width: stage.clientWidth, height: stage.clientHeight });
  const small = () => stage.clientWidth < 700;
  const lite = document.documentElement.classList.contains('lite');
  let camera = { x: 0, y: 0, scale: 1 }, movingTimer, suppress = false, pan, pinch, inertia;
  const pointers = new Map();

  function paint(animate = false) {
    camera = constrain(camera, viewport(), world()); clearTimeout(movingTimer);
    stage.classList.toggle('camera-moving', animate && !reduced.matches);
    canvas.style.transform = `translate3d(${camera.x}px,${camera.y}px,0) scale(${camera.scale})`;
    readout.value = `${Math.round(camera.scale * 100)}%`;
    // Backdrop drifts slower than the world for depth.
    root.style.setProperty('--parallax-x', `${reduced.matches ? 0 : camera.x * .08}px`);
    root.style.setProperty('--parallax-y', `${reduced.matches ? 0 : camera.y * .08}px`);
    // Cassy lives in the background: she only drifts a little and fades as you travel away.
    const travel = Math.hypot(camera.x - homeCamera.x, camera.y - homeCamera.y) / Math.max(1, stage.clientWidth);
    root.style.setProperty('--cassy-x', `${reduced.matches ? 0 : Math.max(-60, Math.min(60, (camera.x - homeCamera.x) * .04))}px`);
    root.style.setProperty('--cassy-y', `${reduced.matches ? 0 : Math.max(-40, Math.min(40, (camera.y - homeCamera.y) * .04))}px`);
    const fade = Math.max(.22, Math.min(1, 1 - travel * .55 - Math.max(0, homeCamera.scale - camera.scale) * 1.4));
    root.style.setProperty('--cassy-fade', fade.toFixed(3));
    root.style.setProperty('--cassy-blur', `${reduced.matches ? 0 : ((1 - fade) * 7).toFixed(2)}px`);
    lean(camera.x - last.x, camera.y - last.y); last = { ...camera };
    updateMinimap();
    if (animate) movingTimer = setTimeout(() => stage.classList.remove('camera-moving'), 800);
  }
  // Camera lean: the whole world tilts in 3D in the direction you move it, then settles.
  const lens = stage.querySelector('.world-lens');
  let last = { ...camera }, homeCamera = { ...camera }, tilt = { x: 0, y: 0 }, leanFrame = null;
  function lean(dx, dy) {
    if (lite || reduced.matches || root.classList.contains('motion-paused')) return;
    // UI lags behind the drag, then springs back with a little overshoot.
    spring.vx = Math.max(-6, Math.min(6, spring.vx - dx * .02)); spring.vy = Math.max(-6, Math.min(6, spring.vy - dy * .02)); wake();
    tilt.x = Math.max(-7, Math.min(7, tilt.x * .6 + dx * .05)); tilt.y = Math.max(-5, Math.min(5, tilt.y * .6 - dy * .04));
    leanFrame ||= requestAnimationFrame(settle);
  }
  function settle() {
    tilt.x *= .9; tilt.y *= .9;
    const done = Math.abs(tilt.x) + Math.abs(tilt.y) < .02;
    lens.style.transform = done ? '' : `rotateY(${tilt.x.toFixed(3)}deg) rotateX(${tilt.y.toFixed(3)}deg)`;
    leanFrame = done ? null : requestAnimationFrame(settle);
  }
  // Floating UI: drifts slightly with the mouse, bounces on drags (spring), every element at its own depth.
  const spring = { x: 0, y: 0, vx: 0, vy: 0 }, mouse = { x: 0, y: 0, tx: 0, ty: 0 }; let uiFrame = null;
  function wake() { uiFrame ||= requestAnimationFrame(float); }
  function float() {
    const still = reduced.matches || root.classList.contains('motion-paused');
    spring.vx += -spring.x * .028 - spring.vx * .17; spring.vy += -spring.y * .028 - spring.vy * .17;
    spring.x = Math.max(-40, Math.min(40, spring.x + spring.vx)); spring.y = Math.max(-40, Math.min(40, spring.y + spring.vy));
    if (still) { mouse.tx = mouse.ty = 0; }
    mouse.x += (mouse.tx - mouse.x) * .08; mouse.y += (mouse.ty - mouse.y) * .08;
    stage.style.setProperty('--ui-x', `${(mouse.x * 12 + spring.x).toFixed(2)}px`); stage.style.setProperty('--ui-y', `${(mouse.y * 9 + spring.y).toFixed(2)}px`);
    const moving = Math.abs(spring.x) + Math.abs(spring.y) + Math.abs(spring.vx) + Math.abs(spring.vy) > .05 || Math.abs(mouse.tx - mouse.x) + Math.abs(mouse.ty - mouse.y) > .002;
    uiFrame = moving ? requestAnimationFrame(float) : null;
  }
  stage.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    const r = stage.getBoundingClientRect(); mouse.tx = (event.clientX - r.left) / r.width * 2 - 1; mouse.ty = (event.clientY - r.top) / r.height * 2 - 1; wake();
  });
  stage.addEventListener('pointerleave', () => { mouse.tx = mouse.ty = 0; wake(); });
  // Mini map: a live overview with the camera's view box; click a place to fly there.
  const minimap = document.querySelector('.minimap-world'), view = minimap?.querySelector('.minimap-view');
  const places = [...canvas.querySelectorAll('.world-intro,.world-district,.category-world')].map(element => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'minimap-place';
    const name = element.matches('.world-intro') ? 'Start' : element.matches('.category-world') ? 'All my work' : element.getAttribute('aria-label').replace(' panel', '');
    button.setAttribute('aria-label', `Fly to ${name}`); button.title = name;
    button.addEventListener('click', () => { if (!isBlocked()) focusElement(element); });
    minimap?.append(button); return { element, button };
  });
  function updateMinimap() {
    if (!minimap || !minimap.offsetWidth) return;
    const w = world(), k = minimap.offsetWidth / w.width;
    minimap.style.height = `${w.height * k}px`;
    for (const { element, button } of places) { const b = bounds(element); Object.assign(button.style, { left: `${b.x * k}px`, top: `${b.y * k}px`, width: `${Math.max(6, b.width * k)}px`, height: `${Math.max(4, b.height * k)}px` }); }
    const v = viewport();
    Object.assign(view.style, { left: `${-camera.x / camera.scale * k}px`, top: `${-camera.y / camera.scale * k}px`, width: `${v.width / camera.scale * k}px`, height: `${v.height / camera.scale * k}px` });
  }
  function bounds(element) { let x = 0, y = 0, parent = element; while (parent && parent !== canvas) { x += parent.offsetLeft; y += parent.offsetTop; parent = parent.offsetParent; } return { x, y, width: element.offsetWidth, height: element.offsetHeight }; }
  function focusElement(element, animate = true, padding) { if (!element) return; const target = bounds(element); if (element.matches('.category-world')) { target.x += small() ? 0 : 200; target.width = small() ? 700 : 1500; } camera = frame(target, viewport(), padding ?? (small() ? 16 : 60)); if (!element.matches('.category-world')) camera.scale = Math.min(camera.scale, small() ? 1.1 : 1.15); camera = { ...camera, ...centerOn(target, camera.scale) }; paint(animate); }
  function centerOn(target, scale) { const v = viewport(); return { x: v.width / 2 - (target.x + target.width / 2) * scale, y: v.height / 2 - (target.y + target.height / 2) * scale }; }
  function home(animate = true) {
    const v = viewport();
    const scale = small() ? Math.min(1, (v.width - 12) / 680) : Math.min(1, (v.width - 40) / 1400, (v.height - 20) / 820);
    camera = { x: 0, y: 0, scale: Math.max(.3, scale) }; homeCamera = constrain(camera, viewport(), world()); paint(animate);
  }
  function focusDistrict(id, chapter = 0) {
    const district = stage.querySelector(`[data-district="${id}"]`);
    const element = (chapter > 0 ? district?.querySelector(`.district-projects button:nth-child(${chapter})`) : null) || district || stage.querySelector('.world-intro');
    focusElement(element);
  }
  function action(name) {
    if (isBlocked()) return;
    if (name === 'home') home();
    else if (name === 'overview') { camera = frame({ x: 0, y: 0, ...world() }, viewport(), 24); paint(true); }
    else if (name === 'works') focusElement(stage.querySelector('.category-world'));
    else if (['left', 'right', 'up', 'down'].includes(name)) { const step = small() ? 220 : 480; camera[name === 'left' || name === 'right' ? 'x' : 'y'] += (name === 'left' || name === 'up' ? step : -step); paint(true); }
    else { camera = zoomAt(camera, name === 'in' ? 1.25 : 1 / 1.25, { x: stage.clientWidth / 2, y: stage.clientHeight / 2 }); paint(true); }
  }
  document.querySelectorAll('[data-camera]').forEach(button => button.addEventListener('click', () => action(button.dataset.camera)));
  stage.addEventListener('dragstart', event => event.preventDefault());

  // Drag with release inertia so the world glides a little after you let go.
  stage.addEventListener('pointerdown', event => {
    if (event.button !== 0 || isBlocked() || pointers.size >= 2 || event.target.closest('.minimap,.volume')) return;
    if (event.pointerType === 'mouse' && event.target.closest('.world-district') && !event.target.closest('.district-projects,.utility-open,.panel-more,.about-row')) return; // with a mouse, panels drag themselves
    cancelAnimationFrame(inertia); getSelection()?.removeAllRanges();
    if (pointers.size && event.pointerType === 'mouse') { pointers.clear(); pan = null; pinch = null; }
    suppress = false; pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (event.pointerType !== 'mouse') try { stage.setPointerCapture(event.pointerId); } catch {}
    if (pointers.size === 1) pan = { x: event.clientX, y: event.clientY, camera: { ...camera }, dragging: false, vx: 0, vy: 0, lx: event.clientX, ly: event.clientY, t: event.timeStamp };
    else { const [a, b] = [...pointers.values()], rect = stage.getBoundingClientRect(); pinch = { camera: { ...camera }, distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), point: { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top } }; suppress = true; }
  });
  stage.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    if (event.pointerType === 'mouse' && event.buttons === 0) { end(event); return; }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch && pointers.size === 2) { const [a, b] = [...pointers.values()]; camera = zoomAt(pinch.camera, Math.hypot(a.x - b.x, a.y - b.y) / pinch.distance, pinch.point); suppress = true; }
    else if (pan) {
      const dx = event.clientX - pan.x, dy = event.clientY - pan.y;
      if (!pan.dragging && Math.hypot(dx, dy) < 7) return;
      pan.dragging = true; suppress = true;
      const dt = Math.max(8, event.timeStamp - pan.t); pan.vx = (event.clientX - pan.lx) / dt * 16; pan.vy = (event.clientY - pan.ly) / dt * 16; pan.lx = event.clientX; pan.ly = event.clientY; pan.t = event.timeStamp;
      camera = { ...pan.camera, x: pan.camera.x + dx, y: pan.camera.y + dy };
    }
    if (!stage.hasPointerCapture(event.pointerId)) stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging'); event.preventDefault(); paint();
  });
  function glide(vx, vy) {
    if (reduced.matches || Math.hypot(vx, vy) < 1.5) return;
    vx = Math.max(-60, Math.min(60, vx)); vy = Math.max(-60, Math.min(60, vy));
    const step = () => { camera.x += vx; camera.y += vy; vx *= .92; vy *= .92; paint(); if (Math.hypot(vx, vy) > .4 && !isBlocked()) inertia = requestAnimationFrame(step); };
    inertia = requestAnimationFrame(step);
  }
  function end(event) {
    if (!pointers.has(event.pointerId)) return; pointers.delete(event.pointerId);
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId); pinch = null;
    if (pointers.size === 1) { const point = [...pointers.values()][0]; pan = { ...point, camera: { ...camera }, dragging: true, vx: 0, vy: 0, lx: point.x, ly: point.y, t: event.timeStamp }; }
    else { if (pan?.dragging && event.type === 'pointerup' && event.timeStamp - pan.t < 80) glide(pan.vx, pan.vy); pan = null; stage.classList.remove('is-dragging'); setTimeout(() => suppress = false, 0); }
  }
  window.addEventListener('blur', () => { pointers.clear(); pan = null; pinch = null; suppress = false; stage.classList.remove('is-dragging'); });
  window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  // Touch pointers start implicitly captured by the touched child; moving that capture to the stage fires a
  // bubbling lostpointercapture from the child. Only a capture lost by the stage itself ends the drag.
  stage.addEventListener('lostpointercapture', event => { if (event.target === stage) end(event); });
  stage.addEventListener('click', event => { if (suppress) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  stage.addEventListener('wheel', event => {
    if (isBlocked()) return; event.preventDefault(); cancelAnimationFrame(inertia);
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1;
    if (event.ctrlKey || event.metaKey) { const rect = stage.getBoundingClientRect(); camera = zoomAt(camera, Math.exp(-event.deltaY * unit * .002), { x: event.clientX - rect.left, y: event.clientY - rect.top }); }
    else { camera.x -= (event.shiftKey ? event.deltaY : event.deltaX) * unit; if (!event.shiftKey) camera.y -= event.deltaY * unit; }
    paint();
  }, { passive: false });
  stage.addEventListener('keydown', event => {
    if (event.target !== stage || isBlocked()) return;
    const commands = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', Home: 'home', '+': 'in', '=': 'in', '-': 'out' };
    if (commands[event.key]) { event.preventDefault(); action(commands[event.key]); }
  });
  // Keyboard focus brings off-screen controls into view.
  stage.addEventListener('focusin', event => {
    if (!pointers.size && !isBlocked() && event.target.matches('button')) {
      const rect = event.target.getBoundingClientRect(), v = stage.getBoundingClientRect();
      if (rect.left < v.left || rect.right > v.right || rect.top < v.top || rect.bottom > v.bottom) {
        if (event.target.closest('.marquee-tile')) focusElement(stage.querySelector('.category-world'), false);
        else focusElement(event.target.closest('.world-district,.world-intro') || event.target, false);
      }
    }
    stage.scrollLeft = stage.scrollTop = 0;
  });
  stage.addEventListener('dblclick', event => {
    const target = event.target.closest('.world-district,.world-intro,.category-world');
    if (target && !isBlocked() && !event.target.closest('button,a')) focusElement(target);
  });
  // After the glass breaks: start close and blurred, then pull the camera back to the start.
  function dollyIn() {
    if (reduced.matches) return home(false);
    if (lite) return home(true);
    const v = viewport(); home(false);
    camera = zoomAt(camera, 1.35, { x: v.width * .35, y: v.height * .4 }); stage.classList.add('dolly'); paint(false);
    requestAnimationFrame(() => requestAnimationFrame(() => { home(true); setTimeout(() => stage.classList.remove('dolly'), 60); }));
  }
  let resizeTimer; window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (!isBlocked()) home(false); else paint(); }, 120); });
  initializePanels({ stage, canvas, reduced, isBlocked });
  home(false);
  return { home, dollyIn, focusDistrict, focusElement, snapshot: () => ({ ...camera }), restore: value => { camera = { ...value }; paint(true); }, action };
}
