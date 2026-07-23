/* iddot — scroll reveal
   원칙: 어떤 이유로든 콘텐츠가 영구히 숨겨지면 안 된다.
   관찰자가 발화하지 않는 환경(구형 브라우저, 프린트, 헤드리스 등)에서도
   안전망 타이머가 전부 드러내도록 한다. */
(function () {
  'use strict';

  var SEL = '.statement .display, .statement-body, .work-item, .contact-display, .contact-grid, .section-idx';
  var targets = Array.prototype.slice.call(document.querySelectorAll(SEL));
  if (!targets.length) return;

  function show(el) { el.classList.add('in'); }
  function showAll() { targets.forEach(show); }

  // 프린트 시에는 애니메이션 없이 전부 표시
  if (window.matchMedia && window.matchMedia('print').matches) { showAll(); return; }
  window.addEventListener('beforeprint', showAll);

  if (!('IntersectionObserver' in window)) { showAll(); return; }

  targets.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 4) * 70 + 'ms';
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  targets.forEach(function (el) { io.observe(el); });

  // 안전망 1: 뷰포트 안에 들어와 있는데 아직 안 드러난 요소는 즉시 표시
  function sweep() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    targets.forEach(function (el) {
      if (el.classList.contains('in')) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) show(el);
    });
  }
  window.addEventListener('load', sweep);
  setTimeout(sweep, 600);

  // 안전망 2: 5초 뒤에는 무조건 전부 표시 (관찰자 미발화 대비)
  setTimeout(showAll, 5000);
})();
