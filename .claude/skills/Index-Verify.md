---
name: index-verify
description: "Google 색인 + AI 인용 상태를 사이트별로 점검하고 종합 건강점수를 산출한다"
triggers:
  - "index-verify"
  - "색인 점검"
  - "AI 인용 점검"
  - "색인 확인"
  - "인용 확인"
  - "색인·인용 점검"
  - "사이트 상태 점검"
---

# /index-verify — 색인·AI 인용 통합 점검 스킬

사용자가 `/index-verify` 또는 관련 트리거를 입력하면 **구글 색인 + AI 인용(Perplexity + ChatGPT) 전체를 자동 점검**하고 종합 건강점수를 산출한다.

---

## 실행 순서 (논스톱)

```
Step 1 → 환경 변수 상태 확인
Step 2 → 색인 현황 조회 (모든 사이트)
Step 3 → AI 인용 현황 조회 (모든 사이트)
Step 4 → 종합 점수 산출
Step 5 → 개선 우선순위 제시
```

---

## Step 1 — 환경 변수 점검

아래 Node.js 코드로 어떤 API가 실제 데이터를 반환하는지 확인한다.

```javascript
const res = await fetch('https://www.geo-aio.com/api/ai-citations/status?siteId=geo-aio-blog');
const d = await res.json();
console.log('Perplexity:', d.perplexityConfigured ? '✅ 실데이터' : '⚠️ Mock');
console.log('ChatGPT:',    d.chatgptConfigured    ? '✅ 실데이터' : '⚠️ Mock');
```

| 변수 | 담당 기능 | 미설정 시 |
|------|----------|----------|
| `GSC_REFRESH_TOKEN` | Google Search Console URL Inspection | Mock 스냅샷 (랜덤 데이터) |
| `PERPLEXITY_API_KEY` | Perplexity sonar 인용률 측정 | Mock (랜덤 cited 여부) |
| `OPENAI_API_KEY` | GPT-4o-mini 언급·추천 측정 | Mock (랜덤 mentioned 여부) |

설정 명령: `echo "값" | npx vercel env add 변수명 production --force && npx vercel --prod --yes`

---

## Step 2 — Google 색인 현황 조회

### 알고리즘 흐름

```
사이트맵 URL 파싱
  └─ fetchSitemapUrls(sitemapUrl) → URL 배열
       └─ sampleSize(기본 100)만큼 slice
            └─ GSC URL Inspection API (concurrency=4 병렬)
                 ├─ state=INDEXED   → indexed++
                 └─ state=그 외     → reasons[state]++
                      └─ categoryMap prefix 매칭 → byCategory[cat]
                           └─ saveSnapshot() → Supabase indexing_snapshots
```

### API 호출

```javascript
// 최신 스냅샷 + 60일 추이 조회
GET /api/indexing/status?siteId=<siteId>

// 새 스냅샷 강제 측정 (GSC 연동 필요)
POST /api/indexing/snapshot
Body: { siteId, siteUrl, sitemapUrl, sampleSize: 100, categoryMap }
```

### 색인률 판정 기준

| 색인률 | 등급 | 의미 |
|--------|------|------|
| 80%+ | ✅ 양호 | GSC 정상, 콘텐츠 품질 우수 |
| 60–79% | 🟡 주의 | 일부 페이지 크롤 예산 부족 |
| 60% 미만 | 🔴 위험 | robots.txt/noindex/duplicate 문제 의심 |

### 미색인 사유 코드 해석

| GSC 코드 | 원인 | 조치 |
|----------|------|------|
| `DUPLICATE_WITHOUT_CANONICAL` | 정규 URL 미설정 | `<link rel="canonical">` 추가 |
| `NOT_CRAWLED` | 크롤 예산 부족 | 불필요한 URL 제거, 사이트맵 정리 |
| `CRAWLED_CURRENTLY_NOT_INDEXED` | 콘텐츠 품질 낮음 | E-E-A-T 강화 |
| `REDIRECT_ERROR` | 리디렉션 체인 | 단일 301 리디렉션으로 정리 |

