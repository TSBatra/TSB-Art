/* Shared archive interactions; no dependencies, no impact on OG metadata. */
(() => {
  const painting = document.getElementById("painting");
  const lightbox = document.getElementById("lightbox");
  const closeButton = document.getElementById("closeLightbox");
  if (!painting || !lightbox || !closeButton) return;
  const openLightbox = () => {
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  const closeLightbox = () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  painting.addEventListener("click", openLightbox);
  lightbox.addEventListener("click", event => {
    if (event.target === lightbox || event.target.tagName === "IMG") closeLightbox();
  });
  closeButton.addEventListener("click", event => {
    event.stopPropagation();
    closeLightbox();
  });
  const prev = document.querySelector(".artwork-arrow.prev");
  const next = document.querySelector(".artwork-arrow.next");
  const navigate = (el) => { if (el && el.dataset.href) window.location.href = el.dataset.href; };
  if (prev) prev.addEventListener("click", () => navigate(prev));
  if (next) next.addEventListener("click", () => navigate(next));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && lightbox.classList.contains("open")) {
      closeLightbox();
      return;
    }
    if (lightbox.classList.contains("open")) return;
    if (event.key === "ArrowLeft") navigate(prev);
    if (event.key === "ArrowRight") navigate(next);
  });
  // v9.2: mobile-only full-page gesture. Preview is an iframe of the actual
  // adjacent painting page, so titles, notes and original image fitting match.
  // No swipe listeners run inside preview frames.
  if (window.self !== window.top ||
      !window.matchMedia('(max-width: 700px) and (pointer: coarse)').matches) return;
  const stage = document.querySelector('.swipe-stage');
  if (!stage) return;
  const targets = { prev: prev?.dataset.href || null, next: next?.dataset.href || null };
  const previews = {};
  const ready = {};
  for (const direction of ['prev', 'next']) {
    if (!targets[direction]) continue;
    const frame = document.createElement('iframe');
    frame.className = 'swipe-preview';
    frame.title = direction === 'prev' ? 'Previous artwork preview' : 'Next artwork preview';
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('loading', 'eager');
    frame.addEventListener('load', () => { ready[direction] = true; });
    document.body.appendChild(frame);
    previews[direction] = frame;
    frame.src = targets[direction];
  }
  let startX = 0, startY = 0, offset = 0, mode = 'idle', direction = null;
  let startTime = 0, transitioning = false, suppressClick = false;
  const width = () => window.innerWidth;
  const resetStyles = () => {
    stage.classList.remove('swipe-animate');
    stage.style.transform = '';
    for (const frame of Object.values(previews)) {
      frame.classList.remove('swipe-animate');
      frame.style.transform = '';
      frame.style.visibility = 'hidden';
    }
  };
  const show = (dx) => {
    stage.style.transform = `translate3d(${dx}px,0,0)`;
    for (const [side, frame] of Object.entries(previews)) {
      const base = side === 'next' ? width() : -width();
      frame.style.transform = `translate3d(${base + dx}px,0,0)`;
      frame.style.visibility = (side === direction && ready[side]) ? 'visible' : 'hidden';
    }
  };
  const excluded = (node) => node.closest(
    '.archive-bar, .artwork-arrow, .lightbox, a, button, input, textarea, select'
  );
  document.addEventListener('touchstart', e => {
    if (transitioning || e.touches.length !== 1 ||
        lightbox.classList.contains('open') || excluded(e.target)) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
    offset = 0;
    direction = null;
    mode = 'pending';
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (mode === 'idle' || mode === 'vertical' || transitioning || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (mode === 'pending') {
      if (Math.abs(dy) > 9 && Math.abs(dy) > Math.abs(dx)) { mode = 'vertical'; return; }
      if (Math.abs(dx) < 12) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.25) { mode = 'vertical'; return; }
      mode = 'horizontal';
    }
    if (e.cancelable) e.preventDefault();
    direction = dx < 0 ? 'next' : 'prev';
    offset = targets[direction] ? dx : dx * 0.16; // resist first/last boundary
    show(offset);
  }, { passive: false });
  document.addEventListener('touchend', e => {
    if (mode !== 'horizontal') { mode = 'idle'; return; }
    mode = 'idle';
    suppressClick = true;
    window.setTimeout(() => { suppressClick = false; }, 450);
    const chosen = direction;
    const elapsed = Date.now() - startTime;
    const shouldAdvance = targets[chosen] &&
      (Math.abs(offset) > width() * 0.24 || (Math.abs(offset) > 65 && elapsed < 300));
    stage.classList.add('swipe-animate');
    for (const frame of Object.values(previews)) frame.classList.add('swipe-animate');
    transitioning = true;
    if (shouldAdvance) {
      // When preview is not ready, don't display a blank adjacent panel.
      if (!ready[chosen]) { window.location.assign(targets[chosen]); return; }
      show(chosen === 'next' ? -width() : width());
      window.setTimeout(() => window.location.assign(targets[chosen]), 230);
    } else {
      show(0);
      window.setTimeout(() => { resetStyles(); transitioning = false; }, 240);
    }
  }, { passive: true });
  document.addEventListener('touchcancel', () => {
    mode = 'idle'; transitioning = false; resetStyles();
  }, { passive: true });
  // Prevent the click-to-zoom action immediately following a horizontal swipe.
  document.addEventListener('click', e => {
    if (suppressClick) { suppressClick = false; e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

})();
