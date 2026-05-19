---
name: backlink
description: "백링크 실행 로드맵 docx 자동 생성 — Tistory + LinkedIn 6주 캠페인, 9편 Pillar-First 콘텐츠, JSON-LD 4종, 다국어, E-E-A-T 7단계 구조"
triggers:
  - "백링크 로드맵"
  - "백링크 실행 로드맵"
  - "백링크 캠페인"
  - "Tistory LinkedIn 캠페인"
  - "6주 백링크"
  - "콘텐츠 캠페인 로드맵"
  - "AI 인용 백링크"
---

# 백링크 실행 로드맵 자동 생성 스킬

사용자가 "백링크 로드맵 만들어 [클라이언트]" 식으로 요청하면, **6주 9편 캠페인 docx**를 자동 생성한다.

## 입력 (Inputs)

사용자에게 한 번에 모두 요청 (선택 화면 X, 한 번에 받아 자동 진행):

| 키 | 예시 | 필수 |
|---|---|---|
| `client_name` | 디지털스마일치과 | ✅ |
| `key_person` | 박찬익 원장 / 오민석 원장 | ✅ |
| `location` | 대전시 서구 | ✅ |
| `phone` | 042-721-2820 | ✅ |
| `email` | digitalsmiledc@naver.com | ✅ |
| `homepage` | https://www.digitalsmiledc.com | ⭕ |
| `category_url` | https://www.geo-aio.com/blog/category/디지털스마일치과 | ✅ |
| `service_areas` | 디지털 임플란트 / 성인 교정 / 라미네이트 / 보철 / 틀니 / 사후관리 | ✅ |
| `core_program` | AX 프로젝트 (디지털 정밀 진단 시스템) | ⭕ |
| `start_date` | 2026-05-04 (월요일 권장) | ✅ |
| `category_tag` | AX메디 / GEO-AIO | ✅ |
| `industry` | 의료 / 법무 / 금융 / SaaS / 교육 | ✅ |
| `output_path` | C:\Users\USER\Documents\백링크 실행 로드맵 [client_name].docx | ⭕ |

정보 부족 시: **합리적 기본값 자동 추론** (예: `homepage`는 도메인 검색, `output_path`는 Documents 폴더). 추론 불가 항목만 한 번에 모아서 질의.

## 산출물 구조 (Output Schema)

총 9편 + 체크리스트 + 예상 지표.

### 캠페인 일정 (6주)

| Post | 날짜 | 요일 | 채널 | 역할 |
|---|---|---|---|---|
| 1 | W1 월 (start_date) | 월 | Tistory | **Pillar 1** — 클라이언트 전체 소개 |
| 2 | W1 화 | 화 | LinkedIn | Post 1 요약 변형 |
| 3 | W2 월 | 월 | Tistory | **Spoke 1** — 시그니처 시술 비교 가이드 (compare) |
| 4 | W3 월 | 월 | Tistory | **Pillar 2** — 플랫폼·방법론 소개 (theory) |
| 5 | W3 화 | 화 | LinkedIn | Post 4 요약 변형 |
| 6 | W4 월 | 월 | Tistory | **Spoke 2** — 시술별 상세 (case) |
| 7 | W5 월 | 월 | Tistory | **Spoke 3** — 자동화/엔진 (howto) |
| 8 | W5 화 | 화 | LinkedIn | Post 7 요약 변형 |
| 9 | W6 월 | 월 | Tistory | **마무리** — 종합 사례 (summary) |

### Pillar-First 토픽 매핑

| Post | 역할 | 검색 의도 (intent) | 주요 신호 |
|---|---|---|---|
| 1 | Pillar | overview | E-E-A-T 7단계 / FAQ / JSON-LD 4종 |
| 2 | Echo | overview-summary | 해시태그 7+ / LinkedIn 형식 |
| 3 | Spoke | compare | 비교표 / Q&A 5개 / 단계 5 |
| 4 | Pillar | theory | 자동화 5축 / 외주 vs 자체 비교 |
| 5 | Echo | theory-summary | 해시태그 / 압축 5축 |
| 6 | Spoke | case-deep | 케이스 5종 / 비용 범위 / Q&A 5 |
| 7 | Spoke | howto-engine | 단계 6 / 비교표 / Pillar-First 설명 |
| 8 | Echo | howto-summary | 해시태그 / 비교표 압축 |
| 9 | Summary | wrap-up | 6영역 요약 / 5단계 / Q&A 5 |

