/* iddot — ScrollFloat (React Bits) 를 GSAP CDN + 바닐라로 이식.
   [data-split] 요소는 main.js 가 이미 글자 단위 <span class="sp"> 로
   쪼개놓았으므로, 그 스팬들을 스크롤 스크럽으로 띄운다.

   안전 설계: GSAP 로딩이 실패해도(네트워크 차단 등) main.js 의
   IntersectionObserver 기반 등장 로직이 독립적으로 계속 작동해
   텍스트가 영구히 숨겨지지 않는다 — 이 스크립트는 '있으면 더 멋있게'
   얹는 보강일 뿐, 콘텐츠 노출을 이 스크립트에 의존시키지 않는다. */
(function () {
  'use strict';

  function boot(gsap, ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // 첫 화면(스크롤 없이 바로 보이는 영역)의 텍스트는 제외한다.
    // scrollStart 가 'center bottom+=50%' 라 로드 시점(스크롤 0)에 이미
    // 그 지점을 지나쳐 있으면 진행률이 중간값에 멈춰버려, 일부 글자만
    // 떠 있는 것처럼 보이는 버그가 생긴다 — 스크롤해서 만나는 텍스트에만 적용.
    var targets = Array.prototype.slice.call(
      document.querySelectorAll('[data-split]:not(.hero-title):not(.hero-sub):not(.c-hero .display)')
    );
    if (!targets.length) return;

    targets.forEach(function (el) {
      var chars = el.querySelectorAll('.sp');
      if (!chars.length) return;

      gsap.fromTo(
        chars,
        { opacity: 0, yPercent: 120, scaleY: 2.3, scaleX: 0.7, transformOrigin: '50% 0%' },
        {
          opacity: 1, yPercent: 0, scaleY: 1, scaleX: 1,
          duration: 1, ease: 'back.inOut(2)', stagger: 0.03,
          scrollTrigger: {
            trigger: el,
            start: 'center bottom+=50%',
            end: 'bottom bottom-=40%',
            scrub: true
          }
        }
      );
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // main.js 의 splitInto() 실행(동기, DOMContentLoaded 이전) 이후에 안전하게 붙도록
  // 약간 지연 후 GSAP 를 로드한다.
  window.addEventListener('load', function () {
    loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js')
      .then(function () {
        return loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js');
      })
      .then(function () {
        if (window.gsap && window.ScrollTrigger) boot(window.gsap, window.ScrollTrigger);
      })
      .catch(function (e) {
        console.warn('[scrollfloat] GSAP 로드 실패, 기본 등장 애니메이션으로 대체됨:', e);
      });
  });
})();
