# iddot 사이트 — 작업 인수인계 문서

이 문서는 다른 세션/다른 AI(Claude, GPT 등)가 이어서 작업할 때 처음부터 다시 파악하지 않도록
현재 상태·구조·결정 이유·남은 일을 정리한 것입니다. 이 파일 하나만 읽으면 됩니다.

---

## 1. 프로젝트 개요

**브랜드명:** iddot (identity + dot)
**한 줄 소개:** "모든 것은 점 하나에서 시작된다" — 영상 제작을 주력으로 클라이언트의 성장을 위한
콘텐츠·워크를 진행하는 크리에이티브 그룹.

**대표:** 임승민 (Director)
**실제 인프라 (이미 존재, 새로 만들 필요 없음):**
- 도메인: `iddot.space` (Porkbun에서 구매·관리 중)
- 이메일: `ceo@iddot.space`
- 전화: `+82 10 4022 3465`
- 인스타그램: `@iddot.works`
- 사무실: 서울 성동구 아차산로 104 스탈릿 성수, 8층 813-4호

**배포된 사이트:** https://www.iddot.space (HTTPS 정상, Let's Encrypt 인증서 적용됨)
**GitHub 저장소:** https://github.com/v19film-max/iddot-site (public repo, `main` 브랜치 = 배포 브랜치)
**로컬 작업 폴더(영구):** `/Users/imseungmin/Documents/사업/신사업/iddot-site/`
(이 폴더가 GitHub 저장소의 클론입니다. **세션이 바뀌어도 이 폴더에서 작업을 열면 됩니다.**
이전에는 `/private/tmp/...` 임시 스크래치패드에서 작업했는데, 그 경로는 세션이 끝나면
사라지므로 여기로 옮겼습니다.)

---

## 2. 기술 스택 — 왜 이렇게 만들었나

**정적 사이트, 빌드 도구 없음, 프레임워크 없음.** 순수 HTML/CSS/JS.

이유:
- 명함 QR·급한 네트워킹 일정 때문에 즉시 배포 가능해야 했음 (npm install, 빌드 파이프라인 없이
  바로 GitHub Pages에 올라가야 함)
- 사용자가 여러 React Bits 컴포넌트 프롬프트(SpecularButton, ProfileCard, SideRays, ScrollFloat,
  GradualBlur, Stepper, CircularGallery)를 참고 자료로 줬는데, 이 프로젝트엔 React가 없어서
  **전부 바닐라 JS/CSS로 이식**했습니다. React 버전 소스가 필요하면 각 기능명으로 React Bits
  (reactbits.dev)에서 원본을 다시 찾을 수 있습니다.
- 외부 라이브러리가 필요한 것(GSAP, ogl)은 npm 설치 대신 **CDN(jsDelivr)에서 직접 로드**합니다.
  빌드 스텝이 없기 때문입니다.

**배포 방식:** GitHub Pages (레거시 빌드, `main` 브랜치 루트). `git push origin main` 하면
자동으로 재배포됩니다. 별도 CI 설정 없음.

**DNS:** Porkbun에서 `www` CNAME → `v19film-max.github.io` 로 연결돼 있습니다.
GitHub Pages 저장소 설정(Settings → Pages)의 Custom domain 이 `www.iddot.space` 로
등록돼 있고, HTTPS 강제(Enforce HTTPS) 켜져 있습니다.

---

## 3. 파일 구조

```
iddot-site/
├── index.html          메인 페이지 (히어로 + About + Work + Team)
├── contact.html         별도 문의 페이지 (Stepper 다단계 폼)
├── styles.css           전체 공용 스타일시트 (index.html + contact.html 공유)
├── contact.css          contact.html 전용 스타일 (Stepper UI)
├── main.js               스크롤 리빌 + 글자 분해(split text) + Work 필터 + 팀카드 틸트 + 스페큘러 버튼
├── symbol.js             히어로의 인터랙티브 크롬 심볼(WebGL). 점↔꽃 토글 애니메이션
├── contact.js            Stepper 다단계 폼 로직 (검증, 단계 이동, mailto 전송)
├── rays.js               배경 SideRays 조명 효과 (ogl, CDN 동적 로드)
├── scrollfloat.js        GSAP ScrollTrigger 기반 스크롤 스크럽 텍스트 애니메이션
├── gradualblur.js         네비 아래 페이지 상단 점진적 블러
├── CNAME                 GitHub Pages 커스텀 도메인 설정 파일 (www.iddot.space)
└── assets/
    ├── wordmark.png       IDDOT 로고 (글로우 제거, 원본 그대로 추출)
    ├── symbol_start.png   심볼 애니메이션 시작 프레임(점)
    ├── symbol_final.png   심볼 애니메이션 끝 프레임(꽃)
    ├── bloom.mp4          점→꽃 개화 영상 (사용자 제공 원본을 압축, 366KB)
    └── fold.mp4           꽃→점 역재생 영상 (bloom.mp4를 ffmpeg reverse)
```

