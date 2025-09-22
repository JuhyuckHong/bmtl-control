---
encoding: utf-8
lang: ko
---

# Repository Guidelines

이 문서는 본 저장소의 구조, 빌드/개발 절차, 코드 스타일, 테스트, 협업 규칙을 간결히 안내합니다.

## Encoding Notice
- 문서는 UTF-8 인코딩을 유지하고 BOM 없이 저장하여 한글 깨짐을 방지하세요.

## Project Structure & Module Organization
- 런타임 소스는 `src/`에 위치. `main.jsx`가 `App.jsx`를 부팅합니다.
- 페이지: `src/pages/` (예: `ModuleControl.jsx`, `MQTTPage.jsx`).
- 공용 UI: `src/components/`; 데이터 헬퍼: `src/hooks/`; 전역 상태: `src/contexts/`.
- 상수: `src/constants/`; 공유 스타일: `src/styles/`.
- 정적 에셋: `public/`; 프로덕션 빌드 산출물: `dist/`(일회성, 추적 불필요).
- 테스트는 코드 옆(`FeatureName.test.jsx`) 또는 `src/__tests__/`에 배치합니다.

## Build, Test, and Development Commands
- `npm install`: 의존성 복원.
- `npm run dev`: Vite 개발 서버 시작(`http://localhost:5173`).
- `npm run build`: 최적화 번들 생성(`dist/`).
- `npm run preview`: 최신 빌드 서빙(프로덕션 동작 검증).
- 테스트: 아직 스크립트 미연결. PR에서 Vitest 도입 후 `npm test` 또는 `npx vitest`를 사용하세요.

## Coding Style & Naming Conventions
- 들여쓰기 4칸, 문자열은 double quotes, 세미콜론 유지.
- 컴포넌트/파일: PascalCase (`DarkModeToggle.jsx`).
- 훅: `use` 접두의 camelCase (`useMQTT.js`).
- 상수: UPPER_SNAKE_CASE; CSS 클래스: kebab-case.
- 재사용 요소는 named export, 페이지는 default export를 권장.

## Testing Guidelines
- Vitest + React Testing Library 도입 권장.
- 핵심 시나리오: MQTT 연결 흐름과 명령 발행; 브로커 호출은 mock 처리.
- 커버리지 목표: 신규 모듈 기준 80% 내외. 의도적 공백은 PR에 명시.
- 파일 명명: `FeatureName.test.jsx`; 위치는 코드 옆 또는 `src/__tests__/`.

## Commit & Pull Request Guidelines
- 커밋 제목: 한 문장, 명령형(예: "Consolidate camera MQTT topic management").
- 본문은 선택이지만 동작 변경의 이유를 간단히 설명.
- PR: 간단 요약, 스크린샷/GIF, 연결 이슈 ID, 수행 테스트(수동/자동) 체크리스트 포함.
- 기능 진행 중에는 Draft PR을 활용하세요.

## Environment & Configuration
- `.env.example`를 `.env`로 복사하고 브로커 호스트/포트/자격을 설정.
- 비밀은 커밋하지 말고 로컬/CI 변수로 관리. 환경 키 추가 시 `.env.example`와 README를 함께 갱신.

## Communication
- 기본 문서화와 커뮤니케이션은 한국어를 사용합니다. 영어 요약은 요청 시 제공하세요.
