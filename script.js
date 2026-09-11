'use strict';
const viewport = document.querySelector('.viewport');
const slides = [...document.querySelectorAll('.slide')];
const prev = document.querySelector('#prev');
const next = document.querySelector('#next');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let current = 0, scrollFrame = 0, mouse = null, suppressClickUntil = 0;
const dots = slides.map((slide, i) => {
  slide.inert = false;
  const dot = document.createElement('button');
  dot.type = 'button'; dot.className = 'dot';
  dot.setAttribute('aria-label', `${i + 1}번 카드로 이동`);
  dot.addEventListener('click', () => go(i));
  document.querySelector('.dots').append(dot);
  return dot;
});
function showPage(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
  slides.forEach((slide, i) => {
    slide.setAttribute('aria-hidden', String(i !== current));
    slide.querySelectorAll('a').forEach(a => { a.tabIndex = i === current ? 0 : -1; });
  });
  prev.disabled = current === 0; next.disabled = current === slides.length - 1;
  document.querySelector('#counter').textContent = `${current + 1} / ${slides.length}`;
  document.querySelector('#hint').textContent = current === 4 ? '연락처를 누르면 전화 앱으로 연결됩니다' : '좌우로 넘겨 보세요';
}
function go(index) {
  const page = Math.max(0, Math.min(slides.length - 1, index));
  viewport.scrollTo({ left: page * viewport.clientWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
}
// Native touch momentum: no touchmove interception, forced layout or image transforms.
viewport.addEventListener('scroll', () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    const page = Math.round(viewport.scrollLeft / viewport.clientWidth);
    if (page !== current) showPage(page);
  });
}, { passive: true });
viewport.addEventListener('scrollend', () => showPage(Math.round(viewport.scrollLeft / viewport.clientWidth)));
prev.addEventListener('click', () => go(current - 1));
next.addEventListener('click', () => go(current + 1));
document.addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const target = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: slides.length - 1 }[e.key];
  if (target !== undefined) { e.preventDefault(); go(target); }
});
// Desktop mouse dragging only; touch and pen stay under native browser control.
viewport.addEventListener('dragstart', e => e.preventDefault());
viewport.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  mouse = { x: e.clientX, left: viewport.scrollLeft, page: current, moved: false };
});
window.addEventListener('pointermove', e => {
  if (!mouse || e.pointerType !== 'mouse') return;
  const dx = e.clientX - mouse.x;
  if (!mouse.moved && Math.abs(dx) < 6) return;
  mouse.moved = true;
  viewport.classList.add('mouse-dragging');
  viewport.scrollLeft = mouse.left - dx;
  suppressClickUntil = Date.now() + 500;
});
function endMouse(e) {
  if (!mouse || e.pointerType !== 'mouse') return;
  const origin = mouse; mouse = null;
  viewport.classList.remove('mouse-dragging');
  if (!origin.moved) return;
  const dx = e.clientX - origin.x;
  go(origin.page + (Math.abs(dx) > 40 ? (dx < 0 ? 1 : -1) : 0));
}
window.addEventListener('pointerup', endMouse);
window.addEventListener('pointercancel', endMouse);
viewport.addEventListener('click', e => {
  if (Date.now() < suppressClickUntil) { e.preventDefault(); e.stopPropagation(); }
}, true);
let lastWidth = 0, lastHeight = 0;
new ResizeObserver(() => {
  const width = viewport.clientWidth, height = viewport.clientHeight;
  if (width === lastWidth && height === lastHeight) return;
  lastWidth = width; lastHeight = height;
  const cardWidth = Math.max(0, Math.min(width - 24, (height - 8) * 2 / 3));
  document.querySelectorAll('.card').forEach(card => {
    card.style.width = `${cardWidth}px`; card.style.height = `${cardWidth * 1.5}px`;
  });
  viewport.scrollTo({ left: current * width, behavior: 'instant' });
}).observe(viewport);
showPage(0);
