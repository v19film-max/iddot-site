# iddot-bloom 출처 기록

- 만든 방법: 블렌더 MCP로 직접 모델링·재질·조명·애니메이션. 외부 모델·텍스처·HDRI 없음. 유료 AI 3D 생성 없음.
- 블렌더: 5.2.3 LTS (glTF 내보내기 Khronos glTF Blender I/O v5.2.41)
- 참고 자료(읽기만 함):
  - 금속 구 메시: alu-v2/assets/alu-metal.bin (7,733,840바이트) — 블렌더 glTF 가져오기로 읽음(외부 버퍼 참조용 .gltf 설명 파일을 임시 폴더에 작성). 311,572면 → 40,000면으로 줄이고 원래 법선을 옮겨 붙임.
  - 표면 디테일: alu-v2/assets/alu-metal-normal.png (4096, sha256 84d6d7c35878ac91a972c947868574514abe69db278f4e802c69b9dbf5ee5768) → 2048로 줄여 textures/alu-metal-normal-2048.png 로 저장, GLB 안에는 WebP(품질 88)로 들어감.
  - 재질 값: MetalCrystal.tsx 주석(기본색 0.03, 금속, 거칠기 0.32)
  - 펼친 모양: iddot-site/assets/symbol_final.png — 정면 좌표를 눈으로 측정(1픽셀 = 0.002m, 중심 715,705). 위치·크기는 추정 측정값(오차 약 5~10픽셀).
- 산출물
  - iddot-bloom_v02.glb (웹 납품본): 3,309,188바이트, sha256 793ad33b4541434d64af352a068af0d833b6bcf1adf71feae23b653630b6f301, 삼각형 77,168(금속 구 40,000 + 크롬 37,168), 애니메이션 1개 "iddot_bloom" 0~2초
  - iddot-bloom.glb (1차본, 사용 안 함: 애니메이션이 오브젝트별 18개로 나뉨): 3,310,008바이트, sha256 1e6171aa301d549011baee894ce6e56fcc2cf59f112ec438341ad681a75c215f
  - iddot-bloom.blend: 45,222,548바이트, sha256 5ddfa0b5e78fc324d160aca672036d15ebecec333ebf1383ab633da1d2c29447 (장면 "iddot_bloom". 안전 모드 제약으로 열려 있던 파일 전체의 사본이라 다른 장면도 함께 들어 있음)
  - preview-*_v02.png, preview-sheet.png (사이클 렌더 128샘플+노이즈 제거, AgX)
- 사용 스킬: EL4CTEO/blender-skills (커밋 fb92cfb) blender-core, blender-hardsurface-modeling(미호출, 원칙만), blender-pbr-materials, blender-lighting-lookdev, blender-rendering(미호출), blender-export-pipelines, blender-asset-qa
