/* 홈 About 왼쪽: 점 → 꽃.
   평소엔 알루 금속 구(알루 앱 대기 상태 그대로, 실시간)가 돈다. 누르면 원래 렌더 자세로 제자리에 선 뒤,
   같은 자세에서 시작하는 블렌더 통렌더 영상(assets/alu/bloom-*.mp4)으로 이음매 없이 넘어간다:
   거친 알루 표면이 녹아 매끈한 액체 구가 되고, 닦이며 앞면부터 펼쳐져 iddot 크롬 꽃이 된다.
   다시 누르면 거꾸로 접혀(fold-*.mp4) 알루로 돌아오고, 그 자리에서 다시 돈다.
   그림 파일이 커서 About 근처에 왔을 때 불러온다. */
import { mountAluSphere } from './alu-bloom.js?v=s4';

const stage = document.getElementById('stage');
const box = document.getElementById('aluBox');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const small = matchMedia('(max-width: 700px)');

let alu = null, open = false, busy = false, want = false;

// 영상 두 개(펼침·접힘). 같은 자리·같은 크기로 알루 위에 겹친다.
const vid = (name) => {
  const v = document.createElement('video');
  v.className = 'stage__vid';
  v.muted = true; v.playsInline = true; v.preload = 'auto'; v.disablePictureInPicture = true;
  v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
  v.src = `assets/alu/${name}-${small.matches ? 720 : 1080}.mp4?v=s1`;
  v.addEventListener('click', () => toggle());
  stage.appendChild(v);
  return v;
};
let bloomV = null, foldV = null;

const show = (v, on) => v && v.classList.toggle('is-on', on);
// 첫 장면에 멈춰 둔 채 화면에 실제로 그려질 때까지 기다린다(그리기 전에 알루를 숨기면 한 프레임 비어 튐)
const atStart = (v) => new Promise((res) => {
  let done = false;
  const fin = () => { if (done) return; done = true; requestAnimationFrame(() => requestAnimationFrame(res)); };
  setTimeout(fin, 700);
  v.pause();
  if (v.readyState >= 2 && v.currentTime === 0) return fin();
  // 되감은 첫 장면이 실제로 그려지면(지원 브라우저) 바로, 아니면 seeked 뒤 두 프레임 기다린다
  if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(() => fin());
  v.addEventListener('seeked', fin, { once: true });
  v.currentTime = 0;
});
// 재생을 걸고, 영상이 실제로 재생 장면을 그리기 시작하면(두 번째 프레임 이후) 풀린다.
// 늦어지면 최대 0.4초까지 기다린다(검은 프레임보다 살짝 늦은 시작이 덜 거슬림).
const playing = (v) => new Promise((res) => {
  let done = false;
  const fin = () => { if (done) return; done = true; res(); };
  const tick = (now, meta) => { if (done) return; if ((meta && meta.mediaTime >= .03) || v.currentTime >= .03) fin(); else v.requestVideoFrameCallback(tick); };
  if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(tick);
  else { const f = () => { if (v.currentTime >= .03) { v.removeEventListener('timeupdate', f); fin(); } }; v.addEventListener('timeupdate', f); }
  setTimeout(fin, 400);
  const p = v.play(); if (p && p.catch) p.catch(fin);
});
const playFrom0 = (v) => new Promise((res) => {
  v.currentTime = 0;
  const go = () => { v.removeEventListener('playing', go); res(); };
  v.addEventListener('playing', go);
  const p = v.play(); if (p && p.catch) p.catch(() => { v.removeEventListener('playing', go); res(); });
});
const ended = (v) => new Promise((res) => {
  if (v.ended) return res();
  const f = () => { v.removeEventListener('ended', f); res(); };
  v.addEventListener('ended', f);
});
const toEnd = (v) => new Promise((res) => {
  const f = () => { v.removeEventListener('seeked', f); res(); };
  v.addEventListener('seeked', f); v.pause(); v.currentTime = Math.max(0, (v.duration || 2) - .01);
});
const nearEnd = (v, sec) => new Promise((res) => {
  const f = () => { if (v.ended || (v.duration && v.currentTime >= v.duration - sec)) { v.removeEventListener('timeupdate', f); res(); } };
  v.addEventListener('timeupdate', f); f();
});
// 끝에서 sec초 전 장면이 실제로 그려지는 순간(프레임 단위, 지원 안 하면 timeupdate·ended)
const atTail = (v, sec) => new Promise((res) => {
  let done = false;
  const fin = () => { if (done) return; done = true; v.removeEventListener('ended', fin); res(); };
  v.addEventListener('ended', fin);
  if (v.requestVideoFrameCallback) {
    const tick = (now, meta) => { if (done) return; if (v.duration && meta.mediaTime >= v.duration - sec) fin(); else v.requestVideoFrameCallback(tick); };
    v.requestVideoFrameCallback(tick);
  } else nearEnd(v, sec).then(fin);
});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const label = (v) => {
  stage.classList.toggle('is-bloomed', v);
};

