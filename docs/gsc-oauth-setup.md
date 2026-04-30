# Google Search Console OAuth 설정 가이드

색인 모니터링 대시보드(`/dashboard/indexing/[siteId]`)와 cron 리포트가 **실데이터**를 사용하려면 한 번만 OAuth를 설정하면 됩니다. 이후 영구적으로 갱신됩니다.

---

## 환경 변수 (Vercel)

다음 4개를 `aio-geo-optimizer` Vercel 프로젝트의 환경 변수에 등록.

| 변수 | 설명 |
|---|---|
| `GSC_CLIENT_ID` | Google Cloud OAuth 2.0 클라이언트 ID |
| `GSC_CLIENT_SECRET` | Google Cloud OAuth 2.0 클라이언트 비밀 |
| `GSC_REFRESH_TOKEN` | 1회 동의 후 발급되는 영구 토큰 |
| `INDEXING_CRON_SECRET` | 임의 32자+ 문자열. cron-report API 인증용 |

---

## 1단계: Google Cloud OAuth 클라이언트 생성

1. https://console.cloud.google.com/apis/credentials → 프로젝트 선택 (없으면 신규 생성)
2. **API 사용 설정**: "Search Console API" 검색 → 사용 설정
3. **OAuth 동의 화면 구성** (외부, 자신만 사용 시 "테스트 사용자"에 본인 Gmail 추가)
4. **사용자 인증 정보 만들기** → "OAuth 클라이언트 ID" → 애플리케이션 유형: "**데스크톱 앱**" 선택
   - 데스크톱 앱이 가장 간단. `urn:ietf:wg:oauth:2.0:oob` 또는 `http://localhost` 리디렉션 OK
5. 생성된 **클라이언트 ID·비밀**을 메모

---

## 2단계: refresh_token 1회 발급

다음 URL을 브라우저에 복사 (CLIENT_ID만 본인 값으로 교체).
`scope`은 GSC read-only.

```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=urn:ietf:wg:oauth:2.0:oob
  &response_type=code
  &scope=https://www.googleapis.com/auth/webmasters.readonly
  &access_type=offline
  &prompt=consent
```

(URL은 실제로는 한 줄. 줄바꿈은 가독성용)

→ 동의 후 화면에 표시되는 **인증 코드**(보통 4/...로 시작)를 복사.

---

## 3단계: 인증 코드 → refresh_token 교환

본인 PC 터미널에서 실행 (curl). `YOUR_CLIENT_ID`, `YOUR_CLIENT_SECRET`, `YOUR_AUTH_CODE` 교체.

```bash
curl -X POST https://oauth2.googleapis.com/token \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=YOUR_AUTH_CODE" \
  -d "redirect_uri=urn:ietf:wg:oauth:2.0:oob" \
  -d "grant_type=authorization_code"
```

응답 예:
```json
{
  "access_token": "ya29....",
  "expires_in": 3599,
  "refresh_token": "1//0g....",
  "scope": "https://www.googleapis.com/auth/webmasters.readonly",
  "token_type": "Bearer"
}
```

`refresh_token` 값이 **GSC_REFRESH_TOKEN**.

---

## 4단계: Vercel 환경 변수 등록

```bash
vercel env add GSC_CLIENT_ID         # 1단계 값
vercel env add GSC_CLIENT_SECRET     # 1단계 값
vercel env add GSC_REFRESH_TOKEN     # 3단계 값
vercel env add INDEXING_CRON_SECRET  # 임의 32자+ (예: openssl rand -hex 32)
```

Production·Preview·Development 모두 체크 권장.
이후 `vercel deploy --prod` 또는 다음 push로 자동 반영.

---

## 5단계: GSC에 사이트 등록 + 권한 확인

- https://search.google.com/search-console
- 본인 계정으로 `digitalsmile.tistory.com` 속성이 등록되어 있어야 함
- 도메인 속성 (`sc-domain:...`) 추천 — 모바일·데스크톱 통합

---

## 6단계: Supabase 테이블 생성

`docs/indexing-dashboard-supabase-schema.sql` 내용을 Supabase SQL Editor에 복사 → Run.

---

## 7단계: 동작 확인

1. 대시보드 접속: `https://www.geo-aio.com/dashboard/indexing/digitalsmile-tistory`
2. **🔄 지금 측정** 클릭
3. mock 경고가 사라지고 실데이터가 표시되면 성공

---

## cron-report 호출 예시 (수동 테스트)

```bash
curl -X POST https://www.geo-aio.com/api/indexing/cron-report \
  -H "Authorization: Bearer YOUR_INDEXING_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "digitalsmile-tistory",
    "siteUrl": "sc-domain:digitalsmile.tistory.com",
    "sitemapUrl": "https://digitalsmile.tistory.com/sitemap.xml",
    "sampleSize": 100,
    "categoryMap": {
      "디지털스마일치과": ["/category/1"],
      "임플란트": ["/category/2"],
      "교정": ["/category/3"],
      "라미네이트": ["/category/4"],
      "보철": ["/category/5"],
      "틀니": ["/category/6"]
    }
  }'
```

응답의 `report` 필드가 텍스트 리포트입니다.

---

## 보안 주의

- `GSC_REFRESH_TOKEN`·`INDEXING_CRON_SECRET`은 절대 Git에 커밋 금지
- Vercel 환경 변수에만 보관
- refresh_token이 노출되면 즉시 https://myaccount.google.com/permissions 에서 권한 철회 후 재발급
