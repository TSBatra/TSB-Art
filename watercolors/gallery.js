/* v10: finger-follow swipe; retains v9 lightbox, arrows, keyboard. */
(() => {
  const painting = document.getElementById('painting');
  const lightbox = document.getElementById('lightbox');
  const closeButton = document.getElementById('closeLightbox');
  if (!painting || !lightbox || !closeButton) return;
  const wrap = painting.closest('.painting-wrap');
  const prev = document.querySelector('.artwork-arrow.prev');
  const next = document.querySelector('.artwork-arrow.next');
  const previews = [...wrap.querySelectorAll('.swipe-preview')];
  const navigate = el => { if (el && el.dataset.href) location.href = el.dataset.href; };
  const openLightbox = () => {
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  };
  const closeLightbox = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  };
  let suppressClick = false;
  painting.addEventListener('click', e => {
    if (suppressClick) { e.preventDefault(); suppressClick=false; return; }
    openLightbox();
  });
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox || e.target.tagName === 'IMG') closeLightbox();
  });
  closeButton.addEventListener('click', e => {e.stopPropagation();closeLightbox();});
  if (prev) prev.addEventListener('click',()=>navigate(prev));
  if (next) next.addEventListener('click',()=>navigate(next));
  document.addEventListener('keydown',e=>{
    if (e.key==='Escape' && lightbox.classList.contains('open')) {closeLightbox();return;}
    if (lightbox.classList.contains('open')) return;
    if (e.key==='ArrowLeft') navigate(prev);
    if (e.key==='ArrowRight') navigate(next);
  });
  let tracking=false, axis=null, x0=0,y0=0,dx=0,activePreview=null;
  const reset=()=>{
    painting.style.transition='transform 200ms ease-out';
    painting.style.transform='translate3d(0,0,0)';
    previews.forEach(el=>{
      el.style.transition='transform 200ms ease-out, opacity 200ms ease-out';
      el.style.opacity='0';
      el.style.transform='translate3d(0,0,0)';
    });
  };
  painting.addEventListener('pointerdown',e=>{
    if (e.pointerType==='mouse' || !e.isPrimary || lightbox.classList.contains('open')) return;
    tracking=true;axis=null;dx=0;x0=e.clientX;y0=e.clientY;
    painting.style.transition='none';
    previews.forEach(el=>el.style.transition='none');
  });
  painting.addEventListener('pointermove',e=>{
    if (!tracking) return;
    const x=e.clientX-x0, y=e.clientY-y0;
    if (!axis && Math.hypot(x,y)>8) axis=Math.abs(x)>Math.abs(y)*1.25?'horizontal':'vertical';
    if (axis!=='horizontal') return;
    dx=x;
    const destination=dx>0?prev:next;
    activePreview=wrap.querySelector(dx>0?'.swipe-preview.prev':'.swipe-preview.next');
    const allowed=!!destination;
    const distance=allowed?dx:dx*0.2;
    painting.style.transform=`translate3d(${distance}px,0,0)`;
    previews.forEach(el=>el.style.opacity='0');
    if (allowed && activePreview) {
      const width=wrap.clientWidth;
      const from=dx>0?-width:width;
      activePreview.style.opacity=String(Math.min(1,Math.abs(dx)/90));
      activePreview.style.transform=`translate3d(${from+distance}px,0,0)`;
    }
  });
  const finish=()=>{
    if (!tracking) return;
    tracking=false;
    if (axis!=='horizontal') return;
    suppressClick=true;
    const destination=dx>0?prev:next;
    const commit=destination && Math.abs(dx)>Math.min(100,wrap.clientWidth*.22);
    if (commit) {
      const width=wrap.clientWidth;
      painting.style.transition='transform 170ms ease-out';
      painting.style.transform=`translate3d(${dx>0?width:-width}px,0,0)`;
      if (activePreview) {
        activePreview.style.transition='transform 170ms ease-out';
        activePreview.style.transform='translate3d(0,0,0)';
      }
      setTimeout(()=>navigate(destination),175);
    } else reset();
    setTimeout(()=>{suppressClick=false;},350);
  };
  painting.addEventListener('pointerup',finish);
  painting.addEventListener('pointercancel',()=>{tracking=false;reset();});
})();