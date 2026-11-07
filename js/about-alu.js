/* 홈 About 왼쪽: 알루 금속 구(알루 앱 대기 상태 그대로, 실시간).
   임시판: 꽃으로 펼쳐지는 영상은 아직 붙이지 않고 알루 구만 보여준다.
   그림 파일이 커서 About 근처에 왔을 때 불러온다. */
import { mountAluSphere } from './alu-bloom.js?v=p19';

const stage = document.getElementById('stage');
const box = document.getElementById('aluBox');

let mounted = false;
const mount = () => {
  if (mounted) return;
  mounted = true;
  mountAluSphere(box, {
    assets: new URL('../assets/alu/', import.meta.url).href,
    onReady: () => stage.classList.add('is-ready'),
    onFail: () => stage.classList.add('is-fallback'),
    onTap: () => {},
  });
};

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); mount(); }
  }, { rootMargin: '900px 0px' });
  io.observe(stage);
} else {
  mount();
}
