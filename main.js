/* iddot — scroll reveal · split text · work filter
   원칙: 어떤 이유로든 콘텐츠가 영구히 숨겨지면 안 된다.
   관찰자가 발화하지 않는 환경(구형 브라우저, 프린트, 헤드리스 등)에서도
   안전망 타이머가 전부 드러내도록 한다. */
(function () {
  'use strict';

  /* ────────────────────────────────────────────
     1. SPLIT TEXT — 글자/단어 단위로 쪼개 스태거 등장
        (React Bits 의 SplitText / ScrollFloat 를 바닐라로)
     ──────────────────────────────────────────── */
  var splitEls = Array.prototype.slice.call(document.querySelectorAll('[data-split]'));

  function splitInto(el) {
    var mode = el.getAttribute('data-split') === 'words' ? 'words' : 'chars';
    var text = el.textContent.trim();
    if (!text) return [];

    el.setAttribute('aria-label', text);   // 스크린리더용 원문 보존
    el.textContent = '';

    var units = mode === 'words' ? text.split(/(\s+)/) : text.split('');
    var pieces = [];

    units.forEach(function (u) {
      if (/^\s+$/.test(u)) {
        var gap = document.createElement('span');
        gap.className = 'sp-sp';
        gap.setAttribute('aria-hidden', 'true');
        el.appendChild(gap);
        return;
      }
      var s = document.createElement('span');
      s.className = 'sp' + (mode === 'words' ? ' sp-w' : '');
      s.setAttribute('aria-hidden', 'true');
      s.textContent = u;
      el.appendChild(s);
      pieces.push(s);
    });

    // 스태거
    pieces.forEach(function (p, i) {
      p.style.transitionDelay = (i * (mode === 'words' ? 60 : 26)) + 'ms';
    });
    return pieces;
  }

  splitEls.forEach(splitInto);

  /* ────────────────────────────────────────────
     2. REVEAL — 블록 단위 페이드업
     ──────────────────────────────────────────── */
  var BLOCK_SEL = '.statement .display, .statement-body p, .work-filter, .work-item, ' +
                  '.contact-display, .contact-grid, .section-idx';
  var blocks = Array.prototype.slice.call(document.querySelectorAll(BLOCK_SEL));

  // statement-closing 은 split 으로 따로 다루므로 블록 리스트에서 제외
  blocks = blocks.filter(function (el) { return !el.hasAttribute('data-split'); });

  var watched = blocks.concat(splitEls);

  function show(el) { el.classList.add('in'); }
  function showAll() { watched.forEach(show); }

  if (window.matchMedia && window.matchMedia('print').matches) { showAll(); return; }
  window.addEventListener('beforeprint', showAll);

  if (!('IntersectionObserver' in window)) { showAll(); return; }

  blocks.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 4) * 70 + 'ms';
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  watched.forEach(function (el) { io.observe(el); });

  // 히어로 카피는 스크롤 전에 보이는 자리이므로 로드 직후 등장
  setTimeout(function () {
    document.querySelectorAll('.hero [data-split]').forEach(show);
  }, 260);

  /* 안전망 1: 뷰포트 안인데 아직 안 드러난 요소는 즉시 표시 */
  function sweep() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    watched.forEach(function (el) {
      if (el.classList.contains('in')) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) show(el);
    });
  }
  window.addEventListener('load', sweep);
  setTimeout(sweep, 600);

  /* 안전망 2: 5초 뒤에는 무조건 전부 표시 */
  setTimeout(showAll, 5000);

  /* ────────────────────────────────────────────
     3. WORK FILTER
     ──────────────────────────────────────────── */
  var btns  = Array.prototype.slice.call(document.querySelectorAll('.filter-btn'));
  var items = Array.prototype.slice.call(document.querySelectorAll('.work-item'));
  var empty = document.querySelector('.work-empty');

  function applyFilter(cat) {
    var shown = 0;
    items.forEach(function (it) {
      var cats = (it.getAttribute('data-cat') || '').split(/\s+/);
      var match = (cat === 'all') || cats.indexOf(cat) !== -1;
      it.hidden = !match;
      if (match) { shown++; show(it); }   // 필터로 다시 나타날 때 숨은 채 남지 않도록
    });
    if (empty) empty.hidden = shown !== 0;
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      btns.forEach(function (o) {
        o.classList.toggle('is-on', o === b);
        o.setAttribute('aria-selected', o === b ? 'true' : 'false');
      });
      applyFilter(b.getAttribute('data-filter') || 'all');
    });
  });

  /* ────────────────────────────────────────────
     4. SPECULAR BUTTON — 커서를 따라 테두리가 빛남
     ──────────────────────────────────────────── */
  var specBtns = Array.prototype.slice.call(document.querySelectorAll('.spec-btn'));
  var PROXIMITY = 260;

  window.addEventListener('pointermove', function (e) {
    specBtns.forEach(function (btn) {
      var r = btn.getBoundingClientRect();
      if (!r.width) return;
      // 버튼 바깥에서의 최단 거리
      var dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      var dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      var dist = Math.hypot(dx, dy);
      var t = Math.max(0, 1 - dist / PROXIMITY);
      btn.style.setProperty('--glow', (t * t * (3 - 2 * t)).toFixed(3));
      btn.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      btn.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }, { passive: true });

  /* ────────────────────────────────────────────
     5. INQUIRY MODAL
     ──────────────────────────────────────────── */
  var modal   = document.getElementById('inquiryModal');
  var openBtn = document.getElementById('openInquiry');
  var form    = document.getElementById('inquiryForm');
  var errEl   = document.getElementById('inqError');
  var lastFocus = null;

  function openModal() {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var first = modal.querySelector('input,select,textarea');
    if (first) first.focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-close')) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
  });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var name = (d.get('name') || '').toString().trim();
      var contact = (d.get('contact') || '').toString().trim();
      var message = (d.get('message') || '').toString().trim();

      if (!name || !contact || !message) {
        if (errEl) {
          errEl.textContent = '이름 / 연락처 / 내용은 필수입니다.';
          errEl.hidden = false;
        }
        return;
      }
      if (errEl) errEl.hidden = true;

      var body = [
        '이름 / 회사 : ' + name,
        '연락처     : ' + contact,
        '프로젝트 유형 : ' + (d.get('type') || '-'),
        '예상 일정  : ' + ((d.get('schedule') || '').toString().trim() || '-'),
        '예산 규모  : ' + ((d.get('budget') || '').toString().trim() || '-'),
        '',
        '── 내용 ──',
        message,
        '',
        '— www.iddot.space 문의 폼'
      ].join('\n');

      window.location.href = 'mailto:ceo@iddot.space'
        + '?subject=' + encodeURIComponent('[iddot 문의] ' + name)
        + '&body=' + encodeURIComponent(body);
    });
  }
})();