---

## 4. 지금 상태 — 완료된 것

- [x] 브랜드: iddot (identity + dot), 로고·도메인·이메일·인스타 전부 실사용 중인 것 그대로 반영
- [x] 히어로: 크롬 심볼 클릭 → 점에서 꽃으로 개화, 다시 클릭 → 꽃에서 점으로 역재생 (토글)
- [x] About: "IDENTITY + DOT" 손글씨체(Caveat 폰트) + 손그림 동그라미 강조, 실무 소개 문단(국문+영문)
- [x] Work: 카테고리 필터(All/Film/Branding/Exhibition), 현재 3개 프로젝트는 플레이스홀더
- [x] Team: ProfileCard 스타일(커서 틸트+글로우) — 임승민 대표 카드 1개 실제, 나머지 "Coming soon"
- [x] 우측 하단 고정 연락처(이메일/전화/주소, 이름·인스타는 제외)
- [x] 상단 네비 Contact → `contact.html`로 이동 (같은 페이지 앵커 아님, 완전히 별도 페이지)
- [x] contact.html: 4단계 Stepper 문의 폼 (누구신가요 → 무엇을 만들까요 → 규모 → 내용) →
      제출 시 mailto: 로 메일 앱 열림 (서버 없는 정적 사이트라 실제 서버 전송은 안 됨, 아래 TODO 참고)
- [x] 배경 SideRays 조명, ScrollFloat 스크롤 애니메이션, GradualBlur 상단 블러
- [x] 모바일 반응형 (네비/연락처 박스 좁은 화면 대응)
- [x] HTTPS/도메인 연결 완료, 실제 배포 완료

## 5. 남은 일 (TODO)

1. **Work 섹션 실제 작업물** — 지금은 `Project 01/02/03` 플레이스홀더. `index.html`의
   `.work-item` 블록을 복사해서 늘리면 됩니다. `data-cat` 속성에 `film`/`branding`/`exhibition`
   (복수 가능, 공백 구분) 넣고, `.work-media` 안에 실제 `<img>`/`<video>` 넣기.
   제목/설명은 tts-studio.com 스타일 참고해서 "클라이언트명 + 무엇을 만들었는지" 한 줄로.

2. **Team 섹션 팀원 추가** — `.pc-wrap` 블록을 복사해서 늘리면 됩니다 (지금 "Coming soon"
   placeholder가 그 자리). 팀원 사진이 생기면 `.pc-avatar` 의 `data-initial` 이니셜 대신
   실제 이미지로 교체 필요 (지금은 사진 없이 이니셜 한 글자만 표시).

3. **문의 폼 전송 방식 업그레이드 (선택)** — 지금은 mailto: 방식(메일 앱이 열리고 사용자가
   직접 보내기 눌러야 함). 받은편지함으로 자동 전송되길 원하면 Formspree 같은 무료 서비스
   가입 후 `contact.js`의 제출 핸들러를 fetch(form action) 방식으로 교체하면 됩니다.

4. **사업자등록번호 등 법적 정보** — tts-studio.com 참고 시 푸터에 사업자등록번호가 있었는데
   iddot은 아직 없거나 확인 안 됨. 필요하면 푸터에 추가.

---

## 6. 알아두면 좋은 것 (버그·함정·설계 이유)