### 각 Post 본문 7단계 (E-E-A-T)

1. **도입** (2~3문장) — 검색 의도와 직접 연결되는 질문 + 결론 제시
2. **진단** — 왜 이 주제가 지금 중요한가 (시장/AI 신호 변화)
3. **심층** — 핵심 정보 (비교표·단계·통계)
4. **사례** — 클라이언트 실제 적용 + 정량 수치
5. **FAQ** — Q&A 5개 (Q는 80자 이내 자연어, A는 80~150자, 첫 문장에 결론)
6. **결론** (CTA) — 카테고리 페이지 링크 + 한 줄 요약
7. **메타** — 클라이언트 정보 박스 (📍 클리닉명 / 인물 / 위치 / 연락처 / 홈페이지)

### 태그 규칙

- Tistory: 카테고리 1개 + 태그 5~7개 (한국어 + 영문 키워드 혼용)
- LinkedIn: 본문 끝에 해시태그 7~10개 (#GEO #AIO #ChatGPT #Perplexity 고정 + 도메인 키워드 3~5)

### docx 형식 규약

- 본문 인용 영역에 `▎ ` (좌측 세로 막대 + 공백) 프리픽스를 모든 라인에 적용 (시각적 인용 블록 효과)
- Post 헤더: `📝 [Post N / 날짜] Tistory` 또는 `💼 [Post N / 날짜] LinkedIn`
- Post 간 구분선: `---`
- 마지막 섹션:
  - `✅ 게시 체크리스트` (5개 항목)
  - `📊 6주 후 예상 지표` (3개 KPI)

## 게시 체크리스트 (고정 템플릿)

```
매 게시 시:
- 제목·본문 복사·붙여넣기
- 링크 클릭 가능한지 확인 (한글 URL은 자동 인코딩됨)
- 해시태그 7개 입력 (Tistory는 태그란, LinkedIn은 본문 끝)
- 발행 후 5분 내 본인이 게시물 클릭 → 정상 표시 확인
- 24시간 후 GSC URL 검사로 해당 카테고리 페이지 색인 강제 요청
```

## 6주 후 예상 지표 (고정 템플릿)

```
캠페인 완료 시점([end_date] 경) 도달 가능 수치:
- Sample 색인: 5 → 35~50/60
- Google site: 결과: 0 → 150~400건
- Perplexity·ChatGPT 인용: 0 → 2~5건
```

`start_date` + 6주 = `end_date` 자동 계산.

## 실행 절차 (Steps)

### 1. 입력 수집
- 사용자 메시지에서 클라이언트 정보를 추출. 누락 항목은 합리적 기본값 추론. 그래도 부족하면 한 번에 묶어 질의.

### 2. 콘텐츠 자동 생성
- 9편 모두 Markdown으로 작성 (각 800~1,500자)
- Pillar-First 카탈로그 회피 원칙: Post 1과 Post 4가 Pillar로 핵심 카탈로그 정의 → Spoke(3·6·7)는 Pillar 카탈로그를 회피하고 고유 angle만 점유 → 정보 80% 다름
- LinkedIn Echo Post(2·5·8)는 직전 Tistory Post의 핵심을 1/3 분량으로 압축 + 해시태그

### 3. docx 변환
PowerShell + Word COM 또는 Python python-docx 사용.

#### 방법 A — Python python-docx (권장, 가장 단순)
```bash
python -m pip install python-docx --quiet 2>&1 | tail -1
```

```python
# generate_backlink_roadmap.py
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
import sys, json

config = json.loads(sys.stdin.read())
doc = Document()

# 제목
title = doc.add_heading('백링크 실행 로드맵', level=1)

# 각 Post
for post in config['posts']:
    doc.add_paragraph()
    h = doc.add_paragraph()
    h.add_run(f"{post['emoji']} [Post {post['n']} / {post['date_kor']}] {post['platform']}").bold = True

    if post.get('category'):
        doc.add_paragraph(f"카테고리: {post['category']}")
    doc.add_paragraph(f"태그: {post['tags']}")

    doc.add_paragraph().add_run('제목:').bold = True
    for line in post['title_lines']:
        p = doc.add_paragraph(); p.paragraph_format.left_indent = Pt(18)
        p.add_run(f"▎ {line}")

    doc.add_paragraph().add_run('본문:').bold = True
    for line in post['body_lines']:
        p = doc.add_paragraph(); p.paragraph_format.left_indent = Pt(18)
        p.add_run(f"▎ {line}")

    doc.add_paragraph('---')

# 체크리스트
doc.add_paragraph().add_run('✅ 게시 체크리스트').bold = True
for item in config['checklist']:
    doc.add_paragraph(item, style='List Bullet')

# 예상 지표
doc.add_paragraph().add_run('📊 6주 후 예상 지표').bold = True
for kpi in config['kpis']:
    doc.add_paragraph(kpi, style='List Bullet')

doc.save(config['output_path'])
print(f"Saved: {config['output_path']}")
```

호출 예 (PowerShell 한 줄):
```powershell
$cfg = Get-Content config.json -Raw -Encoding UTF8
$cfg | python generate_backlink_roadmap.py
```

#### 방법 B — PowerShell + Word COM (Python 미설치 시)
```powershell
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()
# ... paragraph 추가 ...
$doc.SaveAs([ref]"C:\Users\USER\Documents\백링크 실행 로드맵 $client.docx", [ref]16)  # 16 = wdFormatDocumentDefault
$doc.Close()
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
```

#### 방법 C — Markdown만 출력 (docx 변환 도구 부재 시)
- `[output_path]`의 확장자를 `.md`로 변경하고 그대로 저장
- 사용자에게 "Pandoc·Word·Notion 등으로 변환 가능" 안내

### 4. 검증·보고
- 파일 크기 / 라인 수 확인
- 모든 9개 Post 헤더 grep으로 검증 (`grep -c "Post [0-9]"` = 9)
- 사용자에게 저장 경로·캠페인 일정 요약 보고

## 참조 — 원본 docx 톤·문체

다음은 원본 docx의 톤이다. 그대로 따라 쓴다:

- **2026년 들어** / **AI 시대** / **AI는 어떤 콘텐츠를 인용할까요?** — 시점·문제 환기
- **JSON-LD 구조화 데이터 (Article·FAQPage·HowTo·BreadcrumbList) 4종 동시 삽입** — 기술적 시그널
- **E-E-A-T (Experience·Expertise·Authoritativeness·Trustworthiness)** — 신뢰 시그널
- **FAQ 형식 80~150자 답변, 첫 문장에 결론** — AI 인용 친화 형식
- **HowTo 단계별 가이드** / **번호 매긴 절차**
- **다국어 (한·영·중·일) 자동 번역**
- **Pillar-First 흐름** / **Spoke가 Pillar 카탈로그 회피하며 고유 angle 점유**
- **15가지 톤** / **외주 vs 자체 비교표** / **API 비용 ~5,000원**
- 매 Post 끝에 `📍 [클리닉명] / [인물] / [지역] / [전화] / [이메일] / [홈페이지]` 메타 박스

## 산업별 변형

`industry` 값에 따라 토픽 카탈로그 미세 조정:

- **의료**: 진단·시술·사후관리 / 비용 범위 / 환자 FAQ / 위험·금기
- **법무**: 사건 분류 / 판례 인용 / 단계별 절차 / 비용 / 비밀 유지
- **금융**: 상품 비교 / 수익률 / 위험도 / 세제 혜택 / 사례
- **SaaS**: 기능 비교 / 도입 ROI / 사용 사례 / 가격 티어 / 통합
- **교육**: 커리큘럼 / 효과 측정 / 비용 / 후기 / Q&A

## 결과 보고 템플릿

```
✅ 백링크 실행 로드맵 생성 완료

📁 저장 위치: [output_path]
📅 캠페인 기간: [start_date] ~ [end_date] (6주)
📝 Tistory 5편 / 💼 LinkedIn 4편 = 총 9편
🎯 핵심 키워드: [client_name] / [key_person] / [core_program]
📊 카테고리 페이지: [category_url]

다음 단계:
1. 첫 게시 [start_date] 월요일 — Post 1 (Tistory)
2. 발행 후 5분 내 본인 클릭 확인
3. 24시간 후 GSC URL 색인 요청
```