async function run() {
  if (busy) return; busy = true;
  while (want !== open) {
    const v = want;
    if (v) {
      // 펼치기: 알루가 돌던 방향으로 이어 돌다 원래 렌더 자세에서 멈추면(최대 약 1초) 같은 자세에서 시작하는 영상으로 넘어간다.
      // 영상은 1% 불투명도로 미리 깔아 둔다: 아이폰도 첫 장면을 실제로 그려 두고, 눈에는 안 보인다
      bloomV.classList.add('is-prep');
      const ready = atStart(bloomV);
      await Promise.race([alu.rest(true), wait(1400)]);
      if (reduced.matches) { bloomV.classList.remove('is-prep'); await toEnd(bloomV); show(bloomV, true); stage.classList.add('is-vid'); }
      else {
        await ready;
        // 영상은 1%로 숨은 채 재생을 먼저 건다(아이폰은 재생 시작 순간 한 프레임 검게 비칠 수 있음).
        // 영상이 실제로 장면을 그리기 시작하면, 녹기 시작하는 첫 0.9초 동안 멈춘 알루→영상을 겹쳐 넘긴다.
        // 질감이 바뀌는 것이 움직임 속에 묻혀 '전환'이 아니라 녹는 연출의 일부로 보인다.
        // (곡선: 영상은 직선으로 차오르고 알루는 ease-in으로 늦게 빠져 screen 합성 밝기가 평평)
        await playing(bloomV);
        bloomV.classList.add('is-xin'); bloomV.classList.remove('is-prep'); show(bloomV, true);
        stage.classList.add('is-xf');
        await wait(920);
        stage.classList.add('is-vid'); bloomV.classList.remove('is-xin');
        await wait(300); if (bloomV.classList.contains('is-on')) alu.pause?.(true);   // 영상이 덮는 동안 알루는 쉰다(끊김 방지)
        await ended(bloomV);
      }
      show(foldV, false);
      open = true;
    } else {
      // 접기: 꽃(펼침 영상 마지막 장면 = 접힘 영상 첫 장면)에서 거꾸로 접혀 알루로, 그다음 실시간 알루로 넘어간다.
      if (reduced.matches) { alu.pause?.(false); stage.classList.remove('is-vid', 'is-xf'); show(bloomV, false); }
      else {
        await playFrom0(foldV);
        // 같은 장면끼리 바꿔 끼우기: 겹쳐 흐려지지 않게 전환 없이 한 번에
        foldV.style.transition = bloomV.style.transition = 'none';
        show(foldV, true); show(bloomV, false); void foldV.offsetWidth;
        foldV.style.transition = bloomV.style.transition = '';
        await nearEnd(foldV, .7); alu.pause?.(false);            // 끝나기 직전에 알루를 다시 깨워 둔다
        // 접힘 영상이 알루 자세로 가라앉는 마지막 0.5초 동안 영상→알루(같은 자세로 멈춰 있음)를 겹쳐 넘긴다.
        // 움직임이 잦아드는 속에서 질감이 바뀌어 끝에서 툭 바뀌는 느낌이 없다(영상 끝 검은 프레임도 피함).
        // (곡선: 영상은 직선으로 빠지고 알루는 ease-out으로 빨리 차올라 screen 합성 밝기가 평평)
        await atTail(foldV, .5);
        foldV.classList.add('is-xout');
        stage.classList.add('is-xb'); stage.classList.remove('is-vid', 'is-xf');
        show(foldV, false);
        await wait(470);
        stage.classList.remove('is-xb'); foldV.classList.remove('is-xout');
        foldV.pause();
        bloomV.pause(); bloomV.currentTime = 0;                   // 다음 펼침을 위해 첫 장면을 미리 준비
        await wait(220);
      }
      alu.rest(false);
      open = false;
    }
  }
  busy = false;
}

const setOpen = (v) => {
  if (want === v && (busy || open === v)) return;
  want = v; label(v);
  if (alu && bloomV && !stage.classList.contains('is-fallback')) run();

};
const toggle = () => setOpen(!want);

let mounted = false;
const mount = () => {
  if (mounted) return;
  mounted = true;
  alu = mountAluSphere(box, {
    assets: new URL('../assets/alu/', import.meta.url).href,
    onReady: () => { bloomV = vid('bloom'); foldV = vid('fold'); stage.classList.add('is-ready'); stage._alu = alu; },
    onFail: () => stage.classList.add('is-fallback'),
    // 누르면 앱처럼 쏙 들어갔다가 그 반동으로 펼쳐진다.
    onTap: () => setTimeout(toggle, 90),
  });
  light(alu);
};

// 뒤 조명이 알루 회전에 반응: 돌리는 방향으로 빛이 흐르고, 빠를수록 밝아졌다가 천천히 가라앉는다.
function light(alu) {
  if (!alu.motion || reduced.matches) return;
  let on = false, raf = 0, e = 0, x = 0, last = 0;
  const tick = (now) => {
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    const { vel, idle } = alu.motion();
    const sp = Math.max(0, Math.abs(vel) - Math.abs(idle));
    const te = Math.min(1, sp / 3), tx = Math.max(-1, Math.min(1, vel / 4));
    e += (te - e) * Math.min(1, dt * (te > e ? 6 : 1.4));
    x += (tx - x) * Math.min(1, dt * (Math.abs(tx) > Math.abs(x) ? 5 : 1.2));
    stage.style.setProperty('--le', e.toFixed(3));
    stage.style.setProperty('--lx', x.toFixed(3));
    if (on) raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver(([en]) => {
    on = en.isIntersecting; cancelAnimationFrame(raf); last = 0;
    if (on) raf = requestAnimationFrame(tick);
  }).observe(stage);
}



if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); mount(); }
  }, { rootMargin: '900px 0px' });
  io.observe(stage);
} else {
  mount();
}
