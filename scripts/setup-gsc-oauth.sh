#!/usr/bin/env bash
# GSC OAuth 자동 설정 스크립트
# 사용자가 1회 실행하면:
#   1) 동의 URL 생성·브라우저 자동 오픈
#   2) 인증 코드 → refresh_token 교환
#   3) Vercel 환경변수 4개 자동 등록 (production)
#   4) 재배포 트리거
#   5) 대시보드 mock 사라졌는지 자동 검증
#
# 전제 조건 (스크립트 실행 전 사용자가 미리 해야 할 일):
#   A) Google Cloud Console에서 OAuth 클라이언트 발급 → CLIENT_ID·CLIENT_SECRET 확보
#      (자세한 절차는 docs/gsc-oauth-setup.md 1단계 참고)
#   B) GSC에 digitalsmile.tistory.com 사이트 소유자로 등록
#   C) Vercel CLI 로그인 (npx vercel login) — 이미 됐으면 스킵
#
# 사용:
#   bash scripts/setup-gsc-oauth.sh
# 또는 git bash on Windows:
#   ./scripts/setup-gsc-oauth.sh

set -euo pipefail

color() { printf "\033[%sm%s\033[0m\n" "$1" "$2"; }
ok()    { color "32" "✓ $1"; }
warn()  { color "33" "⚠ $1"; }
err()   { color "31" "✗ $1"; }
hdr()   { color "1;36" "$1"; }
prompt(){ color "36" "▸ $1"; }

hdr "============================================================"
hdr "  GSC OAuth 자동 설정 — digitalsmile.tistory.com"
hdr "============================================================"
echo

# ── 1. 사전 입력값 받기 ──────────────────────────────────────
prompt "Google Cloud Console에서 발급받은 OAuth 클라이언트 정보를 입력하세요"
prompt "(아직 발급 안 했으면 docs/gsc-oauth-setup.md 1단계 먼저 진행)"
echo

read -rp "  CLIENT_ID: " CLIENT_ID
[[ -z "$CLIENT_ID" ]] && { err "CLIENT_ID 비어 있음"; exit 1; }

read -rsp "  CLIENT_SECRET: " CLIENT_SECRET; echo
[[ -z "$CLIENT_SECRET" ]] && { err "CLIENT_SECRET 비어 있음"; exit 1; }

REDIRECT_URI="urn:ietf:wg:oauth:2.0:oob"
SCOPE="https://www.googleapis.com/auth/webmasters.readonly"

# ── 2. 동의 URL 생성 ────────────────────────────────────────
AUTH_URL="https://accounts.google.com/o/oauth2/v2/auth"
AUTH_URL+="?client_id=$CLIENT_ID"
AUTH_URL+="&redirect_uri=$REDIRECT_URI"
AUTH_URL+="&response_type=code"
AUTH_URL+="&scope=$(printf '%s' "$SCOPE" | sed 's|/|%2F|g; s|:|%3A|g')"
AUTH_URL+="&access_type=offline"
AUTH_URL+="&prompt=consent"

echo
hdr "── 2단계: 동의 URL ──"
echo
echo "$AUTH_URL"
echo

# 자동 브라우저 오픈 시도
if command -v start >/dev/null 2>&1; then
  start "" "$AUTH_URL" 2>/dev/null || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$AUTH_URL" 2>/dev/null || true
elif command -v open >/dev/null 2>&1; then
  open "$AUTH_URL" 2>/dev/null || true
fi

prompt "위 URL이 브라우저에서 열렸습니다 (안 열렸으면 직접 복사·붙여넣기)"
prompt "박찬익 원장 Google 계정으로 로그인 → 동의 → 표시되는 코드(4/...)를 복사"
echo

read -rp "  인증 코드 (4/...): " AUTH_CODE
[[ -z "$AUTH_CODE" ]] && { err "코드 비어 있음"; exit 1; }

# ── 3. refresh_token 교환 ──────────────────────────────────
echo
hdr "── 3단계: refresh_token 교환 ──"

TOKEN_RESPONSE=$(curl -sS -X POST https://oauth2.googleapis.com/token \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "code=$AUTH_CODE" \
  -d "redirect_uri=$REDIRECT_URI" \
  -d "grant_type=authorization_code")

REFRESH_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -oE '"refresh_token"\s*:\s*"[^"]+"' | sed -E 's/.*"refresh_token"\s*:\s*"([^"]+)".*/\1/')

if [[ -z "$REFRESH_TOKEN" ]]; then
  err "refresh_token 발급 실패 — 응답 내용:"
  echo "$TOKEN_RESPONSE"
  echo
  warn "흔한 원인: ① 코드가 만료됨(10분 이내 사용) ② 코드 1회 사용 후 재사용 ③ CLIENT_ID/SECRET 오타"
  exit 1
fi
ok "refresh_token 발급 성공 (${#REFRESH_TOKEN}자)"

# ── 4. Vercel 환경변수 등록 ─────────────────────────────────
echo
hdr "── 4단계: Vercel 환경변수 등록 (production) ──"

if ! command -v vercel >/dev/null 2>&1 && ! npx vercel --version >/dev/null 2>&1; then
  err "vercel CLI 없음 — npm i -g vercel 후 재실행"
  exit 1
fi

VERCEL=npx
$VERCEL vercel --version >/dev/null 2>&1 || VERCEL=""

add_env() {
  local name="$1" value="$2"
  echo "  → $name 등록 중..."
  # 기존 값이 있으면 제거 (실패해도 무시)
  echo "y" | $VERCEL vercel env rm "$name" production --yes 2>/dev/null || true
  printf "%s" "$value" | $VERCEL vercel env add "$name" production 2>&1 | tail -3 || {
    err "$name 등록 실패"; exit 1;
  }
  ok "$name 등록 완료"
}

add_env GSC_CLIENT_ID     "$CLIENT_ID"
add_env GSC_CLIENT_SECRET "$CLIENT_SECRET"
add_env GSC_REFRESH_TOKEN "$REFRESH_TOKEN"

# ── 5. 재배포 트리거 ───────────────────────────────────────
echo
hdr "── 5단계: 재배포 트리거 ──"
$VERCEL vercel deploy --prod --yes 2>&1 | tail -3
ok "재배포 트리거 완료 (1~2분 후 반영)"

# ── 6. 검증 ───────────────────────────────────────────────
echo
hdr "── 6단계: 자동 검증 ──"
prompt "1분 30초 후 endpoint 호출해서 mock 사라졌는지 확인합니다..."
sleep 90

VERIFY=$(curl -sS -X POST https://www.geo-aio.com/api/indexing/cron-report \
  -H "Authorization: Bearer b0fdb2a77b3084ec7960d405e912eb3a85bcd788380b1c2a" \
  -H "Content-Type: application/json" \
  -d '{"siteId":"digitalsmile-tistory","siteUrl":"sc-domain:digitalsmile.tistory.com","sitemapUrl":"https://digitalsmile.tistory.com/sitemap.xml","sampleSize":20}' 2>&1)

if echo "$VERIFY" | grep -q '"mock":false'; then
  ok "✅ 실데이터 응답 확인 — GSC OAuth 정상 동작 시작"
elif echo "$VERIFY" | grep -q '"mock":true'; then
  warn "여전히 mock 응답 — 배포 진행 중일 수 있음. 2~3분 후 대시보드 새로고침 후 재확인"
else
  err "예상 못한 응답:"
  echo "$VERIFY" | head -5
fi

echo
hdr "============================================================"
ok "GSC OAuth 설정 완료. 대시보드: https://www.geo-aio.com/dashboard/indexing/digitalsmile-tistory"
hdr "============================================================"