**1) 크롬 심볼 토글의 깜빡임 버그 (해결됨)**
`symbol.js` — 영상↔캔버스를 크로스페이드로 전환하면 (a) 영상이 되감기며 첫 프레임이 잠깐
비치고 (b) 두 레이어가 겹쳐 밝기가 튀는 문제가 있었습니다. 지금은 텍스처를 올리고
**동기적으로 한 프레임 그린 뒤 즉시(페이드 없이) 교체**하고, 되감기는 완전히 숨겨진 뒤에만
합니다. 또한 `ended` 이벤트가 브라우저에 따라 안 붙는 경우가 있어 `timeupdate` 로도
종료를 이중 감지합니다. 이 로직을 건드릴 땐 반드시 점→꽃→점→꽃 왕복 테스트를 해보세요
(2번째 사이클에서 멈추는 회귀가 있었습니다).

**2) ScrollFloat를 히어로 텍스트에는 적용 안 함**
`scrollfloat.js` — GSAP ScrollTrigger의 `scrollStart:'center bottom+=50%'` 는 스크롤 없이
로드된 시점(스크롤 0)에 이미 그 지점을 지나쳐 있으면 진행률이 어중간한 값에 고정돼,
첫 화면(히어로)의 글자 일부가 붕 뜬 채로 보이는 버그가 생깁니다. 그래서 `.hero-title`,
`.hero-sub`, `.c-hero .display` (contact.html 히어로)는 이 스크롤 스크럽 효과에서
**의도적으로 제외**하고 기존의 단순 로드-시 리빌 애니메이션(`main.js`)만 적용합니다.
스크롤해야 만나는 텍스트(Team 섹션 제목 등)에만 진짜 스크럽 효과가 걸립니다.

**3) `position:fixed` 배경 레이어의 z-index**
`.rays-bg` 같은 `position:fixed` 요소에 `z-index:0`을 주면 오히려 static 콘텐츠보다
**위에** 그려집니다 (CSS 페인팅 순서상 non-positioned 콘텐츠가 z-index:0 positioned
요소보다 먼저 그려지기 때문). 배경으로 쓰려면 `z-index:-1` 이어야 합니다.

**4) 로고 워드마크 추출**
원본 로고(`ChatGPT Image 2026년 1월 26일 오후 11_11_11.png`, 사업/로고/ 폴더)는
회색 배경 + 강한 글로우 + 그런지 텍스처가 합성돼 있어서 완전 자동 분리가 어려웠습니다.
`assets/wordmark.png`는 밝기 임계값(≥246) + 약한 모폴로지 클로징으로 글로우 없이
글자만 추출한 버전입니다. 원본이 바뀌면 이 추출 작업을 다시 해야 합니다.

**5) 브라우저 캐시 함정**
스타일 수정 후 같은 브라우저 탭에서 확인할 때 캐시된 CSS가 남아 안 바뀐 것처럼 보인
적이 있었습니다. 확인할 땐 강제 새로고침(캐시 무시)을 하거나 쿼리스트링을 붙여서
캐시를 우회하세요.

**6) 검증 방법 — `--print-to-pdf`의 한계**
이 프로젝트를 만들 때 화면을 직접 보기 어려운 환경이라 헤드리스 Chrome의
`--print-to-pdf` 로 레이아웃을 검증했습니다. 이 방식은 **프린트 페이지 크기를 쓰기 때문에
모바일 뷰포트 테스트에는 안 맞습니다** (뷰포트가 아니라 인쇄 용지 크기로 렌더링됨).
모바일 확인은 `--screenshot --window-size=390,844` 같은 헤드리스 스크린샷 방식을 쓰세요.
또한 `position:fixed` 요소(네비, 배경 블러 등)는 PDF로 인쇄할 때 **페이지마다 반복돼서
찍히는** 인쇄 특유의 현상이 있습니다 — 실제 브라우저 스크롤에서는 안 그럽니다, 버그로
오인하지 않도록 주의.

---

## 7. 로컬에서 확인하는 법

```bash
cd "/Users/imseungmin/Documents/사업/신사업/iddot-site"
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 8. 배포하는 법

```bash
cd "/Users/imseungmin/Documents/사업/신사업/iddot-site"
git add -A
git commit -m "설명"
git push origin main
# GitHub Pages가 몇 초~1분 내로 자동 재배포. https://www.iddot.space 에서 확인.
```

---

*최초 작성: 2026-07-24. 이 문서는 사람이 아니라 다음에 이 프로젝트를 열어볼 AI를 위한
문서이므로, 작업이 진행되면서 내용이 바뀌면 이 파일도 같이 업데이트해주세요.*
