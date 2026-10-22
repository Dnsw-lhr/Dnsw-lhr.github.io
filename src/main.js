import { profile, skills, projectGroups } from './content.js';
import { storyMedia } from './story-media.js';
import { initializeWorld } from './world.js';
import { esc as text } from './ransom.js';

// Lite mode for phones/tablets and low-power devices: same site, fewer expensive effects. (?lite / ?full to force.)
const query = new URLSearchParams(location.search);
const lite = query.has('lite') || (!query.has('full') && (matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 2));
document.documentElement.classList.toggle('lite', lite);
const safeUrl = (value = '') => /^(https?:\/\/|mailto:|\.\/assets\/)/i.test(value) ? text(value) : '';
const links = (items = []) => items.filter(item => safeUrl(item.url)).map(item => `<a class="inline-link" href="${safeUrl(item.url)}" target="_blank" rel="noopener noreferrer">${text(item.label)} <span aria-hidden="true">↗</span></a>`).join('');
const paragraphs = value => String(value).split(/\n\s*\n/).map(p=>`<p>${text(p).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')}</p>`).join('');
const tags = items => `<div class="tags" data-throwable>${items.map(item => `<span>${text(item)}</span>`).join('')}</div>`;
function mediaFor(entry) {
  const media = storyMedia[entry.title];
  if (!media) return '';
  return `<div class="story-media">${media.loop ? `<figure class="loop-figure"><video class="story-loop" controls loop muted playsinline preload="metadata" poster="${safeUrl(media.poster)}"><source src="${safeUrl(media.loop)}" type="video/webm"/></video><figcaption>Cassy / transparent animation study · Play to loop</figcaption></figure>` : ''}
    ${(media.videos || (media.youtube ? [{id:media.youtube,label:media.videoLabel}] : [])).map(clip => `<div class="video-frame" data-video-frame><button class="video-load" type="button" style="--video-poster:url('${safeUrl(new URL(media.images[0]?.src || media.poster, document.baseURI || 'http://localhost/').href)}')" data-youtube="${text(clip.id)}" data-video-title="${text(clip.label)}"><span aria-hidden="true">▶</span><strong>${text(clip.label)}</strong><small>Loads YouTube on play</small></button></div><a class="video-external" href="https://www.youtube.com/watch?v=${text(clip.id)}" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a>`).join('')}
    ${media.images.length ? `<div class="media-gallery">${media.images.map(image => `<figure><a href="${safeUrl(image.src)}" target="_blank" rel="noopener" aria-label="Open full image: ${text(image.alt)}"><img src="${safeUrl(image.src)}" alt="${text(image.alt)}" loading="lazy"/></a><figcaption>${text(image.caption)}${image.source ? ` <a href="${safeUrl(image.source)}" target="_blank" rel="noopener noreferrer">Original post ↗</a>` : ''}</figcaption></figure>`).join('')}</div>` : ''}</div>`;
}

// ---- Stories (reader pages). Copy comes from content.js / story-media.js. ----
const groups = projectGroups;
const stories = groups.map((group, index) => ({
  id: index ? 'art' : 'games', title: index ? 'My art' : 'My games', category: index ? 'Art & animation' : 'Game development',
  pages: [{label: index ? 'All my art' : 'All my games', heading:group.title, html:`<p class="reader-lead">${text(group.description)}</p><div class="category-entries">${group.entries.map((entry,n) => `<button type="button" data-chapter="${n+1}"><span>0${n+1}</span><strong>${text(entry.title)}</strong><b aria-hidden="true">→</b></button>`).join('')}</div>`},
    ...group.entries.map(entry => ({label:entry.title,heading:entry.title,html:`<div class="story-writing"><p class="reader-lead">${text(entry.heading)}</p>${paragraphs(entry.description)}<div class="story-links">${links(entry.links)}</div></div>${mediaFor(entry)}`}))],
}));
stories.push({id:'story',title:'About me',category:`About ${profile.displayName}`,pages:[{label:'Hello',heading:`I'm ${profile.displayName}.`,html:`<div class="avatar-profile" data-avatar-viewer><div class="avatar-model-slot"></div><img src="${safeUrl(profile.avatar)}" alt="Dnsw’s current Roblox avatar"/><a class="inline-link" href="https://www.roblox.com/users/1258781480/profile" target="_blank" rel="noopener">Roblox profile <span aria-hidden="true">↗</span></a><p class="avatar-viewer-note">Roblox avatar</p></div><p class="reader-lead">${text(profile.role)}</p><p>${text(profile.introduction)}</p>`},...profile.about.slice(1).map((paragraph,index)=>({label:`About / ${index+1}`,heading:'Art is where I start.',html:`<p>${text(paragraph)}</p>`})),...profile.story.map((paragraph,index)=>({label:`My story / ${index+1}`,heading:'Making my own world.',html:`<p>${text(paragraph)}</p>`}))]});
stories.push({id:'skills',title:'My toolkit',category:'Tools & skills',pages:skills.map(group=>({label:group.category,heading:group.category,html:`${tags(group.items)}<p class="toy-hint" hidden>Grab a tool and throw it</p>`}))});
stories.push({id:'contact',title:'Contact me',category:'Public profiles',pages:[{label:'Find me',heading:'Keep in touch.',html:`<div class="calling-card"><p class="reader-lead">My art, games and updates live on these public profiles.</p><div class="story-links">${links(profile.links)}</div></div>`}]});
const storyById = new Map(stories.map(story => [story.id, story]));

