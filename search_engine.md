# 홈페이지 검색엔진 등록 가이드 (Google + 네이버)

**대상 사이트**: https://www.geo-aio.com
**작성일**: 2026-04-01
**기술 스택**: Next.js (App Router) + Vercel + Supabase

---

## 목차

1. [사전 준비: SEO 인프라 구축](#1-사전-준비-seo-인프라-구축)
2. [Google Search Console 등록](#2-google-search-console-등록)
3. [네이버 서치어드바이저 등록](#3-네이버-서치어드바이저-등록)
4. [블로그 SSR 전환 (크롤러가 콘텐츠를 읽을 수 있게)](#4-블로그-ssr-전환)
5. [등록 후 확인 및 유지보수](#5-등록-후-확인-및-유지보수)
6. [생성/수정된 파일 목록](#6-생성수정된-파일-목록)

---

## 1. 사전 준비: SEO 인프라 구축

검색엔진에 등록하기 전에, 크롤러가 사이트를 찾고 읽을 수 있는 인프라를 먼저 구축해야 합니다.

### 1-1. robots.txt 생성

크롤러에게 "어디를 방문해도 되는지" 알려주는 파일입니다.

**파일 위치**: `app/robots.ts`

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.geo-aio.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/settings/', '/mypage/'],
      },
      // AI 크롤러 명시적 허용
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Amazonbot', allow: '/' },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

**핵심 포인트**:
- `/api/`, `/admin/`, `/settings/`, `/mypage/` 등 비공개 경로는 차단
- GPTBot, ClaudeBot 등 주요 AI 크롤러를 명시적으로 허용
- sitemap.xml 위치를 안내

**확인 방법**: 배포 후 `https://www.geo-aio.com/robots.txt` 접속


### 1-2. sitemap.xml 생성

크롤러에게 "사이트에 어떤 페이지들이 있는지" 알려주는 파일입니다.

**파일 위치**: `app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.geo-aio.com';
  const now = new Date();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/introduction`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/community`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${siteUrl}/resources`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${siteUrl}/manual`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
```

**핵심 포인트**:
- 공개 페이지만 포함 (로그인 필요 페이지 제외)
- priority: 홈페이지 1.0 > 블로그 0.9 > 소개 0.8 순으로 중요도 설정
- changeFrequency: 블로그는 daily, 소개/가격은 monthly

**확인 방법**: 배포 후 `https://www.geo-aio.com/sitemap.xml` 접속


### 1-3. 메타태그 추가 (layout.tsx)

검색엔진과 SNS에서 사이트 정보를 올바르게 표시하기 위한 메타데이터입니다.

**파일 위치**: `app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: "GEOAIO - AI 콘텐츠 최적화 대시보드",
  description: "AI Overview 및 Generative Engine 최적화를 위한 콘텐츠 분석 도구",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.geo-aio.com'),
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
        ? [process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION]
        : [],
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'GEO-AIO',
    title: 'GEOAIO - AI 콘텐츠 최적화 대시보드',
    description: 'AI Overview 및 Generative Engine 최적화를 위한 콘텐츠 분석 도구',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GEOAIO - AI 콘텐츠 최적화 대시보드',
    description: 'AI Overview 및 Generative Engine 최적화를 위한 콘텐츠 분석 도구',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};
```

**핵심 포인트**:
- `verification.google`: Google Search Console 인증 코드
- `verification.other['naver-site-verification']`: 네이버 서치어드바이저 인증 코드
- OpenGraph: SNS 공유 시 썸네일/제목/설명 표시
- robots: 검색엔진 색인 허용


### 1-4. 환경변수 설정

**.env.local** (로컬 개발용):

```
NEXT_PUBLIC_SITE_URL=https://www.geo-aio.com
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=인증코드
NEXT_PUBLIC_NAVER_SITE_VERIFICATION=인증코드
```

**Vercel 환경변수** (배포용):
1. Vercel 대시보드 > Settings > Environment Variables
2. 위 3개 변수를 동일하게 추가
3. Environment: All (Production, Preview, Development) 선택

> **중요**: `.env.local`은 로컬 전용이므로, Vercel에도 반드시 추가해야 배포 시 반영됩니다.


### 1-5. 빌드 및 배포

```bash
# 빌드 확인
npx next build

# 빌드 결과에서 확인할 것:
# ○ /robots.txt     ← 정적 생성 확인
# ○ /sitemap.xml    ← 정적 생성 확인

# Git 커밋 & 푸시 (Vercel 자동 배포)
git add app/robots.ts app/sitemap.ts app/layout.tsx
git commit -m "feat: add SEO infrastructure for search engine registration"
git push origin master
```

**배포 후 확인**:
- `https://www.geo-aio.com/robots.txt` → 크롤러 규칙 표시
- `https://www.geo-aio.com/sitemap.xml` → 페이지 목록 표시

---

## 2. Google Search Console 등록

### 2-1. Search Console 접속 및 사이트 추가

1. https://search.google.com/search-console 접속 (Google 계정 로그인)
2. 좌측 상단 **"속성 추가"** 클릭
3. **"도메인"** 선택 → `geo-aio.com` 입력 (www 없이)

> "URL 접두어" 방식도 가능하지만, "도메인" 방식이 www/non-www 모두 포함하여 권장됩니다.


### 2-2. 소유권 인증 (DNS TXT 레코드 방식)

Google이 제공하는 TXT 레코드를 도메인 DNS에 추가합니다.

**인증 코드 예시**:
```
google-site-verification=h_GHuVerq2PXKn7B7HM6dZbSsklqPEmhiJt-2wGIHrM
```

**DNS 설정 방법** (가비아 기준):

1. https://dns.gabia.com 로그인
2. `geo-aio.com` 도메인 선택
3. DNS 레코드 추가:

| 항목 | 값 |
|------|-----|
| 타입 | `TXT` |
| 호스트 | `@` (또는 빈칸) |
| 값 | `google-site-verification=인증코드` |
| TTL | 3600 (기본값) |

4. 저장

**DNS 반영 확인** (수 분 소요):
```bash
nslookup -type=TXT geo-aio.com 8.8.8.8
```
결과에 `google-site-verification=...` 텍스트가 보이면 반영 완료.

**Search Console에서 "확인" 버튼 클릭** → 소유권 인증 완료


### 2-3. 사이트맵 제출

소유권 인증 후:

1. Search Console 좌측 메뉴 > **"사이트맵"** 클릭
2. URL 입력: `https://www.geo-aio.com/sitemap.xml`
3. **"제출"** 클릭

> 제출 후 "성공" 상태가 되면 Google이 사이트맵의 모든 URL을 크롤링 대상에 추가합니다.


### 2-4. URL 색인 생성 요청

사이트맵 제출만으로도 크롤링이 시작되지만, 주요 페이지는 개별 색인 요청으로 빠르게 등록할 수 있습니다.

1. Search Console 좌측 메뉴 > **"URL 검사"** 클릭
2. 다음 URL을 하나씩 입력 후 **"색인 생성 요청"** 클릭:
   - `https://www.geo-aio.com`
   - `https://www.geo-aio.com/blog`
   - `https://www.geo-aio.com/introduction`
   - `https://www.geo-aio.com/pricing`

> 신규 사이트는 "URL이 Google에 등록되어 있지 않음"이 정상입니다. 색인 생성 요청 후 수일~2주 내에 등록됩니다.

---

## 3. 네이버 서치어드바이저 등록

### 3-1. 서치어드바이저 접속 및 사이트 추가

1. https://searchadvisor.naver.com 접속 (네이버 계정 로그인)
2. **"웹마스터 도구"** 클릭
3. 사이트 URL 입력: `https://www.geo-aio.com` (호스트 단위, 경로 없이)
4. **추가** 클릭

> **주의**: `https://www.geo-aio.com/sitemap.xml`처럼 경로를 포함하면 "URL을 호스트 단위로 입력해주세요" 에러가 발생합니다.


### 3-2. 소유확인

네이버는 여러 인증 방식을 제공합니다. 두 가지 방법 중 선택:

#### 방법 A: HTML 파일 업로드 (권장)

네이버가 제공하는 HTML 파일을 `public/` 폴더에 생성합니다.

```bash
# 파일명은 네이버가 제공하는 것을 사용 (예시)
echo "naverf5844d70cb270f32088799b59ad912ad" > public/naverf5844d70cb270f32088799b59ad912ad.html
```

배포 후 `https://www.geo-aio.com/naverf5844d70cb270f32088799b59ad912ad.html` 접근 가능해야 합니다.

#### 방법 B: HTML 메타태그 (대안)

`app/layout.tsx`의 metadata에 인증 코드를 추가합니다.

```
NEXT_PUBLIC_NAVER_SITE_VERIFICATION=91e366c565dc0d49a21c8f47fea6d4f9d01b3f5f
```

이 환경변수가 설정되면 `<meta name="naver-site-verification" content="코드값" />`이 자동으로 HTML에 포함됩니다.

**Vercel 환경변수에도 동일하게 추가한 후 재배포** 필요.

서치어드바이저에서 **"소유확인"** 버튼 클릭 → 인증 완료


### 3-3. 사이트맵 제출

소유확인 완료 후:

1. 사이트 목록에서 `https://www.geo-aio.com` 클릭 (사이트 관리 화면 진입)
2. 좌측 메뉴 > **"요청"** > **"사이트맵 제출"** 클릭
3. URL 입력: `https://www.geo-aio.com/sitemap.xml`
4. **"확인"** 클릭

---

## 4. 블로그 SSR 전환

### 4-1. 왜 필요한가

Next.js에서 `'use client'` 컴포넌트도 기본적으로 서버에서 초기 렌더링됩니다. 하지만 `useEffect`로 데이터를 가져오는 경우, 크롤러가 방문할 때 **데이터가 비어 있는 HTML**을 보게 됩니다.

블로그 페이지가 이 경우에 해당했습니다:
- 포스트 목록을 `useEffect` → Supabase 쿼리로 로드
- 크롤러에게는 "총 0개 포스트"로 보임


### 4-2. 해결 방법: 서버 컴포넌트 + 클라이언트 컴포넌트 분리

**page.tsx** (서버 컴포넌트 — 데이터 fetch):

```typescript
// app/blog/page.tsx
import { createClient } from '@supabase/supabase-js';
import BlogClient from './BlogClient';

export const dynamic = 'force-dynamic'; // 매 요청마다 최신 데이터

export const metadata = {
  title: 'GEO-AIO 블로그 — AI 검색 최적화 콘텐츠',
  description: '다양한 업종의 AI 최적화 콘텐츠를 확인하세요.',
};

async function getServerBlogData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data } = await supabase
    .from('blog_articles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  // ... 데이터 가공
  return { posts, categories };
}

export default async function BlogPage() {
  const { posts, categories } = await getServerBlogData();
  return <BlogClient initialPosts={posts} initialCategories={categories} />;
}
```

**BlogClient.tsx** (클라이언트 컴포넌트 — 인터랙티브 UI):

```typescript
// app/blog/BlogClient.tsx
'use client';

import { useState } from 'react';

export default function BlogClient({ initialPosts, initialCategories }) {
  const [posts] = useState(initialPosts);
  // ... 탭 전환, 포스트 클릭 등 인터랙티브 로직
}
```

**핵심 포인트**:
- `createClient`는 `@supabase/supabase-js`에서 직접 import (쿠키 기반 클라이언트가 아닌 공개 데이터용)
- `export const dynamic = 'force-dynamic'`: 매 요청마다 서버에서 최신 데이터로 렌더링
- 서버 컴포넌트에서 metadata를 export하여 페이지별 SEO 메타태그 설정 가능


### 4-3. 결과 확인

빌드 시 `/blog`이 `ƒ (Dynamic)`으로 표시되면 성공:

```
├ ƒ /blog       ← Dynamic (서버 렌더링)
├ ○ /pricing    ← Static (정적 생성)
```

배포 후 크롤러가 보는 내용 확인:
- 변경 전: "총 0개 포스트" (데이터 없음)
- 변경 후: "총 61개 포스트" (모든 포스트 제목/요약 HTML에 포함)

---

## 5. 등록 후 확인 및 유지보수

### 5-1. 색인 반영 예상 일정

| 시점 | 기대 효과 |
|------|----------|
| 1~3일 | Google 크롤링 시작, 일부 페이지 색인 |
| 1~2주 | 주요 페이지 검색 노출 시작 |
| 2~4주 | Search Console에 실적 데이터 표시 |
| 즉시~수일 | Perplexity에서 검색 가능 (실시간 크롤링) |

### 5-2. 정기 확인 사항

**Google Search Console** (주 1회):
- 색인 생성 현황: 몇 개 페이지가 색인되었는지
- 크롤링 오류: 404, 서버 에러 등
- 실적: 검색 노출 수, 클릭 수, 평균 게재순위

**네이버 서치어드바이저** (주 1회):
- 수집 현황: 페이지 수집 성공/실패
- 사이트 진단: SEO 문제점 리포트

### 5-3. 새 페이지 추가 시

1. `app/sitemap.ts`에 새 경로 추가
2. 배포
3. Google Search Console > URL 검사 > 색인 생성 요청

### 5-4. AI 인용 확률을 높이려면

1. **독창적 데이터 포함**: 자체 조사, 실험 결과, 사례 분석
2. **외부 백링크 확보**: 브런치, 링크드인 등에서 사이트 URL 언급
3. **E-E-A-T 강화**: 저자 정보, 전문 자격, 실제 경험 데이터 포함
4. **구조화된 FAQ/How-to 형식**: AI가 답변으로 채택하기 쉬운 구조
5. **꾸준한 발행**: 도메인 권위 축적

---

## 6. 생성/수정된 파일 목록

| 파일 | 설명 | 구분 |
|------|------|------|
| `app/robots.ts` | AI 크롤러 허용 robots.txt | 신규 |
| `app/sitemap.ts` | 동적 사이트맵 생성 (7개 페이지) | 신규 |
| `app/layout.tsx` | Google/네이버 인증 메타태그, OpenGraph, robots | 수정 |
| `app/blog/page.tsx` | 블로그 SSR 서버 컴포넌트 (Supabase 데이터 fetch) | 수정 |
| `app/blog/BlogClient.tsx` | 블로그 클라이언트 컴포넌트 (인터랙티브 UI) | 신규 |
| `public/naverf5844d70cb270f32088799b59ad912ad.html` | 네이버 소유확인 파일 | 신규 |
| `.env.local` | 사이트 URL, Google/네이버 인증 코드 환경변수 | 수정 |

### 환경변수 목록

| 변수명 | 값 | 설정 위치 |
|--------|-----|----------|
| `NEXT_PUBLIC_SITE_URL` | `https://www.geo-aio.com` | .env.local + Vercel |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google 인증 코드 | .env.local + Vercel |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | 네이버 인증 코드 | .env.local + Vercel |

---

## 부록: DNS 네임서버 확인 방법

도메인의 DNS가 어디서 관리되는지 확인:

```bash
nslookup -type=NS geo-aio.com 8.8.8.8
```

결과 예시:
```
geo-aio.com  nameserver = ns.gabia.co.kr
geo-aio.com  nameserver = ns1.gabia.co.kr
```
→ 가비아에서 DNS 관리 중

---
---

## 부록: 이전 작업 대화 기록 (참고용)

> 아래는 2026-03-31에 진행한 GEO-AIO 블로그 AI 검색 인용 최적화 관련 대화 기록 원문입니다.

---

# GEO-AIO 블로그 AI 검색 인용 최적화 대화 기록

**날짜**: 2026-03-31

---

## Q1: 블로그에 포스팅하면 AI가 검색하여 인용이 가능한가?

**질문**: https://www.geo-aio.com/blog 여기에 포스팅하면 AI가 검색하여 인용이 가능하니?

### 결론: 현재 상태로는 AI 인용이 어렵습니다

현재 `geo-aio.com/blog`에는 AI가 콘텐츠를 잘 찾고 인용하기 위한 **핵심 인프라가 빠져 있었습니다.**

#### 현재 문제점

| 항목 | 상태 |
|------|------|
| `robots.txt` | **없음** — 크롤러 가이드 없음 |
| `sitemap.xml` | **없음** — AI/검색엔진이 페이지 목록을 모름 |
| 개별 포스트 URL | **없음** — 모든 글이 `/blog` 한 페이지에 렌더링 |
| Open Graph / 메타태그 | **없음** — 포스트별 title/description 없음 |
| 구조화 데이터 (JSON-LD) | **없음** — Article 스키마 없음 |
| SSR/SSG | **없음** — 클라이언트 렌더링이라 크롤러가 콘텐츠를 못 읽을 수 있음 |

#### AI가 인용하려면 필요한 것

1. **개별 포스트 URL** (`/blog/post-slug`) — AI는 특정 URL을 출처로 인용합니다
2. **서버사이드 렌더링 (SSR)** — 크롤러가 JavaScript 없이도 콘텐츠를 읽을 수 있어야 합니다
3. **robots.txt + sitemap.xml** — AI 크롤러(GPTBot, ClaudeBot, Google-Extended 등)가 페이지를 발견할 수 있게
4. **구조화 데이터 (JSON-LD)** — Article 스키마로 제목, 저자, 날짜 등을 명시
5. **메타태그** — 각 포스트별 description, canonical URL

#### 핵심 요약

> 현재 블로그는 **클라이언트 렌더링 단일 페이지**라서, AI 크롤러가 방문해도 빈 HTML만 보게 됩니다. 개별 포스트 페이지 + SSR + SEO 인프라를 추가해야 AI가 검색하고 인용할 수 있습니다.

---

## 구현 완료 내역

사용자가 "진행"을 요청하여 다음을 구현 완료:

### 1. `robots.txt` (`app/robots.ts`)
- GPTBot, ClaudeBot, Google-Extended, PerplexityBot, Amazonbot 등 주요 AI 크롤러 명시적 허용
- sitemap.xml 위치 안내

### 2. 동적 `sitemap.xml` (`app/sitemap.ts`)
- Supabase에서 발행된 블로그 포스트 전체를 자동 조회
- 각 포스트별 개별 URL (`/blog/{id}`) 생성

### 3. 개별 포스트 API (`app/api/blog/posts/[id]/route.ts`)
- GET `/api/blog/posts/{id}` 단건 조회

### 4. 개별 포스트 페이지 (`app/blog/[id]/page.tsx`) — **핵심**
- **서버사이드 렌더링 (SSR)** — 크롤러가 JS 없이도 완전한 HTML을 읽음
- **동적 메타태그** — title, description, Open Graph, Twitter Card
- **canonical URL** — 중복 콘텐츠 방지
- **JSON-LD 구조화 데이터** — Article 스키마 (제목, 저자, 날짜, 키워드 등)
- 기존 블로그와 동일한 스타일로 본문 렌더링

### 5. 블로그 목록 링크 연결
- 포스트 클릭 시 `/blog/{id}` 개별 페이지로 이동 (SEO 친화적 `<a>` 태그)

---

## Q2: 생성되어 블로그에 포스팅되는 글들은 AI에 인용되는 건가?

### 솔직한 답변: 기술적 인프라는 갖춰졌지만, 인용되려면 더 필요합니다

#### 지금 구현한 것 = "AI가 찾을 수 있게" 한 것

| 단계 | 상태 | 설명 |
|------|------|------|
| 1. 발견 (Discovery) | **완료** | robots.txt, sitemap.xml, 개별 URL |
| 2. 크롤링 (Crawling) | **완료** | SSR로 HTML 콘텐츠 노출 |
| 3. 이해 (Understanding) | **완료** | JSON-LD, 메타태그, 구조화 데이터 |
| 4. **인용 (Citation)** | **보장 안됨** | AI 모델의 판단에 달림 |

#### AI가 인용하는 기준 (현실)

AI가 특정 소스를 인용하려면 **콘텐츠 자체의 품질 조건**이 충족되어야 합니다:

**1. 도메인 권위 (Domain Authority)**
- geo-aio.com은 아직 신생 도메인 → 다른 사이트의 백링크, 언론 인용이 쌓여야 함
- 대형 사이트(위키피디아, 정부기관, 주요 언론)가 우선 인용됨

**2. E-E-A-T (경험, 전문성, 권위, 신뢰)**
- 저자 정보, 전문 자격, 실제 경험 데이터가 콘텐츠에 포함되어야 함
- 현재 블로그 글에 저자 프로필/자격 정보가 부족

**3. 독창적 데이터/인사이트**
- 다른 곳에서 찾을 수 없는 고유한 데이터, 사례, 분석이 있어야 인용 가치가 생김
- 일반적인 정보 재정리만으로는 인용 대상이 되기 어려움

**4. AI 학습 데이터 반영 시차**
- ChatGPT, Claude 등의 학습 데이터에 반영되려면 **수개월~1년 이상** 걸림
- Google AI Overview는 실시간 검색 기반이라 비교적 빠름
- Perplexity는 실시간 크롤링으로 가장 빠르게 반영 가능

#### 현실적인 인용 가능성

| AI 서비스 | 인용 가능성 | 조건 |
|-----------|------------|------|
| **Perplexity** | 높음 | 실시간 웹 검색 → 지금도 가능 |
| **Google AI Overview** | 중간 | Google 검색 색인 필요 (수주 소요) |
| **ChatGPT (Browse)** | 중간 | 웹 브라우징 모드에서 검색될 수 있음 |
| **Claude/ChatGPT (기본)** | 낮음 | 학습 데이터에 포함되어야 함 (수개월+) |

#### 인용 확률을 높이려면

1. **Google Search Console에 사이트 등록** → 색인 요청
2. **독창적 데이터 포함** (자체 조사, 실험 결과, 사례 분석)
3. **외부 백링크 확보** (업계 포럼, 뉴스레터, SNS 공유)
4. **구조화된 FAQ/How-to 형식** 사용 (AI가 답변으로 채택하기 쉬움)
5. **꾸준한 발행** → 도메인 권위 축적

**결론**: 기술 인프라는 완성했지만, **"인용 가능한 상태"와 "실제 인용"은 다릅니다.** 지금은 Perplexity에서 가장 먼저 효과를 볼 수 있고, Google AI Overview는 색인 후 가능합니다. 꾸준히 양질의 콘텐츠를 쌓아가는 것이 핵심입니다.

---

## Q3: Google Search Console 등록

### 구현 내용
- `app/layout.tsx`에 Google/네이버 인증 메타태그 환경변수 추가
- `.env.local.example`에 환경변수 항목 추가

### 등록 절차

**1단계: Google Search Console**
1. https://search.google.com/search-console 접속
2. **"URL 접두어"** → `https://www.geo-aio.com` 입력
3. **"HTML 태그"** 확인 방법 선택
4. `content="..."` 안의 코드를 환경변수에 설정

**2단계: 환경변수 추가**
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=코드값`
- Vercel 환경변수에도 동일하게 추가

**3단계: 배포 후 Google에서 "확인" 버튼 클릭**

**4단계: 사이트맵 제출**
- Search Console > 사이트맵 메뉴 > `https://www.geo-aio.com/sitemap.xml` 제출

### 추가 권장: 네이버 서치어드바이저
- https://searchadvisor.naver.com 에서 동일하게 등록
- `NEXT_PUBLIC_NAVER_SITE_VERIFICATION=코드값`

---

## 생성/수정된 파일 목록

| 파일 | 설명 |
|------|------|
| `app/robots.ts` | AI 크롤러 허용 robots.txt |
| `app/sitemap.ts` | 동적 사이트맵 생성 |
| `app/api/blog/posts/[id]/route.ts` | 개별 포스트 API |
| `app/blog/[id]/page.tsx` | 개별 포스트 SSR 페이지 (메타태그 + JSON-LD) |
| `app/blog/page.tsx` | 블로그 목록에 Link 컴포넌트 적용 |
| `app/layout.tsx` | Google/네이버 인증 메타태그 추가 |
| `.env.local.example` | 환경변수 예시 업데이트 |
