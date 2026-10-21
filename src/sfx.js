// Menu sounds (synthesized), the intro's glass-break clips and the background song.
// Sound is on unless the visitor switches it off; the choice is remembered per browser.
export function createSfx(button) {
  let ctx, on = false, stored = null;
  try { stored = localStorage.getItem('dnsw-sfx'); } catch {}
  on = stored !== 'off';
  let music = null, musicWanted = false, fadeTimer, level = .5;
  try { const saved = parseFloat(localStorage.getItem('dnsw-volume')); if (saved >= 0 && saved <= 1) level = saved; } catch {}
  const musicVolume = () => (Number(music?.dataset.volume) || .4) * level;
  // Recorded clips (the intro's glass break). They play unless the visitor has switched sound off.
  const clips = {};
  const load = (name, src, volume = .8) => { const audio = new Audio(src); audio.preload = 'auto'; audio.volume = volume; clips[name] = audio; };
  function audio() {
    if (!ctx) { const Context = window.AudioContext || window.webkitAudioContext; if (!Context) return null; ctx = new Context(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(from, to, duration, type = 'square', volume = .05, delay = 0) {
    const t = ctx.currentTime + delay, osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(from, t); osc.frequency.exponentialRampToValueAtTime(to, t + duration);
    gain.gain.setValueAtTime(0.0001, t); gain.gain.exponentialRampToValueAtTime(volume, t + .008); gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ctx.destination); osc.start(t); osc.stop(t + duration + .02);
  }
  function swish(duration, volume, from, to, delay = 0) {
    const t = ctx.currentTime + delay, length = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = buffer; filter.type = 'bandpass'; filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(from, t); filter.frequency.exponentialRampToValueAtTime(to, t + duration);
    gain.gain.setValueAtTime(0.0001, t); gain.gain.exponentialRampToValueAtTime(volume, t + duration * .3); gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter).connect(gain).connect(ctx.destination); source.start(t);
  }
  const sounds = {
    move() { tone(880, 1180, .06, 'sine', .035); },
    confirm() { tone(660, 990, .12, 'sine', .06); tone(990, 1320, .14, 'sine', .04, .07); swish(.22, .06, 900, 4200); },
    back() { tone(740, 420, .16, 'sine', .06); },
    page() { swish(.2, .07, 2600, 600); },
    toggle() { tone(660, 880, .08, 'sine', .05); },
  };
  function render() { button.innerHTML = `<span class="icon" aria-hidden="true">${on ? '♪' : '♪̸'}</span><span class="label">${on ? 'Sound on' : 'Sound off'}</span>`; button.setAttribute('aria-label', on ? 'Sound on' : 'Sound off'); button.setAttribute('aria-pressed', String(on)); document.documentElement.classList.toggle('sound-muted', !on); }
  button.addEventListener('click', () => {
    on = !on; stored = on ? 'on' : 'off'; try { localStorage.setItem('dnsw-sfx', stored); } catch {}
    render(); if (on && audio()) sounds.toggle();
    syncMusic();
  });
  // Background song: fades in when started, pauses with Sound off or a hidden tab.
  function fadeTo(target, ms) { clearInterval(fadeTimer); const steps = Math.max(1, ms / 50), start = music.volume, delta = (target - start) / steps; let n = 0; fadeTimer = setInterval(() => { n++; music.volume = Math.min(1, Math.max(0, start + delta * n)); if (n >= steps) { clearInterval(fadeTimer); if (target === 0) music.pause(); } }, 50); }
  function syncMusic() {
    if (!music) return;
    const play = musicWanted && on && !document.hidden;
    if (play && music.paused) { music.volume = 0; music.play().then(() => fadeTo(musicVolume(), 60)).catch(() => {}); }
    else if (!play && !music.paused) fadeTo(0, 400);
  }
  document.addEventListener('visibilitychange', syncMusic);
  render();
  return {
    play(name) { if (on && audio()) sounds[name]?.(); },
    load,
    clip(name) { const audio = clips[name]; if (!audio || !on) return; try { audio.currentTime = 0; audio.play().catch(() => {}); } catch {} },
    music(src, volume = .45) { music ||= Object.assign(new Audio(src), { loop: true, preload: 'auto' }); music.dataset.volume = volume; return { start() { musicWanted = true; syncMusic(); } }; },
    get enabled() { return on; },
    get level() { return level; },
    setLevel(value) { level = Math.max(0, Math.min(1, value)); try { localStorage.setItem('dnsw-volume', level.toFixed(2)); } catch {} if (music && !music.paused) { clearInterval(fadeTimer); music.volume = musicVolume(); } },
  };
}