// Each section gets one of four colors: ink, paper, red, orange (white text on red, orange and ink).
const sections = [
  {id:'story', short:'About', label:'About me', color:'#d9564b', ink:'#fffaf2'},
  {id:'games', short:'Games', label:'My games', color:'#1b1a19', ink:'#fffaf2'},
  {id:'art', short:'Art', label:'My art', color:'#e2803f', ink:'#fffaf2'},
  {id:'skills', short:'Toolkit', label:'My toolkit', color:'#f2ede4', ink:'#1b1a19'},
  {id:'contact', short:'Contact', label:'Contact me', color:'#d9564b', ink:'#fffaf2'},
];
const firstPage = (id, prefix) => storyById.get(id).pages.findIndex(page => page.label.startsWith(prefix));
const img = (src, alt = '') => `<img src="${safeUrl(src)}" alt="${text(alt)}" draggable="false" loading="lazy" decoding="async"/>`;
const thumb = entry => storyMedia[entry.title].images[0]?.src || storyMedia[entry.title].poster;

// Endless strip of every project, each tile opening its own chapter.
const works = [
  ...groups[0].entries.map((entry,i) => ({id:'games', chapter:i+1, title:entry.title, kind:'My games', src:thumb(entry)})),
  ...groups[1].entries.map((entry,i) => ({id:'art', chapter:i+1, title:entry.title, kind:'My art', src:thumb(entry)})),
  {id:'art', chapter:2, title:'Drawings & Communities', kind:'My art', src:'./assets/stories/drawing-02.jpg'},
  {id:'games', chapter:1, title:'RE//SLASH', kind:'My games', src:'./assets/stories/reslash-combat.webp'},
];
const strip = focusable => `<div class="marquee-group">${works.map((work,i)=>`<button type="button" class="marquee-tile tile-${work.id}" data-open-story="${work.id}" data-story-chapter="${work.chapter}" tabindex="${focusable?0:-1}" aria-label="${text(work.kind)}: ${text(work.title)}" style="--n:${i}">${img(work.src)}<span><small>${text(work.kind)}</small><strong>${text(work.title)}</strong></span></button>`).join('')}</div>`;
const ticker = `<span>Play</span><i>✶</i><span>Draw</span><i>✶</i><span>Make</span><i>✶</i><span>Move</span><i>✶</i>`;

const panel = ({id, cls, number, title, body, grip}) => `<section class="world-district ${cls}" data-district="${id}" data-tilt aria-label="${text(grip)} panel"><button class="panel-grip" type="button" aria-label="Move the ${text(grip)} panel: drag or use arrow keys; Home resets"><span aria-hidden="true">⠿</span> move</button><p class="eyebrow">${number}</p>${title}${body}</section>`;
const projectButtons = (id, entries, posterFirst) => `<div class="district-projects">${entries.map((entry,i)=>`<button type="button" data-open-story="${id}" data-story-chapter="${i+1}">${img(posterFirst ? (storyMedia[entry.title].poster || thumb(entry)) : thumb(entry))}<span>${text(entry.title)} <b aria-hidden="true">→</b></span></button>`).join('')}</div>`;

