// Scripted local conversation. Replies are never stored or sent to a service.
export function initializeIntro({ root, reduced, onArtFirst, onReady }) {
  const entrance=document.querySelector('.entrance');
  const form=entrance.querySelector('form'), input=entrance.querySelector('input');
  const line=entrance.querySelector('.dialogue-line'), thinking=entrance.querySelector('.thinking-text');
  const skip=entrance.querySelector('.terminal-skip');
  const background=[...root.children].filter(element=>element!==entrance);
  const skipLink=document.querySelector('.skip-link');
  background.forEach(element=>element.inert=true); skipLink.inert=true;
  let phase='hello'; const timers=new Set();
  const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);};
  function say(message) {
    line.replaceChildren();
    const accessible=document.createElement('span');accessible.className='sr-only';accessible.textContent=message;line.append(accessible);
    message.split(' ').forEach((word,i)=>{const span=document.createElement('span');span.textContent=word+' ';span.setAttribute('aria-hidden','true');span.style.setProperty('--word',i);line.append(span);});
  }
  function reveal() {
    if(phase==='tear' || phase==='ready') return;
    timers.forEach(clearTimeout);timers.clear();phase='tear';
    form.hidden=true;thinking.hidden=true;entrance.classList.add('is-tearing');
    root.classList.add('cassy-first');onArtFirst();
    later(()=>{
      entrance.remove();
      later(()=>{
        phase='ready';root.classList.remove('awaiting-entry','cassy-first');root.classList.add('ui-revealed');
        background.forEach(element=>element.inert=false);skipLink.inert=false;
        document.querySelector('#intro-heading').focus({preventScroll:true});onReady();
      },reduced.matches?0:650);
    },reduced.matches?0:1000);
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();if(phase!=='reply' || !input.value.trim()) return;
    phase='thinking';form.hidden=true;input.value='';thinking.hidden=false;
    later(()=>{thinking.hidden=true;say("gonna show you anyways..");phase='answer';
      later(()=>{say('im happy that you are here btw!!');phase='question';form.hidden=false;input.value='';input.focus({preventScroll:true});later(reveal,2000);},1450);
    },650);
  });
  skip.addEventListener('click',reveal);
  entrance.addEventListener('keydown',event=>{
    if(event.key!=='Tab') return;
    const first=form.hidden?skip:input;
    if(event.shiftKey && document.activeElement===first){event.preventDefault();skip.focus();}
    else if(!event.shiftKey && document.activeElement===skip){event.preventDefault();first.focus();}
  });
  say('Haii');skip.focus({preventScroll:true});
  later(()=>{if(phase!=='hello') return;say('do you really wanna see more about me??');phase='reply';form.hidden=false;input.focus({preventScroll:true});},1400);
  return { skip:reveal, get phase(){return phase;} };
}
