let viewerLibrary;
export async function initializeAvatarViewer({container,model}){
  if(!container||!model||!/^\.\/assets\/.*\.glb$/i.test(model))return;
  const note=container.querySelector('.avatar-viewer-note');
  try{
    note.textContent='Loading your 3D avatar…';
    viewerLibrary ||= import('../assets/vendor/model-viewer.min.js');
    await viewerLibrary;if(!container.isConnected)return;
    const viewer=document.createElement('model-viewer');viewer.src=model;viewer.alt='Dnsw’s Roblox avatar in 3D';viewer.setAttribute('camera-controls','');viewer.setAttribute('touch-action','pan-y');viewer.setAttribute('shadow-intensity','1');viewer.setAttribute('poster','./assets/stories/dnsw-avatar.png');
    viewer.setAttribute('camera-orbit','180deg 80deg auto');
    viewer.setAttribute('min-camera-orbit','auto 15deg 45%');
    viewer.setAttribute('max-camera-orbit','auto 165deg 250%');
    viewer.setAttribute('interaction-prompt','none');
    viewer.setAttribute('tabindex','0');
    viewer.setAttribute('aria-label','Dnsw’s 3D avatar. Drag to rotate, scroll or pinch to zoom. Arrow keys rotate.');
    viewer.addEventListener('wheel',event=>event.stopPropagation(),{passive:true});
    viewer.addEventListener('load',()=>{container.querySelector('img').hidden=true;note.textContent='Drag to rotate · Scroll or pinch to zoom · Arrow keys rotate';});viewer.addEventListener('error',()=>{viewer.remove();container.querySelector('img').hidden=false;note.textContent='3D unavailable · Avatar image shown';});container.querySelector('.avatar-model-slot').append(viewer);
  }catch{note.textContent='3D unavailable · Avatar image shown';}
}

