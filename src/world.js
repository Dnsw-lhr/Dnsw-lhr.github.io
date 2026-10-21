import { profile } from './content.js';
import { initializeAvatarViewer } from './avatar-viewer.js';
import { initializeIntro } from './intro.js';
import { initializeMediaViewer } from './media-viewer.js';
import { initializeExploration } from './exploration.js';
import { initializeThrowable } from './throwable.js';
import { shatterScreen } from './shatter.js';
import { initializeLinks } from './links.js';
import { createSfx } from './sfx.js';
import { esc } from './ransom.js';

// Drag-to-explore world, story readers, routing, and Cassy's local loop.
export function initializeWorld({ stories, sections }) {
  const root = document.querySelector('.portfolio-world');
  const stage = document.querySelector('.world-stage');
  const reader = document.querySelector('.story-reader');
  const title = document.querySelector('#reader-title');
  const body = reader.querySelector('.reader-body');
  const plate = reader.querySelector('.reader-plate');
  const content = reader.querySelector('.reader-content');
  const chapters = reader.querySelector('.reader-chapters');
  const status = document.querySelector('#world-status');
  const art = document.querySelector('.character-media');
  const video = art.querySelector('video');
  const motion = document.querySelector('.motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const lite = document.documentElement.classList.contains('lite');
  const sfx = createSfx(document.querySelector('.sfx-toggle'));
  const byId = new Map(stories.map(story => [story.id, story]));
  const sectionById = new Map(sections.map(section => [section.id, section]));
  let activeStory = null, closing = null, chapter = 0, lastSlide = null, savedFocus, savedCamera, readerTimer, swapTimer;
  let paused = false, artFailed = false, pendingPlay = false, openingArt = false, cassyVisible = true;
  const entering = () => Boolean(document.querySelector('.entrance'));
  const explorer = initializeExploration({ stage, root, reduced, isBlocked: () => Boolean(activeStory) || entering() || document.querySelector('.media-viewer').open });
  initializeMediaViewer({ content });
  const links = initializeLinks({ canvas: document.querySelector('.world-canvas') });
  if (!reduced.matches) { sfx.load('impact', './assets/sfx/shatter-impact.mp3', .38); sfx.load('explosion', './assets/sfx/shatter-explosion.mp3', .34); }
  const song = sfx.music('./assets/music/never-regret.mp3', .4);
  // Music volume: drag the red bar up/down (or use arrow keys). 100% = the song's full level.
  const volume = document.querySelector('.volume'), track = volume.querySelector('.volume-track');
  function showLevel(value) { const pct = Math.round(value * 100); volume.style.setProperty('--level', value); volume.setAttribute('aria-valuenow', pct); volume.setAttribute('aria-valuetext', `${pct}%`); volume.querySelector('.volume-value').textContent = `${pct}%`; }
  function setLevel(value) { sfx.setLevel(value); showLevel(sfx.level); }
  const levelAt = y => { const r = track.getBoundingClientRect(); return 1 - (y - r.top) / r.height; };
  volume.addEventListener('pointerdown', event => { event.preventDefault(); event.stopPropagation(); volume.setPointerCapture(event.pointerId); volume.classList.add('is-dragging'); setLevel(levelAt(event.clientY)); });
  volume.addEventListener('pointermove', event => { if (volume.hasPointerCapture(event.pointerId)) setLevel(levelAt(event.clientY)); });
  const release = event => { if (volume.hasPointerCapture(event.pointerId)) volume.releasePointerCapture(event.pointerId); volume.classList.remove('is-dragging'); };
  volume.addEventListener('pointerup', release); volume.addEventListener('pointercancel', release);
  volume.addEventListener('wheel', event => { event.preventDefault(); event.stopPropagation(); setLevel(sfx.level - Math.sign(event.deltaY) * .05); }, { passive: false });
  volume.addEventListener('keydown', event => {
    const steps = { ArrowUp: .05, ArrowRight: .05, ArrowDown: -.05, ArrowLeft: -.05, PageUp: .2, PageDown: -.2 };
    if (event.key in steps) { event.preventDefault(); event.stopPropagation(); setLevel(sfx.level + steps[event.key]); }
    else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); event.stopPropagation(); setLevel(event.key === 'End' ? 1 : 0); }
  });
  showLevel(sfx.level);
  // Buffer the local loop during the conversation, without starting motion.
  if (!reduced.matches && !lite) { video.preload = 'auto'; video.src = video.dataset.src; video.load(); }

  // Gentle 3D tilt toward the mouse on panels and the intro.
  document.querySelectorAll('[data-tilt],.world-intro').forEach(element => {
    element.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || root.classList.contains('motion-paused') || element.classList.contains('panel-moving')) return;
      const r = element.getBoundingClientRect();
      element.style.setProperty('--ry', `${((event.clientX - r.left) / r.width - .5) * 12}deg`);
      element.style.setProperty('--gx', `${((event.clientX - r.left) / r.width * 100).toFixed(1)}%`); element.style.setProperty('--gy', `${((event.clientY - r.top) / r.height * 100).toFixed(1)}%`);
      element.style.setProperty('--rx', `${((event.clientY - r.top) / r.height - .5) * -10}deg`);
    });
    element.addEventListener('pointerleave', () => { element.style.setProperty('--rx', '0deg'); element.style.setProperty('--ry', '0deg'); });
  });

  function stopStoryMedia() {
    content.querySelectorAll('video').forEach(item => item.pause());
    content.querySelectorAll('iframe').forEach(frame => frame.remove());
  }
  // Throwable toolkit tags need the reader to be visible so they can measure themselves.
  const startToys = () => requestAnimationFrame(() => { if (activeStory?.id === 'skills') initializeThrowable(content.querySelector('[data-throwable]:not(.is-physics)'), reduced); });
  function paint(focus) {
    stopStoryMedia();
    const page = activeStory.pages[chapter];
    reader.querySelector('.reader-chapter').textContent = `${String(chapter + 1).padStart(2, '0')} — ${page.label}`;
    title.textContent = page.heading;
    chapters.innerHTML = activeStory.pages.map((item, i) => `<button type="button" data-chapter="${i}" style="--i:${i}" ${i === chapter ? 'aria-current="page"' : ''}><span>${String(i + 1).padStart(2, '0')}</span>${esc(item.label)}</button>`).join('');
    reader.classList.toggle('story-carousel', activeStory.id === 'story');
    if (activeStory.id === 'story') {
      content.innerHTML = `<div class="story-carousel-window" role="region" aria-roledescription="carousel" aria-label="About Dnsw"><div class="story-carousel-track" style="--slide:${lastSlide ?? chapter}">${activeStory.pages.map((item, i) => `<article class="story-slide ${i === chapter ? 'is-active' : ''}" ${i === chapter ? '' : 'inert aria-hidden="true"'}>${item.html}</article>`).join('')}</div></div><nav class="story-dots" aria-label="Choose a story slide">${activeStory.pages.map((item, i) => `<button type="button" data-chapter="${i}" aria-label="Slide ${i + 1}: ${item.label}" ${i === chapter ? 'aria-current="step"' : ''}>${i + 1}</button>`).join('')}</nav>`;
      const track = content.querySelector('.story-carousel-track');
      if (lastSlide !== null && lastSlide !== chapter) requestAnimationFrame(() => requestAnimationFrame(() => track.style.setProperty('--slide', chapter)));
      lastSlide = chapter;
      if (chapter === 0) initializeAvatarViewer({ container: content.querySelector('[data-avatar-viewer]'), model: profile.avatarModel });
    } else content.innerHTML = page.html;
    if (reader.open && !reader.classList.contains('is-entering')) startToys();
    const backdrop = content.querySelector('.story-media img');
    reader.style.setProperty('--story-art', backdrop ? `url("${backdrop.src}")` : 'none');
    reader.querySelector('.chapter-counter').textContent = `${String(chapter + 1).padStart(2, '0')} / ${String(activeStory.pages.length).padStart(2, '0')}`;
    reader.querySelector('.chapter-track > span').style.width = `${(chapter + 1) / activeStory.pages.length * 100}%`;
    reader.querySelector('.chapter-prev').disabled = chapter === 0;
    reader.querySelector('.chapter-next').innerHTML = chapter === activeStory.pages.length - 1 ? '<span class="hide-sm">Back to the </span>map <span aria-hidden="true">→</span>' : 'Next <span aria-hidden="true">→</span>';
    body.scrollTop = 0;
    if (focus) title.focus({ preventScroll: true });
    status.textContent = `${activeStory.title}. ${page.label}. ${chapter + 1} of ${activeStory.pages.length}.`;
  }
  // Chapters slide out and in; instant under reduced motion.
  function renderChapter(focus = true, direction = 0) {
    clearTimeout(swapTimer);
    if (!direction || !reader.open || reduced.matches || activeStory.id === 'story') { paint(focus); return; }
    plate.style.setProperty('--dir', direction);
    plate.classList.remove('is-arriving'); plate.classList.add('is-leaving');
    swapTimer = setTimeout(() => { if (!activeStory) return; paint(focus); plate.classList.remove('is-leaving'); void plate.offsetWidth; plate.classList.add('is-arriving'); }, 170);
  }
  function applySection(story) {
    const section = sectionById.get(story.id);
    reader.dataset.sec = story.id;
    for (const target of [reader, document.documentElement]) { target.style.setProperty('--sec', section.color); target.style.setProperty('--sec-ink', section.ink); }
    reader.querySelector('.reader-ghost').textContent = section.label;
    reader.querySelector('.reader-category').innerHTML = `${esc(section.label)}<small>${esc(story.category)}</small>`;
  }
  function openStory(story, selectedChapter = 0) {
    clearTimeout(readerTimer);
    if (closing) { clearTimeout(closing); closing = null; if (!activeStory && reader.open) { reader.close(); reader.getAnimations().forEach(a => a.cancel()); plate.getAnimations().forEach(a => a.cancel()); } }
    if (reader.open && activeStory === story) { const direction = Math.sign(selectedChapter - chapter); chapter = selectedChapter; renderChapter(true, direction); return; }
    if (!activeStory) { savedFocus = document.activeElement; savedCamera = explorer.snapshot(); }
    activeStory = story; chapter = selectedChapter; lastSlide = null;
    applySection(story); paint(false); syncMotion();
    if (reader.open) { title.focus({ preventScroll: true }); return; }
    if (reduced.matches) { reader.showModal(); title.focus({ preventScroll: true }); startToys(); return; }
    // Zoom the camera toward the story, then the page grows out of the panel/tile you picked (a 3D "portal").
    explorer.focusDistrict(story.id, story.id === 'games' || story.id === 'art' ? selectedChapter : 0);
    readerTimer = setTimeout(() => {
      if (!activeStory) return;
      const from = sourceRect(story.id);
      reader.classList.add('is-entering'); reader.showModal(); title.focus({ preventScroll: true });
      portal(from, true);
      readerTimer = setTimeout(() => { reader.classList.remove('is-entering'); startToys(); }, 760);
    }, 460);
  }
  // Where a story lives on screen: the control that opened it, or its panel.
  function sourceRect(id) {
    const inWorld = savedFocus?.closest?.('.world-stage') && savedFocus.matches('button') ? savedFocus : null;
    const element = inWorld || document.querySelector(`.world-stage [data-district="${id}"]`);
    const r = element?.getBoundingClientRect();
    return r && r.width && r.bottom > 0 && r.top < innerHeight ? r : null;
  }
  function portal(from, opening) {
    reader.getAnimations().forEach(a => a.cancel()); plate.getAnimations().forEach(a => a.cancel());
    const to = plate.getBoundingClientRect();
    const start = from ? `translate(${from.left - to.left}px,${from.top - to.top}px) scale(${from.width / to.width},${from.height / to.height}) rotateX(16deg) rotateY(-14deg)` : 'translateY(40px) scale(.94) rotateX(10deg)';
    const frames = [{ transform: start, opacity: .35, filter: 'blur(2px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }];
    plate.style.transformOrigin = '0 0';
    const timing = opening ? { duration: 720, easing: 'cubic-bezier(.16,1,.3,1)' } : { duration: 320, easing: 'cubic-bezier(.6,0,.8,.4)', fill: 'forwards' };
    const animation = plate.animate(opening ? frames : frames.reverse(), timing);
    reader.animate(opening ? [{ backgroundColor: 'transparent' }, { backgroundColor: 'var(--sec)' }] : [{ opacity: 1 }, { opacity: 0 }], { duration: opening ? 420 : 320, easing: 'ease-out', fill: opening ? 'none' : 'forwards' });
    return animation;
  }
  function closeStory(updateUrl = true) {
    clearTimeout(readerTimer); clearTimeout(swapTimer);
    reader.classList.remove('is-entering');
    if (!activeStory) return;
    const closingId = activeStory.id;
    activeStory = null;
    if (savedCamera) explorer.restore(savedCamera);
    stopStoryMedia();
    if (reader.open) {
      if (reduced.matches) reader.close();
      else { const into = sourceRect(closingId); portal(into, false); closing = setTimeout(() => { reader.close(); reader.getAnimations().forEach(a => a.cancel()); plate.getAnimations().forEach(a => a.cancel()); }, 300); }
    }
    if (updateUrl) history.replaceState(null, '', '#world');
    const destination = savedFocus?.isConnected && !reader.contains(savedFocus) && savedFocus !== document.body ? savedFocus : document.querySelector('#intro-heading');
    destination.focus({ preventScroll: true });
    status.textContent = 'Back to the map.';
    syncMotion();
  }
  function route() {
    if (entering()) return;
    let id, selectedChapter = 0;
    try { const parts = decodeURIComponent(location.hash.slice(1)).split('/'); id = parts[0]; selectedChapter = Number(parts[1]) || 0; } catch { id = 'world'; }
    if (byId.has(id)) { const story = byId.get(id); openStory(story, Number.isInteger(selectedChapter) && selectedChapter >= 0 && selectedChapter < story.pages.length ? selectedChapter : 0); }
    else closeStory(false);
  }
  function navigate(id, selectedChapter = 0) {
    if (!byId.has(id)) return;
    if (!location.hash || location.hash === '#main') history.replaceState(null, '', '#world');
    const hash = selectedChapter ? `${id}/${selectedChapter}` : id;
    if (location.hash === `#${hash}`) openStory(byId.get(id), selectedChapter); else location.hash = hash;
  }
  function moveChapter(delta) {
    if (!activeStory) return;
    if (chapter + delta >= activeStory.pages.length) { sfx.play('back'); closeStory(); return; }
    if (chapter + delta < 0) return;
    chapter += delta; sfx.play('page'); renderChapter(true, delta);
  }
  function jumpTo(target) {
    if (!activeStory || target === chapter) return;
    const direction = Math.sign(target - chapter); chapter = target; sfx.play('page'); renderChapter(true, direction);
  }

  document.querySelectorAll('[data-open-story]').forEach(button => button.addEventListener('click', () => { sfx.play('confirm'); navigate(button.dataset.openStory, Number(button.dataset.storyChapter) || 0); }));
  document.querySelectorAll('.world-stage button, .site-header button, .world-footer button').forEach(button => button.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') sfx.play('move'); }));
  document.querySelector('[data-home]').addEventListener('click', () => { closeStory(); explorer.home(); document.querySelector('#intro-heading').focus({ preventScroll: true }); });
  reader.querySelectorAll('.reader-close').forEach(button => button.addEventListener('click', () => { sfx.play('back'); closeStory(); }));
  reader.addEventListener('cancel', event => { event.preventDefault(); sfx.play('back'); closeStory(); });
  reader.addEventListener('close', () => { if (activeStory) closeStory(); });
  reader.querySelector('.chapter-prev').addEventListener('click', () => moveChapter(-1));
  reader.querySelector('.chapter-next').addEventListener('click', () => moveChapter(1));
  chapters.addEventListener('click', event => { const button = event.target.closest('[data-chapter]'); if (button) jumpTo(Number(button.dataset.chapter)); });
  reader.addEventListener('keydown', event => {
    if (event.target.closest('a,input,textarea,video,iframe,model-viewer,[data-avatar-viewer]')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveChapter(event.key === 'ArrowRight' ? 1 : -1); }
  });
  let swipe;
  content.addEventListener('pointerdown', event => { if (activeStory?.id === 'story' && !event.target.closest('button,a,model-viewer,[data-avatar-viewer]')) swipe = { x: event.clientX, y: event.clientY }; });
  content.addEventListener('pointerup', event => { if (!swipe) return; const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y; swipe = null; if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.4) moveChapter(dx < 0 ? 1 : -1); });
  content.addEventListener('pointercancel', () => swipe = null);
  content.addEventListener('click', event => {
    const chapterButton = event.target.closest('[data-chapter]');
    if (chapterButton && activeStory) { jumpTo(Number(chapterButton.dataset.chapter)); return; }
    const play = event.target.closest('[data-youtube]');
    if (!play || !/^[a-zA-Z0-9_-]{11}$/.test(play.dataset.youtube)) return;
    const frame = document.createElement('iframe');
    frame.title = play.dataset.videoTitle;
    frame.src = `https://www.youtube-nocookie.com/embed/${play.dataset.youtube}?autoplay=1&rel=0`;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    play.parentElement.replaceChildren(frame);
    frame.focus();
  });
  window.addEventListener('hashchange', route);

  function syncMotion() {
    const stopped = paused || reduced.matches || document.hidden || Boolean(activeStory) || (entering() && !openingArt);
    root.classList.toggle('motion-paused', stopped);
    links.pause(paused || reduced.matches || document.hidden || lite);
    reader.classList.toggle('motion-paused', paused || reduced.matches);
    const label = reduced.matches ? 'Motion reduced' : paused ? 'Resume motion' : 'Pause motion';
    motion.innerHTML = `<span class="icon" aria-hidden="true">${paused || reduced.matches ? '▶' : '❚❚'}</span><span class="label">${label}</span>`; motion.setAttribute('aria-label', label);
    motion.disabled = reduced.matches;
    motion.setAttribute('aria-pressed', String(paused || reduced.matches));
    if (stopped || artFailed || lite || !cassyVisible) { video.pause(); art.classList.remove('video-ready'); return; }
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    if (!video.paused || pendingPlay) return;
    pendingPlay = true;
    video.play().then(() => {
      pendingPlay = false;
      if (!paused && !reduced.matches && !document.hidden && !activeStory && cassyVisible) art.classList.add('video-ready');
      else syncMotion();
    }).catch(() => { pendingPlay = false; art.classList.remove('video-ready'); });
  }
  // Fade the whole model at the loop seam; the poster is shown while paused.
  function loopFade() {
    const duration = video.duration;
    const edge = Number.isFinite(duration) ? Math.min(video.currentTime / .45, (duration - video.currentTime) / .45, 1) : 1;
    const opacity = Math.max(0, edge); art.style.setProperty('--loop-opacity', String(opacity * opacity * (3 - 2 * opacity)));
  }
  if (video.requestVideoFrameCallback) { const update = () => { loopFade(); video.requestVideoFrameCallback(update); }; video.requestVideoFrameCallback(update); }
  else video.addEventListener('timeupdate', loopFade);
  new IntersectionObserver(entries => { cassyVisible = entries[0].isIntersecting; syncMotion(); }).observe(document.querySelector('.cassy'));
  motion.addEventListener('click', () => { paused = !paused; sfx.play('toggle'); syncMotion(); });
  video.addEventListener('error', () => { artFailed = true; syncMotion(); });
  reduced.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', () => { if (document.hidden) content.querySelectorAll('video').forEach(item => item.pause()); syncMotion(); });

  // A small label that trails the mouse and says what a click or drag will do.
  const cursor = document.querySelector('.cursor-label'), cursorText = cursor.querySelector('span');
  let cx = 0, cy = 0, tx = 0, ty = 0, cursorFrame = null;
  const follow = () => { cx += (tx - cx) * .22; cy += (ty - cy) * .22; cursor.style.transform = `translate(${cx}px,${cy}px)`; cursorFrame = Math.abs(tx - cx) + Math.abs(ty - cy) > .3 ? requestAnimationFrame(follow) : null; };
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const t = event.target;
    const label = activeStory || entering() ? '' : stage.classList.contains('is-dragging') ? 'dragging' : t.closest?.('.marquee-tile,[data-open-story]') && t.closest('.world-stage') ? 'open' : t.closest?.('.minimap') ? 'fly' : t.closest?.('.volume') ? 'volume' : t.closest?.('.panel-grip') || (t.closest?.('.world-district') && !t.closest('button,a')) ? 'move' : t.closest?.('.world-stage') && !t.closest('button,a') ? 'drag' : '';
    cursorText.textContent = label; cursor.classList.toggle('is-on', Boolean(label)); cursor.dataset.mode = label;
    tx = event.clientX; ty = event.clientY;
    if (reduced.matches) { cx = tx; cy = ty; cursor.style.transform = `translate(${cx}px,${cy}px)`; } else cursorFrame ||= requestAnimationFrame(follow);
  });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  initializeIntro({ root, reduced,
    onArtFirst: () => {
      openingArt = true;
      const line = document.querySelector('.entrance .dialogue-shell'), rect = line?.getBoundingClientRect();
      // Everything but Cassy is invisible during the hitstop, then fades in slowly as the glass bursts away.
      const unveil = () => { clearTimeout(veilTimer); root.classList.remove('ui-veiled'); root.classList.add('ui-unveiling'); };
      const veilTimer = setTimeout(unveil, 4500);
      const shattering = shatterScreen({ lite, source: line, impact: rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null, reduced,
        onImpact: () => sfx.clip('impact'),
        onBurst: () => { unveil(); sfx.clip('explosion'); song.start(); explorer.dollyIn(); root.classList.add('quake'); setTimeout(() => root.classList.remove('quake'), 500); } });
      if (shattering) root.classList.add('ui-veiled'); else unveil();
      if (video.readyState >= 2) video.currentTime = .5; syncMotion();
    },
    onReady: () => { openingArt = false; song.start(); syncMotion(); route(); } });
}
