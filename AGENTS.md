# AGENTS.md

## 프로젝트 개요
GEO-AIO — AI 검색엔진(AI Overview, Generative Engine) 최적화 콘텐츠 분석·생성 플랫폼.
Next.js 16 + React 19 + Tailwind CSS v4 + Supabase + Claude AI + Gemini AI.
URL: https://www.geo-aio.com | 배포: Vercel

## 작업 시작 규칙
1. 먼저 관련 파일과 기존 테스트를 찾는다.
2. 구현 전에 짧은 계획을 세운다.
3. 한 번에 크게 바꾸기보다, 리뷰 가능한 단위로 나눠서 수정한다.

## 빌드와 테스트
- 설치: `npm ci`
- 개발 서버: `npm run dev`
- 빌드: `npm run build`
- 린트: `npm run lint`
- 배포: Vercel (git push 시 자동)
- 전체 검증은 사용자가 요청했을 때만 수행한다.

## 코드 작성 규칙
- 기존 코드 스타일을 우선 따른다 (App Router, TypeScript).
- 함수는 입력 검증을 먼저 수행한다.
- 로그에는 토큰, 비밀번호, 인증 헤더, 개인정보를 남기지 않는다.
- 설정값은 하드코딩하지 말고 환경 변수를 사용한다.
- API 라우트는 `app/api/` 하위에 생성한다.

## 핵심 파일 구조
- `app/` — Next.js App Router 페이지 및 API 라우트
- `app/api/` — 29개 API 엔드포인트
  - `generate`, `analyze`, `optimize` — 핵심 AI 기능
  - `convert-content` — SNS 5채널 변환
  - `keyword-analysis`, `generate-series` — 키워드/시리즈
  - `generate-images` — Gemini AI 이미지 생성
  - `parse-file` — 파일 파싱 (PDF, DOCX 등)
  - `webhook` — Make.com 통합
  - `blog/`, `community/`, `users/`, `admin/` — CRUD
- `components/` — React 컴포넌트
- `lib/` — 유틸리티, API 클라이언트
- `public/` — 정적 파일

## 외부 서비스 연동
- **Anthropic Claude AI** (`@anthropic-ai/sdk`) — 콘텐츠 분석·생성 핵심 엔진
- **Google Gemini AI** (`@google/genai`) — 이미지 생성, 주제 추천
- **Supabase** — 인증 (이메일 + Google/Kakao OAuth), DB, 스토리지
- **Resend / Nodemailer** — 이메일 발송
- **Make.com** — 노코드 자동화 웹훅

## DB 테이블
- `business_profiles`, `history`, `api_keys`, `generated_images`, `generate_results`
- `blog_posts`, `blog_categories`, `questions`, `reviews`
- `user_plans`, `usage_counts`, `user_profiles`, `user_projects`

## 수정 주의 구간
- `.env`, `.env.local` — API 키 포함, 읽거나 출력하지 않는다.
- `app/api/` — 프로덕션 API, 변경 시 영향 범위 확인 필수.
- Supabase 마이그레이션은 생성까지만, 자동 적용하지 않는다.
- `user_plans`, `usage_counts` — 과금 관련 테이블, 변경 시 주의.
- 배포 스크립트(`vercel.json`, `next.config.*`)는 명시적 요청 시만 수정.

## 보고 형식
최종 보고에는 아래를 포함한다.
- 무엇을 바꿨는지
- 어떤 검증을 했는지
- 남은 위험 요소가 있는지
