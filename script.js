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
let suppressClickUntil = 0;
viewport.addEventListener('dragstart', e => e.preventDefault());
viewport.addEventListener('pointerdown', e => {
  if (!e.isPrimary) { start = null; return; }
  if (e.button !== 0) return;
  start = { x: e.clientX, y: e.clientY, id: e.pointerId };
});
viewport.addEventListener('pointermove', e => {
  if (start && e.pointerId === start.id && Math.abs(e.clientX - start.x) > 15) suppressClickUntil = Date.now() + 500;
});
window.addEventListener('pointerup', e => {
  if (!start || e.pointerId !== start.id) return;
  const dx = e.clientX - start.x, dy = e.clientY - start.y;
  start = null;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
    suppressClickUntil = Date.now() + 500;
    go(current + (dx < 0 ? 1 : -1));
  }
});
window.addEventListener('pointercancel', () => { start = null; });
viewport.addEventListener('click', e => { if (Date.now() < suppressClickUntil) { e.preventDefault(); e.stopPropagation(); } }, true);
new ResizeObserver(fitCards).observe(viewport);
fitCards(); go(0);
