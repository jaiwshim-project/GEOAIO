---
name: api_selection
description: AI API 모델 선택 기준과 방법 — 작업 유형·속도·비용·신뢰성·동시성 한도를 기준으로 Gemini·Claude·OpenAI·Perplexity 중 최적 모델 선택. Vercel/serverless 환경의 timeout 회피 패턴 포함.
---

# AI API 모델 선택 스킬 (로컬 사본)

> 글로벌 스킬: `C:\Users\USER\.claude\skills\api_selection\SKILL.md`
> 이 파일은 프로젝트 내 백업·참조용 사본입니다.

## 빠른 참조

| 작업 | 선택 |
|---|---|
| 마크다운 초안 | Gemini 2.5 Flash |
| EEAT·구조화 변환 | Claude Sonnet 4 |
| JSON strict 필수 | Gemini + responseSchema (단, schema 너무 엄격하지 않게) |
| 짧은 분류 | Claude Haiku 4.5 |
| 외부 검색 인용 | Perplexity sonar 또는 GPT-4o + web_search |

## 핵심 원칙

1. **한 함수 = 한 LLM** (60초 timeout 회피)
2. **단계별 분리** (마크다운=Gemini, 변환=Claude)
3. **AGENT_BATCH=1 또는 3** (Gemini 동시성 안전)
4. **분량 ≤ 토큰 한도의 80%** (잘림 방지)

## 결정 트리

```
짧고 단순 → Gemini Flash
긴 구조화 → Gemini (1차) + Claude (정밀 보강)
JSON strict → Gemini + schema (관대하게)
외부 검색 → Perplexity / GPT-4o
비용 최우선 → Gemini Flash
신뢰성 최우선 → Claude Sonnet
```

상세 가이드는 글로벌 스킬 파일 참조: `C:\Users\USER\.claude\skills\api_selection\SKILL.md`

또는 `/api_selection` (Claude Code에서 스킬 직접 호출).

---

**원본 작성 컨텍스트**: GEO-AIO 콘텐츠 플랫폼 (2026-04, 분대 Tango/Victor/Whiskey/Yankee 다중 API 배치 검증).
