(() => {
  document.querySelectorAll('.campaign-hero').forEach((hero) => {
    const slides = [...hero.querySelectorAll('.campaign-slide')];
    const dots = [...hero.querySelectorAll('.campaign-dot')];
    if (slides.length < 2) return;
    let active = 0, timer;
    const setSlide = (index) => {
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => { slide.classList.toggle('is-active', i === active); slide.setAttribute('aria-hidden', i === active ? 'false' : 'true'); });
      dots.forEach((dot, i) => { dot.classList.toggle('is-active', i === active); dot.setAttribute('aria-pressed', i === active ? 'true' : 'false'); });
    };
    const start = () => { if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !document.hidden) timer = setInterval(() => setSlide(active + 1), 5000); };
    const stop = () => { clearInterval(timer); };
    dots.forEach((dot, i) => dot.addEventListener('click', () => { setSlide(i); stop(); start(); }));
    hero.addEventListener('mouseenter', stop); hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop); hero.addEventListener('focusout', (e) => { if (!hero.contains(e.relatedTarget)) start(); });
    document.addEventListener('visibilitychange', () => { stop(); if (!document.hidden) start(); });
    start();
  });
})();
