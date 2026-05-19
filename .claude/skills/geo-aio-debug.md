# /geo-aio-debug

GEO-AIO 플랫폼 개발 시행착오 스킬을 실행합니다.
현재 상황을 진단하고 해당하는 섹션의 해결책을 제시합니다.

## 실행 방법

사용자가 `/geo-aio-debug`를 호출하면:

1. **현재 문제 파악** — 사용자에게 어떤 문제가 발생했는지 물어보거나, 이미 문제가 설명되어 있으면 바로 진단
2. **해당 섹션 적용** — 아래 9개 섹션 중 해당하는 것을 즉시 제시
3. **즉시 실행 가능한 명령어** 제공

---

## 섹션 0. 협업 원칙 (문제가 반복될 때)
- 구현이 아니라 설계를 먼저 의심
- 사용자가 전체 프로세스 흐름을 먼저 설계 → Claude가 구현
- 복잡한 AI 작업 = 단계 A(초안) + 단계 B(품질 강화)로 분리

## 섹션 1. Vercel 배포가 반영 안 될 때
진단 순서:
1. Vercel Dashboard → Settings → Usage → Deployments 확인 (무료 한도 초과?)
2. vercel.json이 `{"framework":"nextjs"}` 이상인지 확인
3. `npx vercel --prod --scope 팀명` 직접 배포
4. `npx vercel alias [배포URL] [도메인] --scope 팀명` 도메인 재연결

**핵심:** 무료 계정 한도 초과가 코드 버그처럼 보인다 → Pro 업그레이드가 답

## 섹션 2. 미들웨어 오류 / 사이트 완전 불능
필수 환경 변수 6개 확인:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
NEXT_PUBLIC_SITE_URL
```
설정: `echo "값" | npx vercel env add 변수명 production --scope 팀명 --force`

## 섹션 3. 사용자 데이터/프로젝트가 사라진 것처럼 보일 때
- Supabase JWT의 "ref" 필드로 실제 프로젝트 ID 확인
- user_id 변경 시 단계별 마이그레이션: username 임시변경 → 신규 프로필 생성 → 프로젝트 이전
- 비밀번호 분실: Supabase Admin API PUT /auth/v1/admin/users/[id]

## 섹션 4. 504 타임아웃 / AI API 과부하
안전 기준: max_tokens 4096 × 동시 요청 3개
- vercel.json: `{"functions": {"app/api/*/route.ts": {"maxDuration": 120}}}`
- route.ts: `export const maxDuration = 120;`
- 모델 deprecated: claude-sonnet-4-20250514 / gemini-2.5-flash

## 섹션 5. 결과 페이지에 raw JSON 표시
normalizeResult 3단계 폴백 패턴 적용:
1. JSON.parse() 시도
2. "content" 키 직접 추출 (개행 포함 비정규 JSON)
3. 원본 반환

한글 URL: `decodeURIComponent(slug)` 추가

## 섹션 6. 생성 속도 느림 / 품질 불안정
2단계 파이프라인 적용:
- 1단계: 마크다운만 생성 (구조 제약 없음, 빠름)
- 2단계: 결과 페이지에서 E-E-A-T 자동 변환
멀티 에이전트: `Promise.all` batchSize=3 병렬 처리

## 섹션 7. E-E-A-T 구조 (FAQ·비교표) 누락
- TONE_GUIDE에서 "구조:" 항목 제거
- SYSTEM_INSTRUCTION에 마크다운 예시 삽입
- 구조(7단계)는 고정, 톤(문체·제목·도입부)만 가변

## 섹션 8. 재발 방지 체크리스트
신규 플랫폼 시작 시:
```
□ Vercel Pro 계정 확인
□ Supabase 프로젝트 ID 메모
□ 환경 변수 6개 설정
□ vercel.json 최소화
□ AI 모델 최신 버전 확인
□ Vercel maxDuration 120초 설정
```

---

## 사용 예시

`/geo-aio-debug` — 현재 문제를 물어보고 해당 섹션 즉시 제시
`/geo-aio-debug` 뒤에 문제 설명 추가 가능:
- `/geo-aio-debug 배포가 반영이 안 돼`
- `/geo-aio-debug 504 에러 발생`
- `/geo-aio-debug E-E-A-T 구조가 안 만들어져`
