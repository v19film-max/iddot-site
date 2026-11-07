/* 홈 About 왼쪽: 점 → 꽃.
   평소엔 알루 금속 구(알루 앱 대기 상태 그대로, 실시간)가 돈다. 누르면 원래 렌더 자세로 제자리에 선 뒤,
   같은 자세에서 시작하는 블렌더 통렌더 영상(assets/alu/bloom-*.mp4)으로 이음매 없이 넘어간다:
   거친 알루 표면이 녹아 매끈한 액체 구가 되고, 닦이며 앞면부터 펼쳐져 iddot 크롬 꽃이 된다.
   다시 누르면 거꾸로 접혀(fold-*.mp4) 알루로 돌아오고, 그 자리에서 다시 돈다.
   그림 파일이 커서 About 근처에 왔을 때 불러온다. */
import { mountAluSphere } from './alu-bloom.js?v=s3';

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
let bloomV = null, foldV = null, f0 = null;
// 펼침 영상 첫 장면 그림(검정 바탕은 투명). 실시간 알루와 블렌더 영상의 질감 차이를 이 그림으로 덮어 합성한다.
// 영상끼리 screen으로 겹치면 밝기가 출렁이고, 숨겨 둔 영상은 아이폰에서 제때 안 그려질 수 있어 그림을 쓴다.
const still = () => {
  const i = new Image(); i.className = 'stage__f0'; i.alt = ''; i.setAttribute('aria-hidden', 'true');
  i.decoding = 'async'; i.src = `assets/alu/bloom-f0-${small.matches ? 720 : 1080}.webp?v=s1`;
  stage.appendChild(i); return i;
};

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
// 이미 그려 둔 멈춘 첫 장면(= 제자리 선 알루와 같은 자세)으로 겹침 없이 한 번에 바꾼 뒤 그 자리에서 재생한다.
// (겹치면 밝아져 깜빡이고, 재생부터 걸고 바꾸면 영상이 앞서 나가 튄다)
const swapPlay = (v) => {
  show(v, true); stage.classList.add('is-vid');
  const p = v.play(); if (p && p.catch) p.catch(() => {});
};
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
        if (f0 && f0.complete && f0.naturalWidth) {
          // ① 멈춘 알루 위로 영상 첫 장면 그림을 0.28초에 걸쳐 덮는다(같은 자세, 질감만 바뀜)
          f0.classList.add('is-on'); stage.classList.add('is-xf'); await wait(300);
          // ② 같은 프레임에 그림을 걷고 이미 그려 둔 영상 첫 장면을 켠 뒤(둘이 겹쳐 밝아지지 않게) 그 자리에서 재생
          f0.style.transition = 'none'; f0.classList.remove('is-on');
          bloomV.classList.remove('is-prep'); show(bloomV, true); stage.classList.add('is-vid');
          void f0.offsetWidth; f0.style.transition = '';
          const p = bloomV.play(); if (p && p.catch) p.catch(() => {});
        } else { bloomV.classList.remove('is-prep'); swapPlay(bloomV); }
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
        await ended(foldV);
        // 접힘 영상 끝 장면 = 알루 원래 자세: 전환 없이 한 번에 알루로 바꿔 끼운다
        box.style.transition = 'none';
        stage.classList.remove('is-vid', 'is-xf'); show(foldV, false); void box.offsetWidth;
        box.style.transition = '';
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
    onReady: () => { bloomV = vid('bloom'); foldV = vid('fold'); f0 = still(); stage.classList.add('is-ready'); stage._alu = alu; },
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
