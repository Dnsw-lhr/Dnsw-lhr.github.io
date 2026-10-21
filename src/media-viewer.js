export function initializeMediaViewer({content}) {
  const viewer=document.querySelector('.media-viewer'),viewport=viewer.querySelector('.image-viewport'),image=viewport.querySelector('img');
  let scale=1,source;
  function fit(){scale=Math.min(1,(viewport.clientWidth-32)/image.naturalWidth,(viewport.clientHeight-32)/image.naturalHeight);paint();}
  function paint(){scale=Math.max(.1,Math.min(4,scale));image.style.width=`${image.naturalWidth*scale}px`;}
  image.addEventListener('load',fit);
  content.addEventListener('click',event=>{
    const anchor=event.target.closest('.media-gallery a');
    const original=anchor?.querySelector('img');if(!original)return;
    event.preventDefault();source=anchor;image.alt=original.alt;image.src=original.currentSrc||original.src;
    viewer.showModal();if(image.complete)fit();viewport.scrollTop=viewport.scrollLeft=0;viewport.focus();
  });
  viewer.querySelectorAll('[data-media-zoom]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.mediaZoom;if(action==='fit')fit();else {scale=action==='actual'?1:scale*(action==='in'?1.3:1/1.3);paint();}
  }));
  viewer.querySelector('.image-close').addEventListener('click',()=>viewer.close());
  viewer.addEventListener('close',()=>source?.focus({preventScroll:true}));
}