---

## Step 3 — AI 인용 현황 조회

### 알고리즘 흐름

```
쿼리 목록 로드 (ai_citation_queries, active=true, limit 5)
  │
  ├─ [Perplexity sonar 모델]
  │    POST https://api.perplexity.ai/chat/completions
  │    { model: 'sonar', messages: [{ role: 'user', content: query }] }
  │    → response.citations[] 배열에서 rootDomain 포함 여부 검사
  │    → cited=true이면 citedUrl 추출
  │
  └─ [GPT-4o-mini]
       POST https://api.openai.com/v1/chat/completions
       { model: 'gpt-4o-mini', max_tokens: 800, temperature: 0.3 }
       → 답변 텍스트에서 brandName | domain | rootDomain 정규식 매칭
       → mentioned=true이면 추천 단어 존재 여부 추가 검사
         추천 단어: 추천|권장|좋습니다|탁월|훌륭|유용|효과적|recommend|suggest|great|excellent
       → { mentioned, recommended, mentionExcerpt }

결과 저장 → ai_citation_results (Supabase)
```

### API 호출

```javascript
// 즉시 스캔 실행
POST /api/ai-citations/scan
Body: {
  siteId,
  domain,          // 'www.evarcell.com' 형태
  brandName,       // 사이트 label
  sources: ['perplexity', 'chatgpt'],
  queries: []      // 비우면 DB 저장 쿼리 자동 사용
}

// 통계 조회 (60일 추이 + 쿼리별 결과)
GET /api/ai-citations/status?siteId=<siteId>

// 쿼리 관리
GET/POST/DELETE /api/ai-citations/queries?siteId=<siteId>
```

### AI 인용률 판정 기준

| 지표 | 양호 | 개선 여지 | 집중 개선 |
|------|------|----------|----------|
| Perplexity 인용률 | 60%+ | 30–59% | 30% 미만 |
| ChatGPT 언급률 | 60%+ | 30–59% | 30% 미만 |
| ChatGPT 추천 비율 | (언급 중) 50%+ | 25–49% | 25% 미만 |

---

## Step 4 — 종합 건강점수 산출

```
색인 점수 (0–40점)
  = 색인률(%) × 0.4

Perplexity 인용 점수 (0–25점)
  = 인용률(%) × 0.25

ChatGPT 언급 점수 (0–20점)
  = 언급률(%) × 0.20

ChatGPT 추천 점수 (0–15점)
  = (추천 수 / 스캔 수)(%) × 0.15

총점 = 합산 (0–100점)
  90+ : 🏆 최우수  — AI 전반에서 권위 있는 사이트
  75–89: ✅ 양호   — 주요 지표 달성, 세부 최적화 가능
  60–74: 🟡 보통   — 색인 또는 AI 인용 중 하나 취약
  60 미만: 🔴 위험  — 즉각적인 개선 필요
```

---

## Step 5 — 진단 실행 스크립트

사이트별 전체 현황을 한 번에 출력한다.

```javascript
async function indexVerify(sites) {
  for (const { siteId, domain, label } of sites) {
    // 색인 현황
    const idx = await fetch(`https://www.geo-aio.com/api/indexing/status?siteId=${siteId}`).then(r => r.json());
    // AI 인용 현황
    const ai  = await fetch(`https://www.geo-aio.com/api/ai-citations/status?siteId=${siteId}`).then(r => r.json());

    const indexRate = idx.latest
      ? Math.round((idx.latest.indexed / idx.latest.total_pages) * 100)
      : null;
    const plxRate  = ai.summary?.perplexity?.citationRate ?? null;
    const gptRate  = ai.summary?.chatgpt?.mentionRate ?? null;
    const recCount = ai.summary?.chatgpt?.recommendedCount ?? 0;

    // 점수 계산
    const score = (indexRate ?? 0) * 0.4
      + (plxRate ?? 0) * 0.25
      + (gptRate ?? 0) * 0.20
      + (recCount > 0 ? Math.min(recCount * 10, 100) * 0.15 : 0);

    console.log(`[${label}] 색인: ${indexRate ?? 'N/A'}% | Perplexity: ${plxRate ?? 'N/A'}% | ChatGPT 언급: ${gptRate ?? 'N/A'}% | 추천: ${recCount}건 | 점수: ${Math.round(score)}점`);
  }
}

