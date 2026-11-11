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
  let x0 = null, y0 = null;
  painting.addEventListener("touchstart", event => {
    if (event.touches.length !== 1) return;
    x0 = event.touches[0].clientX;
    y0 = event.touches[0].clientY;
  }, {passive:true});
  painting.addEventListener("touchend", event => {
    if (x0 === null || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - x0;
    const dy = event.changedTouches[0].clientY - y0;
    x0 = y0 = null;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      painting.dataset.swiped = "1";
      navigate(dx > 0 ? prev : next);
    }
  }, {passive:true});
  painting.addEventListener("click", event => {
    if (painting.dataset.swiped === "1") {
      event.stopImmediatePropagation();
      painting.dataset.swiped = "";
    }
  }, true);
})();