document.title = `${profile.displayName} — ${profile.role}`;
document.querySelector('meta[name="description"]').content = profile.introduction;
document.querySelector('#app').innerHTML = `
<div class="portfolio-world awaiting-entry">
  <header class="site-header">
    <button class="brand" type="button" data-home aria-label="${text(profile.displayName)} — back to the start">${text(profile.displayName)}<span aria-hidden="true">.</span></button>
    <nav class="site-nav" aria-label="Portfolio">${sections.map(s=>`<button type="button" data-open-story="${s.id}" style="--sec:${s.color}" aria-label="${text(s.label)}"><span class="nav-long" aria-hidden="true">${text(s.label)}</span><span class="nav-short" aria-hidden="true">${text(s.short)}</span></button>`).join('')}</nav>
    <div class="toggles"><button type="button" class="sfx-toggle" aria-pressed="false">Sound off</button><button class="motion-toggle" type="button" aria-pressed="false">Pause motion</button></div>
  </header>

  <main id="main" class="world-stage" tabindex="0" aria-label="Explore the portfolio: drag in any direction, use arrow keys, or the camera buttons">
    <div class="world-backdrop" aria-hidden="true"><svg class="contours" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice"><g>${Array.from({length:9},(_,i)=>`<path d="M-50 ${120+i*70} C 220 ${40+i*70}, 380 ${230+i*68}, 640 ${150+i*70} S 1020 ${60+i*72}, 1260 ${170+i*66}"/>`).join('')}</g></svg><div class="grain"></div></div>
    <div class="cassy-layer" aria-hidden="true"><figure class="cassy" aria-hidden="true"><span class="cassy-ring"></span><div class="character-media"><img src="./assets/cassy-chroma.webp" alt="" draggable="false"/><video muted loop playsinline preload="none" data-src="./assets/cassy-chroma.webm" tabindex="-1"></video></div><figcaption>Cassy — fan animation, looped</figcaption></figure></div>
    <div class="world-lens"><div class="world-canvas">
      <svg class="world-links" aria-hidden="true"></svg>
      <div class="dot-grid" aria-hidden="true"></div>
      <section class="world-intro" data-district="intro">
        <p class="eyebrow">Hello, I’m</p>
        <div class="name-row">
          <h1 id="intro-heading" tabindex="-1" class="layered-name"><span class="name-layer back" aria-hidden="true">${text(profile.displayName)}</span><span class="name-layer mid" aria-hidden="true">${text(profile.displayName)}</span><span class="name-front">${text(profile.displayName)}<i>.</i></span></h1>
          <div class="volume" role="slider" tabindex="0" aria-label="Music volume" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><span class="volume-label" aria-hidden="true">VOL</span><span class="volume-track" aria-hidden="true"><span class="volume-fill"></span><span class="volume-knob"></span></span><output class="volume-value" aria-hidden="true">50%</output></div>
        </div>
        <p class="intro-role">${text(profile.role)}</p>
        <p class="intro-note">${text(profile.headline)}</p>
        <div class="intro-actions"><button type="button" class="cta" data-open-story="story">Read my story <span aria-hidden="true">→</span></button><button type="button" class="cta ghost" data-camera="works">Browse my work <span aria-hidden="true">↓</span></button></div>
        <p class="drag-hint" aria-hidden="true"><svg viewBox="0 0 120 60"><path d="M6 12 C 40 4, 70 44, 112 40 M100 30 L113 40 L100 50"/></svg>drag anywhere to explore</p>
      </section>


      ${panel({id:'games', cls:'district-games', number:'01 — My games', grip:'My games', title:`<h2>Games I build<i>.</i></h2>`, body:`<p class="panel-note">Roblox & Unity. Fast combat, small details.</p>${projectButtons('games', groups[0].entries)}<button type="button" class="panel-more" data-open-story="games">See all my games <span aria-hidden="true">→</span></button>`})}
      ${panel({id:'art', cls:'district-art', number:'02 — My art', grip:'My art', title:`<h2>A line becomes<br>a character<i>.</i></h2>`, body:`${projectButtons('art', groups[1].entries, true)}<button type="button" class="panel-more" data-open-story="art">See all my art <span aria-hidden="true">→</span></button>`})}
      ${panel({id:'story', cls:'district-about', number:'03 — About me', grip:'About me', title:`<h2>Art is where<br>I start<i>.</i></h2>`, body:`<div class="about-row">${img(profile.avatar,'')}<ul><li><button type="button" data-open-story="story" data-story-chapter="0">Say hello</button></li><li><button type="button" data-open-story="story" data-story-chapter="${firstPage('story','About')}">How I work</button></li><li><button type="button" data-open-story="story" data-story-chapter="${firstPage('story','My story')}">My story</button></li></ul></div>`})}
      ${panel({id:'skills', cls:'utility-panel district-skills', number:'04 — My toolkit', grip:'My toolkit', title:'', body:`<button type="button" class="utility-open" data-open-story="skills"><strong>My toolkit</strong><span>What I make things with →</span></button>`})}
      ${panel({id:'contact', cls:'utility-panel district-contact', number:'05 — Contact me', grip:'Contact me', title:'', body:`<button type="button" class="utility-open" data-open-story="contact"><strong>Contact me</strong><span>Art & public profiles →</span></button>`})}

      <section class="category-world" data-district="works" aria-labelledby="works-heading">
        <div class="works-heading"><h2 id="works-heading">Everything I’ve made<i>,</i> <em>on repeat.</em></h2><span>Click any piece to open its story</span></div>
        <div class="perspective-window"><div class="perspective-marquee"><div class="marquee-lane"><div class="marquee-run">${strip(true)}<div class="marquee-repeat" aria-hidden="true">${strip(false)}</div></div></div></div></div>
        <div class="ticker" aria-hidden="true"><div class="ticker-run">${ticker.repeat(6)}</div></div>
      </section>
      <span class="world-note note-a" aria-hidden="true">games →</span><span class="world-note note-b" aria-hidden="true">art ↘</span>
    </div></div>
    <nav class="minimap" aria-label="Mini map: jump to a place"><div class="minimap-world"><span class="minimap-view" aria-hidden="true"></span></div></nav>
  </main>

  <footer class="world-footer"><div class="camera-controls" aria-label="Camera"><button type="button" data-camera="home">Start</button><button type="button" data-camera="overview">See all</button><button type="button" data-camera="works">My work</button><button type="button" data-camera="out" aria-label="Zoom out">−</button><output class="zoom-readout" aria-label="Camera zoom">100%</output><button type="button" data-camera="in" aria-label="Zoom in">+</button></div><p class="exploration-hint">Drag · scroll · pinch to explore</p></footer>
  <div class="cursor-label" aria-hidden="true"><span></span></div>
  <p class="sr-only" id="world-status" role="status" aria-live="polite"></p>

  <dialog class="story-reader" aria-labelledby="reader-title">
    <div class="reader-bg" aria-hidden="true"><span class="reader-ghost"></span></div>
    <header class="reader-top"><button type="button" class="reader-close reader-back"><span aria-hidden="true">←</span> Back to the map</button><p class="reader-category"></p><button type="button" class="reader-close reader-x" aria-label="Close story">×</button></header>
    <nav class="reader-chapters" aria-label="Chapters"></nav>
    <article class="reader-plate"><div class="reader-body" tabindex="0"><p class="eyebrow reader-chapter"></p><h2 id="reader-title" tabindex="-1"></h2><div class="reader-content"></div></div></article>
    <footer class="reader-footer"><button type="button" class="chapter-prev"><span aria-hidden="true">←</span> Prev<span class="hide-sm">ious</span></button><div class="chapter-progress"><span class="chapter-counter"></span><span class="chapter-track"><span></span></span></div><button type="button" class="chapter-next">Next <span aria-hidden="true">→</span></button></footer>
  </dialog>
  <dialog class="media-viewer" aria-labelledby="media-viewer-title"><header><h2 id="media-viewer-title">Image detail</h2><div><button type="button" data-media-zoom="fit">Fit</button><button type="button" data-media-zoom="actual">100%</button><button type="button" data-media-zoom="out" aria-label="Zoom image out">−</button><button type="button" data-media-zoom="in" aria-label="Zoom image in">+</button><button class="image-close" type="button" aria-label="Close image detail">×</button></div></header><div class="image-viewport" tabindex="0" aria-label="Image: use scrollbars or arrow keys to explore"><img alt=""/></div></dialog>

  <div class="entrance" role="dialog" aria-modal="true" aria-labelledby="entrance-title"><h2 id="entrance-title" class="sr-only">A conversation before the story</h2>
    <div class="dialogue-shell"><p class="dialogue-line" aria-live="polite"></p><p class="thinking-text" role="status" hidden>thinking…</p><form class="entrance-form" hidden><label class="sr-only" for="art-key">Your reply. Type anything and press Enter.</label><input id="art-key" aria-label="Your reply. Type anything and press Enter." autocomplete="off" spellcheck="false" maxlength="300" enterkeyhint="send" placeholder="type anything…"/><button class="terminal-enter" type="submit" aria-label="Send reply">↵</button></form></div>
    <button class="terminal-skip" type="button">skip <span aria-hidden="true">→</span></button>
  </div>
</div>`;
initializeWorld({stories, sections});