indexVerify([
  { siteId: 'metabiz101-tistory', domain: 'metabiz101.tistory.com', label: 'AX Biz Group' },
  { siteId: 'geo-aio-blog',       domain: 'www.geo-aio.com',        label: 'GEO-AIO 블로그' },
  { siteId: 'www.evarcell.com',   domain: 'www.evarcell.com',       label: '에바셀' },
  { siteId: 'geo-aio-dental',     domain: 'www.geo-aio.com',        label: '디지털스마일치과' },
]);
```

---

## 개선 우선순위 결정 트리

```
색인률 < 60%
  → 1순위: robots.txt, noindex, canonical 점검
  → sitemapUrl 정상 여부 확인

색인률 ≥ 60% && Perplexity 인용률 < 30%
  → 2순위: 구조화 데이터(Schema.org) 추가
  → 질문형 헤딩(H2) + 직접 답변 형식 콘텐츠 강화

Perplexity 인용률 ≥ 30% && ChatGPT 언급률 < 30%
  → 3순위: 브랜드명을 콘텐츠 본문 앞부분에 명시
  → 외부 언론 인용·인터뷰 확보 → GPT 학습 데이터 반영 대기

ChatGPT 언급됨 && 추천 비율 < 25%
  → 4순위: 추천 표현 유도 콘텐츠 작성 (비교표, "최고의 X" 포스트)
```

---

## 대시보드 URL 빠른 참조

| 사이트 | 색인 대시보드 | AI 인용 대시보드 |
|--------|-------------|----------------|
| AX Biz Group | `/dashboard/indexing/metabiz101-tistory` | `/dashboard/ai-citations/metabiz101-tistory` |
| GEO-AIO 블로그 | `/dashboard/indexing/geo-aio-blog` | `/dashboard/ai-citations/geo-aio-blog` |
| 에바셀 | `/dashboard/indexing/www.evarcell.com` | `/dashboard/ai-citations/www.evarcell.com` |
| 디지털스마일치과 | `/dashboard/indexing/geo-aio-dental` | `/dashboard/ai-citations/geo-aio-dental` |

---

## 핵심 파일 위치

| 역할 | 파일 |
|------|------|
| Google 색인 스냅샷 측정 | `app/api/indexing/snapshot/route.ts` |
| Google 색인 현황 조회 | `app/api/indexing/status/route.ts` |
| AI 인용 스캔 실행 | `app/api/ai-citations/scan/route.ts` |
| AI 인용 현황 조회 | `app/api/ai-citations/status/route.ts` |
| 쿼리 관리 | `app/api/ai-citations/queries/route.ts` |
| Perplexity 클라이언트 | `lib/perplexity-client.ts` |
| ChatGPT 클라이언트 | `lib/chatgpt-client.ts` |
| GSC 클라이언트 | `lib/gsc-client.ts` |
| 사이트 정적 등록부 | `lib/indexing-sites.ts` |
| 색인 차트 컴포넌트 | `components/indexing/IndexingCharts.tsx` |
| AI 인용 차트 컴포넌트 | `components/ai-citations/CitationCharts.tsx` |

---

## 사용 예시

```
/index-verify                        → 전체 사이트 종합 점검
/index-verify geo-aio-blog           → 특정 사이트만 점검
/index-verify 에바셀 색인            → 에바셀 색인만 점검
/index-verify 점수 낮은 사이트       → 점수 낮은 곳 개선안 제시
```
