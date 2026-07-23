/* contact.html — Stepper 다단계 문의 폼
   React Bits 의 Stepper 를 의존성 없는 바닐라 JS로 이식. */
(function () {
  'use strict';

  var root  = document.getElementById('stepper');
  if (!root) return;

  var form   = document.getElementById('inquiryForm');
  var steps  = Array.prototype.slice.call(root.querySelectorAll('.step'));
  var dots   = Array.prototype.slice.call(root.querySelectorAll('.dot'));
  var lines  = Array.prototype.slice.call(root.querySelectorAll('.stepper-dots i'));
  var backBtn   = document.getElementById('stepBack');
  var nextBtn   = document.getElementById('stepNext');
  var submitBtn = document.getElementById('stepSubmit');
  var errEl     = document.getElementById('stepError');
  var doneEl    = document.getElementById('stepDone');
  var total  = steps.length;
  var current = 1;

  function showStep(n) {
    current = n;
    steps.forEach(function (s) {
      s.classList.toggle('is-on', +s.getAttribute('data-step') === n);
    });
    dots.forEach(function (d) {
      var i = +d.getAttribute('data-dot');
      d.classList.toggle('is-on', i === n);
      d.classList.toggle('is-done', i < n);
    });
    lines.forEach(function (l, i) { l.classList.toggle('is-done', i < n - 1); });

    backBtn.hidden = n === 1;
    nextBtn.hidden = n === total;
    submitBtn.hidden = n !== total;
    if (errEl) errEl.hidden = true;
  }

  function validateStep(n) {
    var el = steps[n - 1];
    var required = Array.prototype.slice.call(el.querySelectorAll('[required]'));
    for (var i = 0; i < required.length; i++) {
      if (!required[i].value || !required[i].value.trim()) {
        if (errEl) {
          errEl.textContent = '필수 항목을 입력해주세요.';
          errEl.hidden = false;
        }
        required[i].focus();
        return false;
      }
    }
    return true;
  }

  nextBtn.addEventListener('click', function () {
    if (!validateStep(current)) return;
    if (current < total) showStep(current + 1);
  });
  backBtn.addEventListener('click', function () {
    if (current > 1) showStep(current - 1);
  });
  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      var target = +d.getAttribute('data-dot');
      if (target < current) showStep(target); // 이전 단계로는 자유롭게, 다음 단계는 검증 통과해야
    });
  });

  /* ── 프로젝트 유형 칩 선택 ── */
  var chipGroup = form.querySelector('.chip-group');
  if (chipGroup) {
    var hidden = form.querySelector('input[name="type"]');
    chipGroup.addEventListener('click', function (e) {
      var chip = e.target.closest ? e.target.closest('.chip') : null;
      if (!chip) return;
      Array.prototype.forEach.call(chipGroup.querySelectorAll('.chip'), function (c) {
        c.classList.toggle('is-on', c === chip);
      });
      if (hidden) hidden.value = chip.textContent.trim();
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep(total)) return;

    var d = new FormData(form);
    var name    = (d.get('name') || '').toString().trim();
    var contact = (d.get('contact') || '').toString().trim();
    var message = (d.get('message') || '').toString().trim();

    var body = [
      '이름 / 회사 : ' + name,
      '연락처     : ' + contact,
      '프로젝트 유형 : ' + ((d.get('type') || '').toString().trim() || '-'),
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

    form.hidden = true;
    root.querySelector('.stepper-dots').hidden = true;
    if (doneEl) doneEl.hidden = false;
  });

  showStep(1);
})();
