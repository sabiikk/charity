(() => {
  const host = document.querySelector('#ways-host'); if (!host) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const prep = () => host.querySelectorAll('.method:not([data-fx])').forEach(m => { m.dataset.fx = '1'; const g = document.createElement('span'); g.className = 'method-glow'; g.setAttribute('aria-hidden', 'true'); m.prepend(g); });
  prep(); new MutationObserver(prep).observe(host, { childList: true, subtree: true });
  host.addEventListener('pointermove', e => {
    const m = e.target.closest && e.target.closest('.method'); if (!m) return;
    const r = m.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    m.style.setProperty('--mx', x + 'px'); m.style.setProperty('--my', y + 'px');
    m.style.setProperty('--ry', ((x / r.width - .5) * 7).toFixed(2) + 'deg');
    m.style.setProperty('--rx', ((.5 - y / r.height) * 5).toFixed(2) + 'deg');
    m.classList.remove('is-leaving');
  });
  host.addEventListener('pointerout', e => {
    const m = e.target.closest && e.target.closest('.method'); if (!m || m.contains(e.relatedTarget)) return;
    m.classList.add('is-leaving'); m.style.setProperty('--rx', '0deg'); m.style.setProperty('--ry', '0deg');
  });
})();
