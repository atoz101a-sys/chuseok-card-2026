'use strict';
const viewport = document.querySelector('.viewport');
const track = document.querySelector('.track');
const slides = [...document.querySelectorAll('.slide')];
const prev = document.querySelector('#prev');
const next = document.querySelector('#next');
let current = 0;
const dots = slides.map((_, i) => {
  const dot = document.createElement('button');
  dot.type = 'button'; dot.className = 'dot';
  dot.setAttribute('aria-label', `${i + 1}번 카드로 이동`);
  dot.addEventListener('click', () => go(i));
  document.querySelector('.dots').append(dot);
  return dot;
});
function fitCards() {
  const width = Math.min(viewport.clientWidth - 24, (viewport.clientHeight - 8) * 2 / 3);
  document.querySelectorAll('.card').forEach(card => {
    card.style.width = `${Math.max(0, width)}px`;
    card.style.height = `${Math.max(0, width * 1.5)}px`;
  });
}
function go(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  track.style.transform = `translateX(-${current * 100}%)`;
  slides.forEach((slide, i) => { slide.inert = i !== current; });
  dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
  prev.disabled = current === 0; next.disabled = current === slides.length - 1;
  document.querySelector('#counter').textContent = `${current + 1} / ${slides.length}`;
  document.querySelector('#hint').textContent = current === 4 ? '연락처를 누르면 전화 앱으로 연결됩니다' : '좌우로 넘겨 보세요';
}
prev.addEventListener('click', () => go(current - 1));
next.addEventListener('click', () => go(current + 1));
document.addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
  if (e.key === 'Home') { e.preventDefault(); go(0); }
  if (e.key === 'End') { e.preventDefault(); go(4); }
});
let start = null;
let touchStart = null;
let ignoreMouseUntil = 0;
let suppressClickUntil = 0;
viewport.addEventListener('dragstart', e => e.preventDefault());
function finishSwipe(origin, x, y) {
  const dx = x - origin.x, dy = y - origin.y;
  if (Math.abs(dx) >= 30 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    suppressClickUntil = Date.now() + 700;
    go(current + (dx < 0 ? 1 : -1));
  }
}
// Handle native touch separately: some in-app browsers cancel pointer gestures.
viewport.addEventListener('touchstart', e => {
  start = null;
  ignoreMouseUntil = Date.now() + 1000;
  if (e.touches.length !== 1) { touchStart = null; return; }
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY, id: t.identifier, axis: null };
}, { passive: true });
viewport.addEventListener('touchmove', e => {
  if (!touchStart) return;
  if (e.touches.length !== 1) { touchStart = null; return; }
  const t = e.touches[0];
  if (t.identifier !== touchStart.id) return;
  const dx = Math.abs(t.clientX - touchStart.x), dy = Math.abs(t.clientY - touchStart.y);
  if (!touchStart.axis && Math.max(dx, dy) > 10) {
    touchStart.axis = dx > dy * 1.2 ? 'horizontal' : 'vertical';
  }
  if (touchStart.axis === 'horizontal') {
    if (e.cancelable) e.preventDefault();
    suppressClickUntil = Date.now() + 700;
  }
}, { passive: false });
viewport.addEventListener('touchend', e => {
  ignoreMouseUntil = Date.now() + 1000;
  if (!touchStart) return;
  const origin = touchStart;
  touchStart = null;
  if (e.touches.length || origin.axis === 'vertical') return;
  const t = Array.from(e.changedTouches).find(t => t.identifier === origin.id);
  if (!t) return;
  if (origin.axis === 'horizontal' && e.cancelable) e.preventDefault();
  finishSwipe(origin, t.clientX, t.clientY);
}, { passive: false });
viewport.addEventListener('touchcancel', () => { touchStart = null; });
viewport.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch' || Date.now() < ignoreMouseUntil) return;
  if (!e.isPrimary) { start = null; return; }
  if (e.button !== 0) return;
  start = { x: e.clientX, y: e.clientY, id: e.pointerId };
});
viewport.addEventListener('pointermove', e => {
  if (start && e.pointerId === start.id && Math.abs(e.clientX - start.x) > 15) suppressClickUntil = Date.now() + 500;
});
window.addEventListener('pointerup', e => {
  if (!start || e.pointerId !== start.id) return;
  const origin = start;
  start = null;
  finishSwipe(origin, e.clientX, e.clientY);
});
window.addEventListener('pointercancel', () => { start = null; });
viewport.addEventListener('click', e => { if (Date.now() < suppressClickUntil) { e.preventDefault(); e.stopPropagation(); } }, true);
new ResizeObserver(fitCards).observe(viewport);
fitCards(); go(0);
