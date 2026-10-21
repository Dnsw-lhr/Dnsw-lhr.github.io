export function initializePanels({stage,canvas,reduced,isBlocked}) {
  for(const panel of stage.querySelectorAll('.world-district')) {
    const grip=panel.querySelector('.panel-grip');let drag,flight,clickBlocked=false;
    const initial=()=>({x:panel.offsetLeft,y:panel.offsetTop});const base=initial();
    const place=(x,y)=>{panel.style.left=`${Math.max(24,Math.min(canvas.offsetWidth-panel.offsetWidth-24,x))}px`;panel.style.top=`${Math.max(24,Math.min(canvas.offsetHeight-panel.offsetHeight-24,y))}px`;};
    const stop=()=>{cancelAnimationFrame(flight);panel.classList.remove('panel-moving');};
    panel.addEventListener('pointerdown',e=>{
      if(e.button!==0||isBlocked()||e.target.closest('button')!==grip&&e.target.closest('button'))return;
      e.stopPropagation();getSelection()?.removeAllRanges();stop();const scale=stage.querySelector('.world-canvas').getBoundingClientRect().width/canvas.offsetWidth;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:panel.offsetLeft,top:panel.offsetTop,scale,lastX:e.clientX,lastY:e.clientY,time:e.timeStamp,vx:0,vy:0,moved:false};
      panel.setPointerCapture(e.pointerId);
    });
    panel.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;e.stopPropagation();const dx=(e.clientX-drag.x)/drag.scale,dy=(e.clientY-drag.y)/drag.scale;if(!drag.moved&&Math.hypot(dx,dy)<7)return;drag.moved=true;clickBlocked=true;panel.classList.add('panel-moving');const dt=Math.max(8,e.timeStamp-drag.time);drag.vx=(e.clientX-drag.lastX)/drag.scale/dt;drag.vy=(e.clientY-drag.lastY)/drag.scale/dt;drag.lastX=e.clientX;drag.lastY=e.clientY;drag.time=e.timeStamp;place(drag.left+dx,drag.top+dy);e.preventDefault();});
    function release(e){if(!drag||drag.id!==e.pointerId)return;e.stopPropagation();const old=drag;drag=null;setTimeout(()=>clickBlocked=false,0);if(panel.hasPointerCapture(e.pointerId))panel.releasePointerCapture(e.pointerId);if(!old.moved||reduced.matches||e.type==='pointercancel'){stop();return;}let vx=Math.max(-2,Math.min(2,old.vx)),vy=Math.max(-2,Math.min(2,old.vy)),last=performance.now();function coast(t){const dt=Math.min(32,t-last);last=t;const p=initial();place(p.x+vx*dt,p.y+vy*dt);vx*=Math.pow(.9,dt/16);vy*=Math.pow(.9,dt/16);if(Math.hypot(vx,vy)>.025&&!isBlocked())flight=requestAnimationFrame(coast);else stop();}flight=requestAnimationFrame(coast);}
    panel.addEventListener('pointerup',release);panel.addEventListener('pointercancel',release);panel.addEventListener('lostpointercapture',release);
    panel.addEventListener('click',e=>{if(clickBlocked){e.preventDefault();e.stopImmediatePropagation();clickBlocked=false;}},true);
    grip.addEventListener('keydown',e=>{const moves={ArrowLeft:[-40,0],ArrowRight:[40,0],ArrowUp:[0,-40],ArrowDown:[0,40]};if(moves[e.key]){e.preventDefault();e.stopPropagation();stop();const p=initial();place(p.x+moves[e.key][0],p.y+moves[e.key][1]);}if(e.key==='Home'){e.preventDefault();stop();place(base.x,base.y);}});
    window.addEventListener('blur',()=>{drag=null;stop();});reduced.addEventListener('change',stop);
  }
}


