/* 홈 About 왼쪽: 알루 금속 구(알루 앱 대기 상태 그대로, 실시간).
   임시판: 꽃으로 펼쳐지는 영상은 아직 붙이지 않고 알루 구만 보여준다.
   그림 파일이 커서 About 근처에 왔을 때 불러온다. */
import { mountAluSphere } from './alu-bloom.js?v=s1';

const stage = document.getElementById('stage');
const box = document.getElementById('aluBox');

let mounted = false;
const mount = () => {
  if (mounted) return;
  mounted = true;
  const alu = mountAluSphere(box, {
    assets: new URL('../assets/alu/', import.meta.url).href,
    onReady: () => stage.classList.add('is-ready'),
    onFail: () => stage.classList.add('is-fallback'),
    onTap: () => {},
  });
  light(alu);
};

// 뒤 조명이 알루 회전에 반응: 돌리는 방향으로 빛이 흐르고, 빠를수록 밝아졌다가 천천히 가라앉는다.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
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
