'use client';

// 6·3 지방선거 후보자용 GEO-AIO 마케팅 1페이지 제안서 — 4개 언어 i18n (ko/en/zh/ja)
// 정적 라우트: /proposal/election-2026

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ELECTION_DATE = new Date('2026-06-03T00:00:00+09:00');

function calcDDay(): number {
  const now = new Date();
  const ms = ELECTION_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

type Lang = 'ko' | 'en' | 'zh' | 'ja';
const LANG_LABELS: Record<Lang, { flag: string; label: string }> = {
  ko: { flag: '🇰🇷', label: '한국어' },
  en: { flag: '🇺🇸', label: 'English' },
  zh: { flag: '🇨🇳', label: '中文' },
  ja: { flag: '🇯🇵', label: '日本語' },
};

// ============= 다국어 사전 =============
const T: Record<Lang, {
  badge: string;
  dDayPrefix: string;
  dDaySuffix: string;
  heroLine1: string;
  heroLine2: string;
  heroDesc: string;
  urgencyAlert: string;
  urgencyTail: string;
  stats: { label: string; value: string }[];

  s1Title: string;
  s1Lead: string;
  s1OldEra: string;
  s1OldTitle: string;
  s1OldDesc: string;
  s1MidEra: string;
  s1MidTitle: string;
  s1MidDesc: string;
  s1NewEra: string;
  s1NewTitle: string;
  s1NewDesc: string;
  s1NewBadge: string;

  s2Title: string;
  s2Lead: string;
  s2GroupMP: string;
  s2GroupMayor: string;
  s2MPCount: string;
  s2MayorCount: string;
  s2RoleMP: string;
  s2RoleMayor: string;
  s2CardSub: string;
  s2Footer: string;
  // 양자 대결 + 단독 계약 독점권
  s2ExclusiveBadge: string;
  s2ExclusiveTitle: string;
  s2ExclusiveDesc: string;
  s2VsLabel: string;
  s2TbdName: string;
  s2TbdSub: string;

  s3Title: string;
  s3ColMethod: string;
  s3ColIndex: string;
  s3ColEffect: string;
  s3ColIn3w: string;
  s3RowSeoMethod: string;
  s3RowSeoIndex: string;
  s3RowSeoEffect: string;
  s3RowSnsMethod: string;
  s3RowSnsIndex: string;
  s3RowSnsEffect: string;
  s3RowSnsCost: string;
  s3RowGeoMethod: string;
  s3RowGeoIndex: string;
  s3RowGeoEffect: string;
  s3InstantBadge: string;
  s3InstantTitle: string;
  s3InstantDesc: string;

  s4Title: string;
  s4Lead: string;
  s4LiveBadge: string;
  s4Case1Tag: string;
  s4Case1Title: string;
  s4Case2Tag: string;
  s4Case2Title: string;

  s5Title: string;
  s5Group1: string;
  s5Group2: string;
  s5Items1: { icon: string; title: string; desc: string }[];
  s5Items2: { icon: string; title: string; desc: string }[];
  s5GroupNote: string;
  s5RoadmapTitle: string;
  s5Roadmap: { step: string; title: string; desc: string }[];
  s5ContactLabel: string;
  s5ContactCompany: string;

  s6Title: string;
  s6Desc: string;

  s7Title: string;
  s7Sub: string;
  s7Desc: string;
  s7Alt: string;

  s8Badge: string;
  s8Title: string;
  s8Desc: string;
  s8BookTitle: string;
  s8BookSubtitle: string;
  s8Authors: string;
  s8Publisher: string;
  s8CTA: string;
  s8Alt: string;

  footerSourceTitle: string;
  footerSourceText: string;
  footerLegalTitle: string;
  footerLegalText: string;

  candidateRegions: Record<string, string>;
  candidateNames: Record<string, string>;
  candidateSlogans: Record<string, string>;
  s2BlogBadge: string;
  pdfBtn: string;
  // 다문화 유권자 섹션 (Section 4 신규)
  sMultiBadge: string;
  sMultiTitle: string;
  sMultiLead: string;
  sMultiStatsTitle: string;
  sMultiStats: { region: string; count: string; label: string; accent: string }[];
  sMultiGroupTitle: string;
  sMultiGroupSub: string;
  sMultiGroups: { badge: string; weight: string; legal: string; elections: string; languages: string; tone: string }[];
  sMultiInsightTitle: string;
  sMultiInsightDesc: string;
  sMultiLangTitle: string;
  sMultiLangDesc: string;
  sMultiLangChips: string[];
  sMultiCTA: string;
  sMultiCTASub: string;
  sMultiSourceNote: string;
}> = {
  // ============ 한국어 (원본) ============
  ko: {
    badge: 'ELECTION 2026 · 6·3 지방선거 출마자',
    dDayPrefix: '⏳ D-',
    dDaySuffix: ' · 캠페인 골든타임',
    heroLine1: '3주의 골든타임,',
    heroLine2: 'AI 검색 시대의 선거 마케팅',
    heroDesc: '유권자는 이제 네이버가 아니라 AI에게 묻습니다. 네이버에 노출되어도 ChatGPT·Gemini·Perplexity 답변에 인용되지 않으면 표는 움직이지 않습니다.',
    urgencyAlert: '3주 선거기간 동안 유권자에게 후보자의 정책과 차별성을 AI 인용·추천하게 하려면, 1주 내에 1,000개 콘텐츠를 대량 노출(융단폭격)시켜야 합니다.',
    urgencyTail: '빠르게 서둘러야 합니다.',
    stats: [
      { label: '단가 절감', value: '80%' },
      { label: '동시 톤 생성', value: '15가지' },
      { label: '색인 도달', value: '24~72h' },
      { label: 'AI 인용 점유', value: '3배' },
    ],

    s1Title: '패러다임 전환 — 유권자 정보 탐색 채널이 바뀌었다',
    s1Lead: '네이버에 노출되어도 AI 답변에 인용되지 않으면 결정 단계 유권자는 후보를 인식하지 못합니다.',
    s1OldEra: '📰 구시대',
    s1OldTitle: '명함·현수막·문자',
    s1OldDesc: '도달률은 낮고 차단·스팸 처리 빈번. 단방향 메시지로 신뢰 형성 어려움.',
    s1MidEra: '🔍 전환기',
    s1MidTitle: '네이버 SEO·검색광고',
    s1MidDesc: '색인까지 2~4주 소요 — 선거가 끝난 뒤에 효과 발생. 광고비 비례 도달.',
    s1NewEra: '🤖 AI 시대',
    s1NewTitle: 'ChatGPT·Gemini·Perplexity 답변에 인용',
    s1NewDesc: '결정 단계 유권자의 73%가 AI 답변에서 인용된 후보를 신뢰. 즉시 전환.',
    s1NewBadge: '정답',

    s2Title: '후보자별 맞춤 제안서 — 양자 대결 구도',
    s2Lead: '동일 선거구의 양 후보 GEO-AIO 제안서를 좌우로 비교해보세요. 각 후보의 지역구·직책에 맞춰 생성된 1페이지 제안서를 클릭해 직접 확인할 수 있습니다.',
    s2GroupMP: '🏛️ 국회의원',
    s2GroupMayor: '🏙️ 시장',
    s2MPCount: '3개 선거구',
    s2MayorCount: '3개 광역시',
    s2RoleMP: '국회의원',
    s2RoleMayor: '시장',
    s2CardSub: '맞춤 GEO-AIO 제안서',
    s2Footer: '※ 각 제안서는 후보자 자료를 기반으로 1페이지 생성된 시안이며, 실제 캠프 도입 시 후보자별 맞춤 데이터로 재구성됩니다.',
    s2ExclusiveBadge: '⚡ 지역구당 단 1명 · 단독 계약 독점권',
    s2ExclusiveTitle: '먼저 계약하는 후보가 선거 승리에 유리한 입장에 섭니다',
    s2ExclusiveDesc: '본 솔루션은 각 지역구·광역시에서 가장 먼저 계약하는 후보 1명에게만 단독 계약 독점권이 주어집니다. 동일 선거구 경쟁 후보는 솔루션을 이용할 수 없으며, 먼저 계약한 후보만 AI 검색·인용 점유에서 독보적 우위를 가집니다.',
    s2VsLabel: 'VS',
    s2TbdName: '후보 영입중',
    s2TbdSub: '지역 선두 계약 가능',

    s3Title: '3주 캠페인 — 일반 SEO는 선거 끝나고 효과',
    s3ColMethod: '방식',
    s3ColIndex: '색인·노출 시작',
    s3ColEffect: '효과 발생',
    s3ColIn3w: '3주 안에 가능?',
    s3RowSeoMethod: '일반 SEO·검색광고',
    s3RowSeoIndex: '2~4주',
    s3RowSeoEffect: '1~2개월',
    s3RowSnsMethod: 'SNS 광고 (페이스북·인스타)',
    s3RowSnsIndex: '즉시',
    s3RowSnsEffect: '광고비 비례',
    s3RowSnsCost: '고비용',
    s3RowGeoMethod: 'GEO-AIO ⭐',
    s3RowGeoIndex: '수일 내',
    s3RowGeoEffect: '24~72시간 AI 인용',
    s3InstantBadge: '⭐ 즉시 효과 발생',
    s3InstantTitle: '게시 즉시 검색 색인 + AI 인용·추천 효과 발생',
    s3InstantDesc: '콘텐츠를 게시하거나 업로드·공개하면 수 일 내에 구글 검색엔진이 색인하여, 이후 ChatGPT · Gemini · Perplexity 등 AI 대화에서 인용·추천되어 선거 기간 내 효과가 발생합니다.',

    s4Title: '선거 당선 가능성을 높이는 부가 서비스 (2가지)',
    s4Lead: '아래 두 사례는 GEO-AIO 홍보 마케팅 콘텐츠 생성 서비스에 더해, 후보자의 선거 당선 가능성을 높이기 위해 함께 제공되는 부가 서비스입니다 — 100개 공약 자동 정리·33일 유세 동선 AI 추천 등 캠페인 의사결정을 끌어올리는 도구. 클릭해 직접 확인하세요.',
    s4LiveBadge: 'LIVE · 실제 운영 중',
    s4Case1Tag: '📌 사례 ① 부산 북구갑 후보 100개 공약 제안서',
    s4Case1Title: '10분야 × 10개 = 100개 공약 · 시기·실행방안·기대효과 자동 구조화',
    s4Case2Tag: '📌 사례 ② AI 기반 33일 유세 동선 전략보고서',
    s4Case2Title: '4단계 일정 · 48 거점 분석 · 5대 필승 전략 자동 매핑',

    s5Title: '지금 채택하면 받는 것',
    s5Group1: '🎯 GEO-AIO 본 서비스 · 콘텐츠 자동화',
    s5Group2: '🚀 부가 서비스 · 후보자 당선 가능성 강화',
    s5Items1: [
      { icon: '🎭', title: '15가지 톤 동시 발행', desc: '전문·친근·감성·스토리·뉴스 등 — SNS 채널별 최적화 콘텐츠 생성' },
      { icon: '🚀', title: 'AI 인용에 최적화된 블로그 페이지에 업로드', desc: 'GSC 색인 모니터링 대시보드 포함 · 24~72h 내 색인 도달' },
      { icon: '📚', title: 'RAG 기반 정확성', desc: '후보자 자료 PDF 1건 업로드 → 실제 데이터·수치만 본문에 인용' },
      { icon: '⚡', title: 'E-E-A-T 자동 구조화', desc: '도입부 → H2 7개 → FAQ → 비교표 → CTA 구조 자동 적용 · AI 인용 가능성 4배' },
    ],
    s5Items2: [
      { icon: '📝', title: '100개 공약 자동 정리', desc: '10분야 × 10개 = 100개 공약 — 시기·실행방안·기대효과 자동 구조화' },
      { icon: '🗺️', title: '33일 유세 동선 AI 추천', desc: '4단계 일정·48 거점·5대 필승 전략 자동 매핑 (BuzzLab 시뮬레이션 기반)' },
    ],
    s5GroupNote: '※ 부가 서비스는 GEO-AIO 콘텐츠 자동화와 패키지로 제공되며, 후보자 당선 가능성을 높이는 캠페인 의사결정 도구입니다.',
    s5RoadmapTitle: '⚡ 48시간 도입 로드맵',
    s5Roadmap: [
      { step: '오늘', title: '무료 시연 신청', desc: '후보자 자료 1건만 업로드' },
      { step: '24시간', title: '첫 콘텐츠 5편 검토', desc: '실제 톤·구조 확인' },
      { step: '48시간', title: '정식 도입 결정', desc: '캠페인 즉시 시작' },
    ],
    s5ContactLabel: '상담·시연 문의',
    s5ContactCompany: 'AX Biz Group · 심재우 대표',

    s6Title: '영상으로 보는 GEO-AIO 선거 마케팅 솔루션',
    s6Desc: 'GEO-AIO 플랫폼이 후보자 선거 캠페인에서 어떻게 동작하는지, 한 영상으로 핵심을 확인하세요.',

    s7Title: 'AI Election Command Center — 전체 운영 가이드',
    s7Sub: '(12장)',
    s7Desc: '선거 캠페인 전 과정에 GEO-AIO를 적용하는 12단계 운영 가이드입니다. 페이지를 순서대로 확인해 캠프 운영의 큰 그림을 먼저 잡아보세요.',
    s7Alt: 'AI Election Command Center 가이드',

    s8Badge: '저자 · 개발자',
    s8Title: '심재우 대표 저서',
    s8Desc: 'GEO-AIO 선거 마케팅 솔루션의 설계자이자 본 플랫폼 개발자인 심재우 대표가 공저로 참여한 AI 선거 전략 가이드북입니다.',
    s8BookTitle: '미래 선거 파워플랜',
    s8BookSubtitle: 'AI 선거 솔루션 완전 가이드',
    s8Authors: '심재우 · 정장덕 · 박대겸 공저',
    s8Publisher: '진한엠앤비',
    s8CTA: 'YES24에서 자세히 보기',
    s8Alt: '미래 선거 파워플랜 — AI 선거 솔루션 완전 가이드 (심재우·정장덕·박대겸 공저)',

    footerSourceTitle: '출처·근거',
    footerSourceText: 'BuzzLab 후보자 시뮬레이션 (n=1,000) · 특허 출원번호 10-2026-0073485 (다중 LLM 에이전트 예측 시스템) · 작성일 2026-05-01',
    footerLegalTitle: '법무 안내',
    footerLegalText: '본 제안은 GEO-AIO 마케팅 솔루션 도입 안내이며, 캠페인 메시지·게시물의 공직선거법 적합성은 캠프 법률 전문가의 별도 검토가 권고됩니다.',

    candidateRegions: {
      '부산-북구갑': '부산 북구갑',
      '경기-평택을': '경기 평택을',
      '인천-연수갑': '인천 연수갑',
      '서울특별시': '서울특별시',
      '광주광역시': '광주광역시',
      '대전광역시': '대전광역시',
    },
    candidateNames: {
      hajeongwoo: '하정우',
      handonghoon: '한동훈',
      chokuk: '조국',
      hwangkyoahn: '황교안',
      songyounggil: '송영길',
      parkjongjin: '박종진',
      ohsehoon: '오세훈',
      jeongwonoh: '정원오',
      minhyungbae: '민형배',
      leejeonghyeon: '이정현',
      leejangwoo: '이장우',
      heotaejung: '허태정',
    },
    candidateSlogans: {
      hajeongwoo: '변화를 이끄는 새로운 정치',
      handonghoon: '원칙과 신뢰의 보수 정치',
      chokuk: '정의로운 사회를 향한 한 걸음',
      hwangkyoahn: '안정된 미래, 검증된 리더십',
      songyounggil: '민생을 위한 진보의 길',
      parkjongjin: '인천 연수갑의 새로운 도약',
      ohsehoon: '혁신하는 서울, 시민과 함께',
      jeongwonoh: '더 나은 서울을 위한 도전',
      minhyungbae: '광주의 새로운 도약',
      leejeonghyeon: '광주의 미래를 여는 비전',
      leejangwoo: '대전, 미래과학 도시로',
      heotaejung: '함께 만드는 충청 메가시티',
    },
    s2BlogBadge: '블로그 자세히 보기',
    pdfBtn: 'PDF 다운로드',
    sMultiBadge: '⚡ 박빙 지역 결정 변수',
    sMultiTitle: '다문화 유권자 — 표차의 결정자',
    sMultiLead: '한국어 캠페인만으로는 닿지 않는 표가 박빙 지역의 당락을 결정합니다. 외국어 콘텐츠 → 다문화 유권자 도달 → 박빙 표차 확보 → 당선.',
    sMultiStatsTitle: '6개 양자 대결 지역의 외국 출신 유권자 (2024-11 행정안전부)',
    sMultiStats: [
      { region: '서울특별시 시장', count: '86,599', label: '외국 출신 유권자 — 한 자치구 인구 규모', accent: 'from-indigo-500 to-violet-600' },
      { region: '인천 연수갑', count: '3,294', label: '박빙 평균 표차의 2배', accent: 'from-rose-500 to-pink-600' },
      { region: '경기 평택을', count: '2,222', label: '박빙 표차 결정 가능 규모', accent: 'from-amber-500 to-orange-600' },
      { region: '광주광역시 시장', count: '8,513', label: '외국 출신 유권자 (지방선거)', accent: 'from-emerald-500 to-teal-600' },
    ],
    sMultiGroupTitle: '3개 그룹 — 각각 다른 언어, 다른 메시지',
    sMultiGroupSub: '동일한 외국 출신 유권자라도 법적 신분에 따라 투표 가능 선거와 도달 언어가 다릅니다.',
    sMultiGroups: [
      { badge: '① F-5 영주 외국인', weight: '★★★', legal: '외국인 신분', elections: '지방선거만', languages: '영어·중국어·일본어', tone: '정책 정보형' },
      { badge: '② 귀화 한국인', weight: '★★★★★', legal: '한국 국적', elections: '모든 선거', languages: '한국어 + 모국어', tone: '정체성·소속감' },
      { badge: '③ 외국인주민자녀 성인', weight: '★★', legal: '한국 국적', elections: '모든 선거', languages: '한국어 중심', tone: '다문화 정책' },
    ],
    sMultiInsightTitle: '박빙 지역에서 외국인 유권자 = 결정 변수',
    sMultiInsightDesc: '인천 연수갑 외국 출신 유권자 3,294명은 최근 박빙 당선 표차(평균 1,500표)의 2배. 외국어 콘텐츠 없이는 이 표는 잡히지 않습니다. 한국어로만 캠페인하는 후보는 시작부터 수천 표를 손해 보고 들어갑니다.',
    sMultiLangTitle: 'GEO-AIO 다국어 캠페인 — 영·중·일 동시 발행',
    sMultiLangDesc: '15가지 톤으로 한국어 콘텐츠 생성 후 영어·중국어·일본어로 자동 번역·발행합니다. 다문화 유권자가 모국어로 정책을 처음 만나는 후보가 첫 인상을 차지합니다.',
    sMultiLangChips: ['🇺🇸 English', '🇨🇳 中文', '🇯🇵 日本語'],
    sMultiCTA: '다국어 캠페인 시작하기',
    sMultiCTASub: '5월 한정 보너스 — 영·중·일 외국어 콘텐츠 자동 발행 포함',
    sMultiSourceNote: '※ 데이터: 행정안전부 외국인주민현황 (2024-11-01 기준) + 시군구별 추정 모델 (F-5 영주 0.13×0.80, 귀화 0.95, 자녀성인 0.10).',
  },

  // ============ 영어 (English) ============
  en: {
    badge: 'ELECTION 2026 · June 3 Local Election Candidates',
    dDayPrefix: '⏳ D-',
    dDaySuffix: ' · Campaign Golden Hour',
    heroLine1: 'The 3-Week Golden Window —',
    heroLine2: 'Election Marketing in the AI Search Era',
    heroDesc: 'Voters now ask AI, not Naver. Even with Naver visibility, if your name is not cited in ChatGPT, Gemini, or Perplexity answers, votes will not move.',
    urgencyAlert: 'During the 3-week campaign, to make AI cite and recommend your policies and differentiation, you must carpet-bomb 1,000 pieces of content within the first week.',
    urgencyTail: 'Time is critical.',
    stats: [
      { label: 'Cost reduction', value: '80%' },
      { label: 'Tones in parallel', value: '15' },
      { label: 'Indexing reach', value: '24–72h' },
      { label: 'AI citation share', value: '3×' },
    ],

    s1Title: 'Paradigm Shift — Voters Have Changed Their Discovery Channel',
    s1Lead: 'Even ranking on Naver, if AI does not cite you, decision-stage voters will not recognize your candidacy.',
    s1OldEra: '📰 Old Era',
    s1OldTitle: 'Business cards · banners · SMS',
    s1OldDesc: 'Low reach, frequent blocking and spam filtering. One-way messaging — hard to build trust.',
    s1MidEra: '🔍 Transition',
    s1MidTitle: 'Naver SEO · search ads',
    s1MidDesc: 'Indexing takes 2–4 weeks — effects arrive after the election. Reach scales with ad spend.',
    s1NewEra: '🤖 AI Era',
    s1NewTitle: 'Cited in ChatGPT · Gemini · Perplexity answers',
    s1NewDesc: '73% of decision-stage voters trust candidates cited in AI answers. Immediate conversion.',
    s1NewBadge: 'Right Answer',

    s2Title: 'Tailored Proposals by Candidate — Head-to-Head Matchups',
    s2Lead: 'Compare both candidates of the same district side by side. Click each card to view the auto-generated 1-page proposal tailored to that candidate\'s district and office.',
    s2GroupMP: '🏛️ National Assembly',
    s2GroupMayor: '🏙️ Mayor',
    s2MPCount: '3 districts',
    s2MayorCount: '3 metro cities',
    s2RoleMP: 'Lawmaker',
    s2RoleMayor: 'Mayor',
    s2CardSub: 'Tailored GEO-AIO proposal',
    s2Footer: '※ Each proposal is a 1-page auto-generated draft based on candidate materials. Real campaign deployment uses customized data per candidate.',
    s2ExclusiveBadge: '⚡ One per district · Exclusive contract right',
    s2ExclusiveTitle: 'The first to sign holds the winning advantage',
    s2ExclusiveDesc: 'Only one candidate per district / metro city can sign this solution — exclusively. Competing candidates in the same district cannot use it. The first signer secures a decisive lead in AI search citation share.',
    s2VsLabel: 'VS',
    s2TbdName: 'Candidate slot open',
    s2TbdSub: 'Lead contract available',

    s3Title: '3-Week Campaign — Standard SEO Only Pays Off After Election Day',
    s3ColMethod: 'Channel',
    s3ColIndex: 'Indexing start',
    s3ColEffect: 'When effect lands',
    s3ColIn3w: 'Possible in 3 weeks?',
    s3RowSeoMethod: 'Standard SEO · search ads',
    s3RowSeoIndex: '2–4 weeks',
    s3RowSeoEffect: '1–2 months',
    s3RowSnsMethod: 'Social ads (Facebook · Instagram)',
    s3RowSnsIndex: 'Immediate',
    s3RowSnsEffect: 'Scales with spend',
    s3RowSnsCost: 'Expensive',
    s3RowGeoMethod: 'GEO-AIO ⭐',
    s3RowGeoIndex: 'Within days',
    s3RowGeoEffect: 'AI citation in 24–72 hours',
    s3InstantBadge: '⭐ Instant Impact',
    s3InstantTitle: 'Index + AI citation effect from the moment you publish',
    s3InstantDesc: 'When you publish or upload content, Google indexes it within days. From then on, ChatGPT, Gemini, Perplexity and other AI conversations cite and recommend your content — generating impact within the campaign window.',

    s4Title: 'Add-On Services That Boost Your Election Odds (2 services)',
    s4Lead: 'These two cases are add-on services bundled with the GEO-AIO content automation suite to raise the candidate\'s probability of winning — auto-organizing 100 pledges, AI-recommended 33-day campaign route, and other decision-support tools. Click to view.',
    s4LiveBadge: 'LIVE · Currently running',
    s4Case1Tag: '📌 Case ① Busan Buk-gu A — 100 Pledges Proposal',
    s4Case1Title: '10 fields × 10 = 100 pledges · timing · execution · expected impact auto-structured',
    s4Case2Tag: '📌 Case ② AI-Powered 33-Day Campaign Route Strategy',
    s4Case2Title: '4-stage schedule · 48 hub analysis · 5 winning strategies auto-mapped',

    s5Title: 'What You Get When You Adopt Now',
    s5Group1: '🎯 GEO-AIO Core · Content Automation',
    s5Group2: '🚀 Add-Ons · Boosting Election Odds',
    s5Items1: [
      { icon: '🎭', title: 'Publish 15 tones in parallel', desc: 'Professional, friendly, emotional, storytelling, news, etc. — auto-optimized per social channel' },
      { icon: '🚀', title: 'Upload to AI-citation-optimized blog pages', desc: 'GSC indexing dashboard included · indexed in 24–72 hours' },
      { icon: '📚', title: 'RAG-based accuracy', desc: 'Upload one candidate PDF → only real data and figures appear in the body' },
      { icon: '⚡', title: 'E-E-A-T auto-structuring', desc: 'Intro → 7 H2s → FAQ → comparison table → CTA · 4× higher AI citation probability' },
    ],
    s5Items2: [
      { icon: '📝', title: 'Auto-organize 100 pledges', desc: '10 fields × 10 = 100 pledges — timing, execution, expected impact auto-structured' },
      { icon: '🗺️', title: 'AI-recommended 33-day route', desc: '4-stage schedule · 48 hubs · 5 winning strategies auto-mapped (BuzzLab simulation)' },
    ],
    s5GroupNote: '※ Add-on services are bundled with the GEO-AIO content automation suite as decision-support tools to boost election outcomes.',
    s5RoadmapTitle: '⚡ 48-Hour Onboarding Roadmap',
    s5Roadmap: [
      { step: 'Today', title: 'Request free demo', desc: 'Upload one candidate document' },
      { step: '24 hours', title: 'Review first 5 articles', desc: 'Verify tone and structure' },
      { step: '48 hours', title: 'Confirm full deployment', desc: 'Campaign starts immediately' },
    ],
    s5ContactLabel: 'Consultation & demo inquiry',
    s5ContactCompany: 'AX Biz Group · Jaiwoo Shim, CEO',

    s6Title: 'See GEO-AIO Election Marketing in One Video',
    s6Desc: 'See in one video how GEO-AIO works inside a candidate\'s campaign.',

    s7Title: 'AI Election Command Center — Full Operations Guide',
    s7Sub: '(12 chapters)',
    s7Desc: 'A 12-step operations guide for applying GEO-AIO across the entire campaign. Walk through the pages in order to grasp the big picture first.',
    s7Alt: 'AI Election Command Center guide',

    s8Badge: 'Author · Developer',
    s8Title: 'Book by CEO Jaiwoo Shim',
    s8Desc: 'A strategy guide on AI-driven election campaigns, co-authored by Jaiwoo Shim — the architect of the GEO-AIO election marketing solution and lead developer of this platform.',
    s8BookTitle: 'Future Election Power Plan',
    s8BookSubtitle: 'The Complete Guide to AI Election Solutions',
    s8Authors: 'Co-authored by Jaiwoo Shim · Jangduk Jeong · Daegyeom Park',
    s8Publisher: '진한엠앤비',
    s8CTA: 'View on YES24',
    s8Alt: 'Future Election Power Plan — The Complete Guide to AI Election Solutions (co-authored by Jaiwoo Shim, Jangduk Jeong, Daegyeom Park)',

    footerSourceTitle: 'Sources · Evidence',
    footerSourceText: 'BuzzLab candidate simulation (n=1,000) · Patent application no. 10-2026-0073485 (multi-LLM agent prediction system) · Published 2026-05-01',
    footerLegalTitle: 'Legal Notice',
    footerLegalText: 'This is a marketing solution proposal for GEO-AIO. Compliance of campaign messages and posts with the Public Official Election Act should be separately reviewed by the campaign\'s legal counsel.',

    candidateRegions: {
      '부산-북구갑': 'Busan Buk-gu A',
      '경기-평택을': 'Gyeonggi Pyeongtaek B',
      '인천-연수갑': 'Incheon Yeonsu A',
      '서울특별시': 'Seoul Metropolitan City',
      '광주광역시': 'Gwangju Metropolitan City',
      '대전광역시': 'Daejeon Metropolitan City',
    },
    candidateNames: {
      hajeongwoo: 'Ha Jung-woo',
      handonghoon: 'Han Dong-hoon',
      chokuk: 'Cho Kuk',
      hwangkyoahn: 'Hwang Kyo-ahn',
      songyounggil: 'Song Young-gil',
      parkjongjin: 'Park Jong-jin',
      ohsehoon: 'Oh Se-hoon',
      jeongwonoh: 'Jeong Won-oh',
      minhyungbae: 'Min Hyung-bae',
      leejeonghyeon: 'Lee Jeong-hyeon',
      leejangwoo: 'Lee Jang-woo',
      heotaejung: 'Heo Tae-jung',
    },
    candidateSlogans: {
      hajeongwoo: 'New Politics Leading Change',
      handonghoon: 'Conservative Politics of Principle and Trust',
      chokuk: 'A Step Toward a Just Society',
      hwangkyoahn: 'Stable Future, Proven Leadership',
      songyounggil: 'A Progressive Path for the People',
      parkjongjin: 'A New Leap for Incheon Yeonsu A',
      ohsehoon: 'Innovating Seoul, with the Citizens',
      jeongwonoh: 'A Challenge for a Better Seoul',
      minhyungbae: 'A New Leap for Gwangju',
      leejeonghyeon: 'A Vision Opening Gwangju\'s Future',
      leejangwoo: 'Daejeon as a City of Future Science',
      heotaejung: 'Building the Chungcheong Megacity Together',
    },
    s2BlogBadge: 'Read full blog',
    pdfBtn: 'Download PDF',
    sMultiBadge: '⚡ The Tiebreaker in Close Races',
    sMultiTitle: 'Multicultural Voters — The Tiebreaker',
    sMultiLead: 'Votes that Korean-only campaigns cannot reach decide the outcome in close districts. Multilingual content → reach multicultural voters → secure the margin → win.',
    sMultiStatsTitle: 'Foreign-origin voters in our 6 head-to-head districts (Nov 2024, MOIS)',
    sMultiStats: [
      { region: 'Seoul Mayor', count: '86,599', label: 'Foreign-origin voters — size of a full ward', accent: 'from-indigo-500 to-violet-600' },
      { region: 'Incheon Yeonsu A', count: '3,294', label: '2× the average swing margin', accent: 'from-rose-500 to-pink-600' },
      { region: 'Gyeonggi Pyeongtaek B', count: '2,222', label: 'Enough to flip a tight race', accent: 'from-amber-500 to-orange-600' },
      { region: 'Gwangju Mayor', count: '8,513', label: 'Foreign-origin voters (local election)', accent: 'from-emerald-500 to-teal-600' },
    ],
    sMultiGroupTitle: 'Three groups — different languages, different messages',
    sMultiGroupSub: 'Even within foreign-origin voters, eligibility and reach languages differ by legal status.',
    sMultiGroups: [
      { badge: '① F-5 Permanent Residents', weight: '★★★', legal: 'Foreign nationals', elections: 'Local only', languages: 'EN · ZH · JA', tone: 'Policy information' },
      { badge: '② Naturalized Koreans', weight: '★★★★★', legal: 'Korean citizens', elections: 'All elections', languages: 'KO + native', tone: 'Identity & belonging' },
      { badge: '③ Adult children of foreign residents', weight: '★★', legal: 'Korean citizens', elections: 'All elections', languages: 'Korean-centered', tone: 'Multicultural policy' },
    ],
    sMultiInsightTitle: 'In close districts, foreign-origin voters are the deciding variable',
    sMultiInsightDesc: 'Incheon Yeonsu A has 3,294 foreign-origin voters — twice the recent average swing margin (~1,500 votes). Without multilingual content, this segment is unreachable. A Korean-only campaign starts thousands of votes behind.',
    sMultiLangTitle: 'GEO-AIO Multilingual — Publish EN · ZH · JA simultaneously',
    sMultiLangDesc: 'Generate 15 tones in Korean, then auto-translate and publish in English, Chinese, and Japanese. The first candidate to meet multicultural voters in their own language wins the first impression.',
    sMultiLangChips: ['🇺🇸 English', '🇨🇳 中文', '🇯🇵 日本語'],
    sMultiCTA: 'Start the multilingual campaign',
    sMultiCTASub: 'May bonus — EN/ZH/JA auto-publishing included',
    sMultiSourceNote: '※ Source: MOIS Foreign Residents Statistics (Nov 1, 2024) + district estimation model (F-5 0.13×0.80, naturalized 0.95, adult children 0.10).',
  },

  // ============ 중국어 (번체, 대만식 s2twp) ============
  zh: {
    badge: 'ELECTION 2026 · 6·3 地方選舉候選人',
    dDayPrefix: '⏳ D-',
    dDaySuffix: ' · 競選黃金時段',
    heroLine1: '3周黃金期，',
    heroLine2: 'AI搜尋時代的選舉營銷',
    heroDesc: '選民現在不再問Naver，而是問AI。即使在Naver上有曝光，如果ChatGPT·Gemini·Perplexity的回答中沒有引用您的名字，選票就不會動。',
    urgencyAlert: '在3周競選期內，要讓AI引用並推薦候選人的政策與差異化，必須在第一週內大規模曝光1,000篇內容(地毯式投放)。',
    urgencyTail: '必須迅速行動。',
    stats: [
      { label: '成本下降', value: '80%' },
      { label: '同時生成語調', value: '15種' },
      { label: '索引到達', value: '24~72h' },
      { label: 'AI引用佔有率', value: '3倍' },
    ],

    s1Title: '正規化轉變 — 選民資訊探索渠道已經改變',
    s1Lead: '即使在Naver上有曝光，如果AI的回答中沒有引用您，決策階段的選民就無法認知該候選人。',
    s1OldEra: '📰 舊時代',
    s1OldTitle: '名片·橫幅·簡訊',
    s1OldDesc: '觸達率低，頻繁被遮蔽和垃圾過濾。單向資訊，難以建立信任。',
    s1MidEra: '🔍 過渡期',
    s1MidTitle: 'Naver SEO·搜尋廣告',
    s1MidDesc: '索引需要2~4周 — 選舉結束後才會出效果。曝光與廣告費成正比。',
    s1NewEra: '🤖 AI時代',
    s1NewTitle: '在ChatGPT·Gemini·Perplexity的回答中被引用',
    s1NewDesc: '73%的決策階段選民信任在AI回答中被引用的候選人。即時轉化。',
    s1NewBadge: '正確答案',

    s2Title: '候選人定製方案 — 兩雄對決',
    s2Lead: '同一選區的兩位候選人GEO-AIO方案左右並排比較。點選任一卡片可檢視為該候選人的選區與職位自動生成的1頁方案。',
    s2GroupMP: '🏛️ 國會議員',
    s2GroupMayor: '🏙️ 市長',
    s2MPCount: '3個選區',
    s2MayorCount: '3個直轄市',
    s2RoleMP: '國會議員',
    s2RoleMayor: '市長',
    s2CardSub: '定製GEO-AIO方案',
    s2Footer: '※ 各方案是基於候選人資料自動生成的1頁草案。實際競選部署時將根據每位候選人的定製資料重新構建。',
    s2ExclusiveBadge: '⚡ 每個選區僅1位 · 獨家簽約權',
    s2ExclusiveTitle: '率先簽約的候選人在選舉中將佔據有利地位',
    s2ExclusiveDesc: '本方案在每個選區/直轄市僅授予最先簽約的1位候選人獨家簽約權。同選區的競爭對手無法使用該方案，率先簽約者將在AI搜尋·引用佔有率上獲得決定性領先。',
    s2VsLabel: 'VS',
    s2TbdName: '候選人席位空缺',
    s2TbdSub: '可率先簽約',

    s3Title: '3周競選 — 普通SEO要等到選舉結束後才出效果',
    s3ColMethod: '方式',
    s3ColIndex: '索引·曝光開始',
    s3ColEffect: '效果產生',
    s3ColIn3w: '3周內可行?',
    s3RowSeoMethod: '普通SEO·搜尋廣告',
    s3RowSeoIndex: '2~4周',
    s3RowSeoEffect: '1~2個月',
    s3RowSnsMethod: '社交廣告 (Facebook·Instagram)',
    s3RowSnsIndex: '即時',
    s3RowSnsEffect: '與廣告費成正比',
    s3RowSnsCost: '高成本',
    s3RowGeoMethod: 'GEO-AIO ⭐',
    s3RowGeoIndex: '數日內',
    s3RowGeoEffect: '24~72小時AI引用',
    s3InstantBadge: '⭐ 即時見效',
    s3InstantTitle: '釋出即刻產生搜尋索引 + AI引用·推薦效果',
    s3InstantDesc: '釋出或上傳公開內容後，谷歌搜尋引擎會在數日內進行索引，之後在ChatGPT · Gemini · Perplexity等AI對話中被引用·推薦，在選舉期內即可見效。',

    s4Title: '提升候選人當選機率的附加服務 (2項)',
    s4Lead: '以下兩個案例是與GEO-AIO宣傳營銷內容生成服務一同提供的附加服務，旨在提升候選人的當選機率 — 100項政策承諾自動整理、33天競選路線AI推薦等提升競選決策的工具。點選檢視詳情。',
    s4LiveBadge: 'LIVE · 實際執行中',
    s4Case1Tag: '📌 案例 ① 釜山北區甲候選人 100項政策承諾方案',
    s4Case1Title: '10個領域 × 10項 = 100項政策 · 時間·執行方案·預期效果自動結構化',
    s4Case2Tag: '📌 案例 ② 基於AI的33天競選路線戰略報告',
    s4Case2Title: '4階段日程 · 48個據點分析 · 5大必勝戰略自動對映',

    s5Title: '現在採用即可獲得',
    s5Group1: '🎯 GEO-AIO核心服務 · 內容自動化',
    s5Group2: '🚀 附加服務 · 提升候選人當選機率',
    s5Items1: [
      { icon: '🎭', title: '同時釋出15種語調', desc: '專業·親和·感性·敘事·新聞等 — 按社交渠道自動最佳化生成' },
      { icon: '🚀', title: '上傳至AI引用最佳化的部落格頁面', desc: '含GSC索引監控儀表板 · 24~72h內完成索引' },
      { icon: '📚', title: '基於RAG的準確性', desc: '上傳1份候選人PDF資料 → 僅在正文中引用真實資料和數值' },
      { icon: '⚡', title: 'E-E-A-T自動結構化', desc: '匯入 → H2 7個 → FAQ → 對比表 → CTA結構自動應用 · AI引用機率提高4倍' },
    ],
    s5Items2: [
      { icon: '📝', title: '100項政策自動整理', desc: '10領域 × 10項 = 100項政策 — 時間·執行方案·預期效果自動結構化' },
      { icon: '🗺️', title: '33天競選路線AI推薦', desc: '4階段日程·48據點·5大必勝戰略自動對映 (基於BuzzLab模擬)' },
    ],
    s5GroupNote: '※ 附加服務與GEO-AIO內容自動化打包提供，是提升候選人當選機率的競選決策工具。',
    s5RoadmapTitle: '⚡ 48小時部署路線',
    s5Roadmap: [
      { step: '今天', title: '申請免費演示', desc: '只需上傳1份候選人資料' },
      { step: '24小時', title: '稽核首5篇內容', desc: '確認實際語調與結構' },
      { step: '48小時', title: '正式部署決定', desc: '競選立即啟動' },
    ],
    s5ContactLabel: '諮詢·演示申請',
    s5ContactCompany: 'AX Biz Group · 沈在宇 代表',

    s6Title: '一支影片看懂GEO-AIO選舉營銷解決方案',
    s6Desc: '透過一支影片瞭解GEO-AIO平臺如何在候選人競選中運作。',

    s7Title: 'AI選舉指揮中心 — 完整運營指南',
    s7Sub: '(12章)',
    s7Desc: '將GEO-AIO應用於整個選舉競選流程的12步運營指南。請按順序瀏覽頁面，先把握競選運營的整體框架。',
    s7Alt: 'AI選舉指揮中心指南',

    s8Badge: '作者 · 開發者',
    s8Title: '沈在祐代表著作',
    s8Desc: 'GEO-AIO選舉行銷解決方案的設計者、本平台開發者沈在祐代表共同撰寫的AI選舉策略指南。',
    s8BookTitle: '未來選舉力量計劃',
    s8BookSubtitle: 'AI選舉解決方案完整指南',
    s8Authors: '沈在祐 · 鄭章德 · 朴大兼 共同著作',
    s8Publisher: '진한엠앤비',
    s8CTA: '在YES24查看詳情',
    s8Alt: '未來選舉力量計劃 — AI選舉解決方案完整指南（沈在祐·鄭章德·朴大兼共著）',

    footerSourceTitle: '出處·依據',
    footerSourceText: 'BuzzLab候選人模擬 (n=1,000) · 專利申請號 10-2026-0073485 (多LLM智慧體預測系統) · 撰寫日期 2026-05-01',
    footerLegalTitle: '法務說明',
    footerLegalText: '本提案是GEO-AIO營銷解決方案的部署介紹，競選資訊·發文是否符合公職選舉法，建議由競選陣營的法律顧問另行審查。',

    candidateRegions: {
      '부산-북구갑': '釜山北區甲',
      '경기-평택을': '京畿平澤乙',
      '인천-연수갑': '仁川延壽甲',
      '서울특별시': '首爾特別市',
      '광주광역시': '光州廣域市',
      '대전광역시': '大田廣域市',
    },
    candidateNames: {
      hajeongwoo: '河正佑',
      handonghoon: '韓東勳',
      chokuk: '曺國',
      hwangkyoahn: '黃教安',
      songyounggil: '宋永吉',
      parkjongjin: '朴鐘振',
      ohsehoon: '吳世勳',
      jeongwonoh: '鄭元五',
      minhyungbae: '閔炯培',
      leejeonghyeon: '李正炫',
      leejangwoo: '李莊雨',
      heotaejung: '許泰正',
    },
    candidateSlogans: {
      hajeongwoo: '引領變革的新政治',
      handonghoon: '原則與信任的保守政治',
      chokuk: '邁向正義社會的一步',
      hwangkyoahn: '穩定的未來，經驗證的領導力',
      songyounggil: '為民生而進步',
      parkjongjin: '仁川延壽甲的新飛躍',
      ohsehoon: '革新的首爾，與市民同行',
      jeongwonoh: '為更好的首爾而挑戰',
      minhyungbae: '光州的全新飛躍',
      leejeonghyeon: '開啟光州未來的願景',
      leejangwoo: '大田，邁向未來科學城市',
      heotaejung: '共同打造忠清大都會',
    },
    s2BlogBadge: '檢視完整部落格',
    pdfBtn: 'PDF下載',
    sMultiBadge: '⚡ 決定勝負的關鍵變數',
    sMultiTitle: '多元文化選民 — 票差的決定者',
    sMultiLead: '僅以韓語競選無法觸及的選票，正是決定膠著選區勝負的關鍵。多語言內容 → 觸及多元文化選民 → 確保票差優勢 → 當選。',
    sMultiStatsTitle: '6個兩雄對決選區的外國裔選民 (2024年11月 行政安全部)',
    sMultiStats: [
      { region: '首爾市長', count: '86,599', label: '外國裔選民 — 一個區的人口規模', accent: 'from-indigo-500 to-violet-600' },
      { region: '仁川延壽甲', count: '3,294', label: '膠著平均票差的2倍', accent: 'from-rose-500 to-pink-600' },
      { region: '京畿平澤乙', count: '2,222', label: '足以扭轉膠著選戰的規模', accent: 'from-amber-500 to-orange-600' },
      { region: '光州市長', count: '8,513', label: '外國裔選民 (地方選舉)', accent: 'from-emerald-500 to-teal-600' },
    ],
    sMultiGroupTitle: '3類群體 — 不同語言，不同訊息',
    sMultiGroupSub: '即使同為外國裔選民，依法律身分不同，可投票選舉與觸及語言也不同。',
    sMultiGroups: [
      { badge: '① F-5永住外國人', weight: '★★★', legal: '外國身分', elections: '僅地方選舉', languages: '英·中·日', tone: '政策資訊型' },
      { badge: '② 入籍韓國人', weight: '★★★★★', legal: '韓國國籍', elections: '所有選舉', languages: '韓語+母語', tone: '身分認同感' },
      { badge: '③ 多元文化家庭成年子女', weight: '★★', legal: '韓國國籍', elections: '所有選舉', languages: '以韓語為主', tone: '多元文化政策' },
    ],
    sMultiInsightTitle: '在膠著選區，外國裔選民就是決定變數',
    sMultiInsightDesc: '仁川延壽甲外國裔選民3,294名，是近期膠著當選平均票差(約1,500票)的2倍。沒有多語言內容就無法觸及這些選票。僅以韓語競選的候選人，從一開始就要承擔數千票的劣勢。',
    sMultiLangTitle: 'GEO-AIO 多語言競選 — 同步發布英·中·日',
    sMultiLangDesc: '以15種風格生成韓語內容後，自動翻譯並發布為英文、中文、日文。最先以母語向多元文化選民傳達政策的候選人，將佔據第一印象。',
    sMultiLangChips: ['🇺🇸 English', '🇨🇳 中文', '🇯🇵 日本語'],
    sMultiCTA: '開始多語言競選',
    sMultiCTASub: '5月限定獎勵 — 包含英·中·日外語內容自動發布',
    sMultiSourceNote: '※ 資料：行政安全部外國人居民現況 (2024-11-01基準) + 行政區估算模型 (F-5 0.13×0.80、入籍0.95、成年子女0.10)。',
  },

  // ============ 일본어 ============
  ja: {
    badge: 'ELECTION 2026 · 6·3 地方選挙立候補者',
    dDayPrefix: '⏳ D-',
    dDaySuffix: ' · 選挙ゴールデンタイム',
    heroLine1: '3週間のゴールデン期、',
    heroLine2: 'AI検索時代の選挙マーケティング',
    heroDesc: '有権者は今やNaverではなくAIに尋ねます。Naverに表示されてもChatGPT·Gemini·Perplexityの回答に引用されなければ票は動きません。',
    urgencyAlert: '3週間の選挙期間中に、有権者へ候補者の政策と差別化をAIで引用·推薦させるには、1週間以内に1,000本のコンテンツを大量露出(絨毯爆撃)させる必要があります。',
    urgencyTail: '急いで対応する必要があります。',
    stats: [
      { label: 'コスト削減', value: '80%' },
      { label: '同時トーン生成', value: '15種類' },
      { label: 'インデックス到達', value: '24~72h' },
      { label: 'AI引用シェア', value: '3倍' },
    ],

    s1Title: 'パラダイムシフト — 有権者の情報探索チャネルが変わった',
    s1Lead: 'Naverに表示されてもAI回答で引用されなければ、決定段階の有権者は候補者を認知しません。',
    s1OldEra: '📰 旧時代',
    s1OldTitle: '名刺·横断幕·SMS',
    s1OldDesc: 'リーチは低くブロック·迷惑処理が頻繁。一方向メッセージで信頼を築きにくい。',
    s1MidEra: '🔍 過渡期',
    s1MidTitle: 'Naver SEO·検索広告',
    s1MidDesc: 'インデックスまで2~4週間 — 選挙終了後に効果が出る。広告費に比例して到達。',
    s1NewEra: '🤖 AI時代',
    s1NewTitle: 'ChatGPT·Gemini·Perplexityの回答で引用される',
    s1NewDesc: '決定段階の有権者の73%がAI回答で引用された候補者を信頼。即時転換。',
    s1NewBadge: '正解',

    s2Title: '候補者別カスタム提案書 — 一騎打ち構図',
    s2Lead: '同一選挙区の両候補者のGEO-AIO提案書を左右で比較できます。各カードをクリックして、候補者の選挙区·職務に合わせて自動生成された1ページ提案書をご確認ください。',
    s2GroupMP: '🏛️ 国会議員',
    s2GroupMayor: '🏙️ 市長',
    s2MPCount: '3選挙区',
    s2MayorCount: '3直轄市',
    s2RoleMP: '国会議員',
    s2RoleMayor: '市長',
    s2CardSub: 'カスタムGEO-AIO提案書',
    s2Footer: '※ 各提案書は候補者資料に基づき1ページで自動生成された試案であり、実際の陣営導入時には候補者ごとのカスタムデータで再構成されます。',
    s2ExclusiveBadge: '⚡ 選挙区につき1名のみ · 独占契約権',
    s2ExclusiveTitle: '先に契約した候補者が選挙勝利の優位な立場に立ちます',
    s2ExclusiveDesc: '本ソリューションは各選挙区·直轄市で最初に契約する1名の候補者にのみ独占契約権が付与されます。同じ選挙区の競合候補者は本ソリューションを利用できず、先に契約した候補者がAI検索·引用シェアで決定的な優位を獲得します。',
    s2VsLabel: 'VS',
    s2TbdName: '候補者枠 募集中',
    s2TbdSub: '地域先行契約 可能',

    s3Title: '3週間キャンペーン — 通常のSEOは選挙が終わってから効果',
    s3ColMethod: '方式',
    s3ColIndex: 'インデックス·露出開始',
    s3ColEffect: '効果発生',
    s3ColIn3w: '3週間以内に可能?',
    s3RowSeoMethod: '通常SEO·検索広告',
    s3RowSeoIndex: '2~4週間',
    s3RowSeoEffect: '1~2か月',
    s3RowSnsMethod: 'SNS広告 (Facebook·Instagram)',
    s3RowSnsIndex: '即時',
    s3RowSnsEffect: '広告費に比例',
    s3RowSnsCost: '高コスト',
    s3RowGeoMethod: 'GEO-AIO ⭐',
    s3RowGeoIndex: '数日以内',
    s3RowGeoEffect: '24~72時間でAI引用',
    s3InstantBadge: '⭐ 即時効果発生',
    s3InstantTitle: '掲載と同時に検索インデックス+AI引用·推薦効果が発生',
    s3InstantDesc: 'コンテンツを掲載·アップロード·公開すると、数日以内にGoogle検索エンジンがインデックスし、その後ChatGPT · Gemini · PerplexityなどのAI対話で引用·推薦され、選挙期間内に効果が発生します。',

    s4Title: '当選確率を高める追加サービス (2種類)',
    s4Lead: '以下の2事例は、GEO-AIOの広報マーケティングコンテンツ生成サービスに加え、候補者の当選確率を高めるために共に提供される追加サービスです — 100公約自動整理·33日遊説動線AI推薦など、選挙意思決定を底上げするツール。クリックして直接ご確認ください。',
    s4LiveBadge: 'LIVE · 実際運用中',
    s4Case1Tag: '📌 事例 ① 釜山北区甲候補 100公約提案書',
    s4Case1Title: '10分野 × 10 = 100公約 · 時期·実行方案·期待効果を自動構造化',
    s4Case2Tag: '📌 事例 ② AIベース33日遊説動線戦略レポート',
    s4Case2Title: '4段階スケジュール · 48拠点分析 · 5大必勝戦略を自動マッピング',

    s5Title: '今採用すれば得られるもの',
    s5Group1: '🎯 GEO-AIO本サービス · コンテンツ自動化',
    s5Group2: '🚀 追加サービス · 当選確率の強化',
    s5Items1: [
      { icon: '🎭', title: '15トーン同時発行', desc: '専門·親しみ·感性·ストーリー·ニュース等 — SNSチャネル別に最適化されたコンテンツを自動生成' },
      { icon: '🚀', title: 'AI引用に最適化されたブログページにアップロード', desc: 'GSCインデックス監視ダッシュボード付属 · 24~72h以内にインデックス到達' },
      { icon: '📚', title: 'RAGベースの正確性', desc: '候補者資料PDF1件をアップロード → 実データ·数値のみを本文に引用' },
      { icon: '⚡', title: 'E-E-A-T自動構造化', desc: '導入 → H2 7個 → FAQ → 比較表 → CTA構造を自動適用 · AI引用確率4倍' },
    ],
    s5Items2: [
      { icon: '📝', title: '100公約自動整理', desc: '10分野 × 10 = 100公約 — 時期·実行方案·期待効果を自動構造化' },
      { icon: '🗺️', title: '33日遊説動線AI推薦', desc: '4段階スケジュール·48拠点·5大必勝戦略を自動マッピング (BuzzLabシミュレーションベース)' },
    ],
    s5GroupNote: '※ 追加サービスはGEO-AIOコンテンツ自動化とパッケージで提供され、候補者の当選確率を高める選挙意思決定ツールです。',
    s5RoadmapTitle: '⚡ 48時間導入ロードマップ',
    s5Roadmap: [
      { step: '本日', title: '無料デモ申請', desc: '候補者資料1件のみアップロード' },
      { step: '24時間', title: '初回コンテンツ5本レビュー', desc: '実際のトーン·構造を確認' },
      { step: '48時間', title: '正式導入決定', desc: 'キャンペーン即時開始' },
    ],
    s5ContactLabel: '相談·デモ問い合わせ',
    s5ContactCompany: 'AX Biz Group · シム·ジェウ代表',

    s6Title: '動画で見るGEO-AIO選挙マーケティングソリューション',
    s6Desc: 'GEO-AIOプラットフォームが候補者選挙キャンペーンでどのように動作するか、1本の動画で核心をご確認ください。',

    s7Title: 'AI Election Command Center — 全体運営ガイド',
    s7Sub: '(12章)',
    s7Desc: '選挙キャンペーン全工程にGEO-AIOを適用する12ステップ運営ガイドです。ページを順番に確認して陣営運営の全体像を先につかんでください。',
    s7Alt: 'AI Election Command Centerガイド',

    s8Badge: '著者 · 開発者',
    s8Title: 'シム・ジェウ代表 著書',
    s8Desc: 'GEO-AIO選挙マーケティングソリューションの設計者であり、本プラットフォームの開発者であるシム・ジェウ代表が共著として参加したAI選挙戦略ガイドブックです。',
    s8BookTitle: '未来選挙パワープラン',
    s8BookSubtitle: 'AI選挙ソリューション完全ガイド',
    s8Authors: 'シム・ジェウ · チョン・ジャンドク · パク・デギョム 共著',
    s8Publisher: '진한엠앤비',
    s8CTA: 'YES24で詳細を見る',
    s8Alt: '未来選挙パワープラン — AI選挙ソリューション完全ガイド（シム・ジェウ・チョン・ジャンドク・パク・デギョム共著）',

    footerSourceTitle: '出典·根拠',
    footerSourceText: 'BuzzLab候補者シミュレーション (n=1,000) · 特許出願番号 10-2026-0073485 (多重LLMエージェント予測システム) · 作成日 2026-05-01',
    footerLegalTitle: '法務案内',
    footerLegalText: '本提案はGEO-AIOマーケティングソリューションの導入案内であり、キャンペーンメッセージ·投稿の公職選挙法適合性については、陣営の法律専門家による別途レビューが推奨されます。',

    candidateRegions: {
      '부산-북구갑': '釜山北区甲',
      '경기-평택을': '京畿平沢乙',
      '인천-연수갑': '仁川延寿甲',
      '서울특별시': 'ソウル特別市',
      '광주광역시': '光州広域市',
      '대전광역시': '大田広域市',
    },
    candidateNames: {
      hajeongwoo: 'ハ·ジョンウ',
      handonghoon: 'ハン·ドンフン',
      chokuk: 'チョ·グク',
      hwangkyoahn: 'ファン·ギョアン',
      songyounggil: 'ソン·ヨンギル',
      parkjongjin: 'パク·ジョンジン',
      ohsehoon: 'オ·セフン',
      jeongwonoh: 'チョン·ウォンオ',
      minhyungbae: 'ミン·ヒョンベ',
      leejeonghyeon: 'イ·ジョンヒョン',
      leejangwoo: 'イ·ジャンウ',
      heotaejung: 'ホ·テジョン',
    },
    candidateSlogans: {
      hajeongwoo: '変革を導く新しい政治',
      handonghoon: '原則と信頼の保守政治',
      chokuk: '正義ある社会への一歩',
      hwangkyoahn: '安定した未来、実証されたリーダーシップ',
      songyounggil: '民生のための進歩の道',
      parkjongjin: '仁川延寿甲の新たな飛躍',
      ohsehoon: '革新するソウル、市民と共に',
      jeongwonoh: 'より良いソウルへの挑戦',
      minhyungbae: '光州の新たな飛躍',
      leejeonghyeon: '光州の未来を開くビジョン',
      leejangwoo: '大田、未来科学都市へ',
      heotaejung: '共に築く忠清メガシティ',
    },
    s2BlogBadge: 'ブログを詳しく見る',
    pdfBtn: 'PDFダウンロード',
    sMultiBadge: '⚡ 接戦区を左右する決定変数',
    sMultiTitle: '多文化有権者 — 票差を決める存在',
    sMultiLead: '韓国語キャンペーンだけでは届かない票が、接戦区の勝敗を決定します。多言語コンテンツ → 多文化有権者へのリーチ → 票差確保 → 当選。',
    sMultiStatsTitle: '6つの一騎打ち選挙区の外国出身有権者 (2024年11月 行政安全部)',
    sMultiStats: [
      { region: 'ソウル市長', count: '86,599', label: '外国出身有権者 — 一つの区の人口規模', accent: 'from-indigo-500 to-violet-600' },
      { region: '仁川延寿甲', count: '3,294', label: '接戦平均票差の2倍', accent: 'from-rose-500 to-pink-600' },
      { region: '京畿平沢乙', count: '2,222', label: '接戦を覆せる規模', accent: 'from-amber-500 to-orange-600' },
      { region: '光州市長', count: '8,513', label: '外国出身有権者 (地方選挙)', accent: 'from-emerald-500 to-teal-600' },
    ],
    sMultiGroupTitle: '3つのグループ — それぞれ異なる言語·異なるメッセージ',
    sMultiGroupSub: '同じ外国出身有権者でも、法的身分により投票可能な選挙とリーチ言語が異なります。',
    sMultiGroups: [
      { badge: '① F-5永住外国人', weight: '★★★', legal: '外国人身分', elections: '地方選挙のみ', languages: '英·中·日', tone: '政策情報型' },
      { badge: '② 帰化韓国人', weight: '★★★★★', legal: '韓国国籍', elections: '全選挙', languages: '韓国語+母語', tone: 'アイデンティティ' },
      { badge: '③ 外国人住民の子女(成人)', weight: '★★', legal: '韓国国籍', elections: '全選挙', languages: '韓国語中心', tone: '多文化政策' },
    ],
    sMultiInsightTitle: '接戦区において外国出身有権者は決定変数',
    sMultiInsightDesc: '仁川延寿甲の外国出身有権者3,294名は、最近の接戦当選票差(平均1,500票)の2倍。多言語コンテンツなしではこの票は届きません。韓国語のみのキャンペーンは、出発点から数千票の劣勢を抱えます。',
    sMultiLangTitle: 'GEO-AIO 多言語キャンペーン — 英·中·日 同時発行',
    sMultiLangDesc: '15種類のトーンで韓国語コンテンツを生成後、英語·中国語·日本語に自動翻訳·発行します。多文化有権者に母語で初めて政策を届ける候補者が第一印象を獲得します。',
    sMultiLangChips: ['🇺🇸 English', '🇨🇳 中文', '🇯🇵 日本語'],
    sMultiCTA: '多言語キャンペーンを開始',
    sMultiCTASub: '5月限定ボーナス — 英·中·日の外国語コンテンツ自動発行を含む',
    sMultiSourceNote: '※ データ: 行政安全部 外国人住民現況 (2024-11-01基準) + 行政区推定モデル (F-5 0.13×0.80、帰化0.95、子女成人0.10)。',
  },
};

// 양자 대결 페어 — left vs right (각 선거구당 1쌍)
// tbd: true면 "후보 영입중" placeholder 카드로 표시 (단독 계약 가능 안내)
type Side = { key?: string; slug?: string; strip: string; accent: string; tbd?: boolean };
type Pair = { group: 'mp' | 'mayor'; regionKey: string; left: Side; right: Side };

// 후보자별 GEO-AIO에서 발행된 언어 — 카드 하단에 국기로 표시
// ko=태극기, en=성조기, zh=중국기, ja=일본기
// 정원오·허태정만 4개 언어 모두 발행 완료, 나머지는 한국어만.
const CANDIDATE_LANGS: Record<string, ('ko' | 'en' | 'zh' | 'ja')[]> = {
  hajeongwoo: ['ko'],
  handonghoon: ['ko'],
  chokuk: ['ko'],
  hwangkyoahn: ['ko'],
  songyounggil: ['ko'],
  parkjongjin: ['ko'],
  ohsehoon: ['ko'],
  jeongwonoh: ['ko', 'en', 'zh', 'ja'],
  minhyungbae: ['ko'],
  leejeonghyeon: ['ko'],
  leejangwoo: ['ko'],
  heotaejung: ['ko', 'en', 'zh', 'ja'],
};
const LANG_FLAG: Record<'ko' | 'en' | 'zh' | 'ja', string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  zh: '🇨🇳',
  ja: '🇯🇵',
};
const PAIRS: Pair[] = [
  { group: 'mp', regionKey: '부산-북구갑',
    left:  { key: 'hajeongwoo',  slug: '하정우-국회의원선거-후보자', strip: 'from-indigo-500 via-violet-500 to-violet-600', accent: 'text-indigo-700' },
    right: { key: 'handonghoon', slug: '한동훈-부산북구갑-국회의원-후보자', strip: 'from-orange-500 via-amber-500 to-red-500', accent: 'text-orange-700' } },
  { group: 'mp', regionKey: '경기-평택을',
    left:  { key: 'chokuk',      slug: '조국-평택을-국회의원-후보자', strip: 'from-violet-500 via-purple-500 to-fuchsia-500', accent: 'text-violet-700' },
    right: { key: 'hwangkyoahn', slug: '황교안-평택을-국회의원-후보자', strip: 'from-rose-500 via-pink-500 to-rose-600', accent: 'text-rose-700' } },
  { group: 'mp', regionKey: '인천-연수갑',
    left:  { key: 'songyounggil', slug: '송영길-연수갑-국회의원-후보자', strip: 'from-lime-500 via-green-500 to-emerald-500', accent: 'text-lime-700' },
    right: { key: 'parkjongjin', slug: '박종진-인천연수갑-후보자', strip: 'from-sky-500 via-blue-500 to-cyan-600', accent: 'text-sky-700' } },
  { group: 'mayor', regionKey: '서울특별시',
    left:  { key: 'ohsehoon',     slug: '오세훈-서울시장-후보자', strip: 'from-cyan-500 via-sky-500 to-blue-500', accent: 'text-cyan-700' },
    right: { key: 'jeongwonoh',  slug: '정원오-서울시장-후보자', strip: 'from-blue-500 via-indigo-500 to-blue-600', accent: 'text-blue-700' } },
  { group: 'mayor', regionKey: '광주광역시',
    left:  { key: 'minhyungbae',  slug: '민형배-광주시장-후보자', strip: 'from-emerald-500 via-teal-500 to-green-500', accent: 'text-emerald-700' },
    right: { key: 'leejeonghyeon', slug: '이정현-광주시장-후보자', strip: 'from-rose-500 via-pink-500 to-fuchsia-500', accent: 'text-rose-700' } },
  { group: 'mayor', regionKey: '대전광역시',
    left:  { key: 'leejangwoo',   slug: '이장우-대전시장-후보자', strip: 'from-amber-500 via-orange-500 to-amber-600', accent: 'text-amber-700' },
    right: { key: 'heotaejung',   slug: '허태정-대전시장-후보자', strip: 'from-fuchsia-500 via-pink-500 to-rose-500', accent: 'text-fuchsia-700' } },
];

// 양자 대결의 한쪽 후보 카드 — 복싱 링 모티프 (BLUE/RED 코너), 가로형 직사각형
type CandidateCardProps = {
  side: Side;
  role: string;
  regionKey: string;
  t: (typeof T)[Lang];
  candidateHref: (slug: string) => string;
  cornerLabel?: 'BLUE' | 'RED';
};
function CandidateCard({ side, role, regionKey, t, candidateHref, cornerLabel }: CandidateCardProps) {
  const corner = cornerLabel === 'BLUE'
    ? { label: 'BLUE CORNER', labelColor: 'text-blue-700', glow: 'shadow-[0_8px_28px_-8px_rgba(37,99,235,0.35)]' }
    : cornerLabel === 'RED'
    ? { label: 'RED CORNER', labelColor: 'text-rose-700', glow: 'shadow-[0_8px_28px_-8px_rgba(244,63,94,0.35)]' }
    : { label: '', labelColor: 'text-slate-500', glow: 'shadow-md' };

  if (side.tbd) {
    return (
      <div className={`relative bg-gradient-to-br from-slate-50 via-white to-slate-100 border-2 border-dashed border-slate-300 rounded-xl py-3 px-3 sm:px-4 min-h-[140px] sm:min-h-[152px] flex flex-col justify-between ${corner.glow}`}>
        {cornerLabel && (
          <div className={`text-[9px] sm:text-[10px] font-black tracking-[0.2em] ${corner.labelColor}`}>
            {corner.label}
          </div>
        )}
        <div className="flex flex-col items-center justify-center flex-1 my-1">
          <div className="text-2xl sm:text-3xl opacity-50 mb-1">🤝</div>
          <div className="text-sm sm:text-base font-extrabold text-slate-700 leading-tight">{t.s2TbdName}</div>
          <div className={`text-[10px] sm:text-xs font-bold ${side.accent} mt-0.5`}>{t.candidateRegions[regionKey]}</div>
        </div>
        <div className="text-center">
          <span className="inline-block text-[9px] sm:text-[10px] text-amber-800 font-bold rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5">
            ⚡ {t.s2TbdSub}
          </span>
        </div>
      </div>
    );
  }

  const slug = side.slug || '';
  const nameKey = side.key || '';
  const slogan = t.candidateSlogans[nameKey] || '';
  const langs = CANDIDATE_LANGS[nameKey] || ['ko'];
  return (
    <Link
      href={candidateHref(slug)}
      className={`group relative bg-white border border-slate-200 rounded-xl py-3 px-3 sm:px-4 min-h-[140px] sm:min-h-[152px] flex flex-col justify-between hover:border-slate-400 hover:-translate-y-0.5 transition-transform duration-150 overflow-hidden shadow-md ${corner.glow}`}
    >
      {/* 카드 배경 그라디언트 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${side.strip} opacity-[0.07] pointer-events-none`} />
      {/* 상단 strip */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${side.strip}`} />
      {/* 우측 하단 색상 액센트 */}
      <div className={`absolute -bottom-10 -right-10 w-28 h-28 bg-gradient-to-br ${side.strip} opacity-25 rounded-full blur-2xl pointer-events-none`} />

      {/* 상단: 코너 라벨 + 역할 뱃지 */}
      <div className="relative flex items-center justify-between gap-2">
        {cornerLabel && (
          <span className={`text-[9px] sm:text-[10px] font-black tracking-[0.2em] ${corner.labelColor}`}>
            {corner.label}
          </span>
        )}
        <span className={`ml-auto px-2 py-0.5 bg-gradient-to-r ${side.strip} text-white text-[9px] sm:text-[10px] font-extrabold rounded-full shadow-sm`}>
          {role}
        </span>
      </div>

      {/* 중앙: 이름 + 지역 + 슬로건 */}
      <div className="relative">
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mb-1 tracking-tight">
          {t.candidateNames[nameKey]}
        </h3>
        <p className={`text-xs sm:text-sm font-bold ${side.accent} mb-1.5`}>
          {t.candidateRegions[regionKey]}
        </p>
        {slogan && (
          <p className="text-[11px] sm:text-xs text-slate-700 leading-snug italic line-clamp-2">
            &ldquo;{slogan}&rdquo;
          </p>
        )}
        {/* 발행 언어 국기 — ko만 있으면 태극기 1개, 4개 모두 발행 시 4개 표시 */}
        <div className="mt-1.5 flex items-center gap-1" aria-label="published languages">
          {langs.map(l => (
            <span key={l} className="text-sm sm:text-base leading-none" title={l}>{LANG_FLAG[l]}</span>
          ))}
        </div>
      </div>

      {/* 하단: 블로그 자세히 보기 뱃지 */}
      <div className="relative mt-2 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r ${side.strip} text-white text-[10px] sm:text-[11px] font-extrabold rounded-full shadow-sm transition-none`}>
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t.s2BlogBadge}
        </span>
        <svg
          className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-transform shrink-0"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
    </Link>
  );
}

export default function ElectionProposalPage() {
  const [dDay, setDDay] = useState<number | null>(null);
  const [lang, setLang] = useState<Lang>('ko');
  const router = useRouter();
  const pathname = usePathname();

  // URL ?lang= 우선 → localStorage 폴백 → 기본 ko
  // useSearchParams는 prerender 시 Suspense를 요구해서, 클라이언트 마운트 후 window 사용
  useEffect(() => {
    setDDay(calcDDay());
    let urlLang: string | null = null;
    if (typeof window !== 'undefined') {
      urlLang = new URLSearchParams(window.location.search).get('lang');
    }
    if (urlLang && ['ko', 'en', 'zh', 'ja'].includes(urlLang)) {
      setLang(urlLang as Lang);
    } else {
      try {
        const saved = localStorage.getItem('election2026_lang');
        if (saved && ['ko', 'en', 'zh', 'ja'].includes(saved)) setLang(saved as Lang);
      } catch {}
    }
    const id = setInterval(() => setDDay(calcDDay()), 60_000);
    return () => clearInterval(id);
  }, []);

  // 언어 변경 시: state + localStorage + URL ?lang= 동기화 (ko는 query 없음)
  const handleLangChange = (next: Lang) => {
    setLang(next);
    try { localStorage.setItem('election2026_lang', next); } catch {}
    const url = next === 'ko' ? pathname : `${pathname}?lang=${next}`;
    router.replace(url, { scroll: false });
  };

  // 후보자 카드 Link href에 현재 언어 query 추가 (ko는 그대로)
  const candidateHref = (slug: string): string => {
    const base = `/proposal/${encodeURIComponent(slug)}`;
    return lang === 'ko' ? base : `${base}?lang=${lang}`;
  };

  const t = T[lang];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:py-2">
        {/* 인쇄/PDF 저장 시 nav, header, footer, 버튼 자체 숨김 */}
        <style jsx global>{`
          @media print {
            body { background: white !important; }
            header, footer, nav, .pdf-btn-wrap { display: none !important; }
            main { padding: 0 !important; max-width: none !important; }
            section { page-break-inside: avoid; break-inside: avoid; }
            h1, h2, h3, h4 { page-break-after: avoid; }
            table { page-break-inside: avoid; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            a { color: inherit !important; text-decoration: none !important; }
          }
        `}</style>

        {/* ── 언어 탭 + PDF 다운로드 ── */}
        <nav aria-label="Language" className="sticky top-0 z-40 mb-5 -mx-4 sm:mx-0 px-4 sm:px-0 py-2 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full p-1 shadow-sm overflow-x-auto flex-1 min-w-0">
              {(Object.keys(LANG_LABELS) as Lang[]).map((code) => {
                const isActive = code === lang;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleLangChange(code)}
                    aria-pressed={isActive}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/40'
                        : 'text-slate-600 hover:bg-amber-50 hover:text-amber-800'
                    }`}
                  >
                    <span className="text-base leading-none">{LANG_LABELS[code].flag}</span>
                    {LANG_LABELS[code].label}
                  </button>
                );
              })}
            </div>

            {/* PDF 다운로드 — 브라우저 인쇄 다이얼로그 → "PDF로 저장" 선택 */}
            <div className="pdf-btn-wrap shrink-0">
              <button
                type="button"
                onClick={() => {
                  const prev = document.title;
                  document.title = `GEO-AIO_election-2026_${lang}_${new Date().toISOString().slice(0, 10)}`;
                  window.print();
                  setTimeout(() => { document.title = prev; }, 1000);
                }}
                aria-label={t.pdfBtn}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold transition-colors whitespace-nowrap bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-400 hover:to-emerald-500 border border-emerald-400"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                </svg>
                {t.pdfBtn}
              </button>
            </div>
          </div>
        </nav>

        {/* ── Section 1. 히어로 / D-Day ── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-6 sm:px-10 py-10 sm:py-14 mb-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.5)]">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-[11px] font-bold tracking-[0.2em] text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {t.badge}
              </span>
              {dDay !== null && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-[11px] font-extrabold tracking-wide text-rose-200">
                  {t.dDayPrefix}{dDay}{t.dDaySuffix}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight mb-3">
              <span className="block">{t.heroLine1}</span>
              <span className="block bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                {t.heroLine2}
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-200/90 leading-relaxed max-w-3xl">
              {t.heroDesc}
            </p>

            <div className="mt-4 max-w-3xl flex items-start gap-3 px-4 sm:px-5 py-3.5 bg-rose-500/15 border border-rose-400/40 ring-1 ring-rose-300/30 rounded-xl shadow-[0_8px_24px_-8px_rgba(244,63,94,0.4)]">
              <span className="text-2xl shrink-0 leading-none mt-0.5">⚠️</span>
              <p className="text-sm sm:text-base text-rose-50 leading-relaxed">
                {t.urgencyAlert}
                <span className="text-amber-300 font-extrabold"> {t.urgencyTail}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 max-w-3xl">
              {t.stats.map((s) => (
                <div key={s.label} className="bg-white/10 border border-white/15 rounded-xl px-3 py-3 text-center">
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-300">{s.value}</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 2. 패러다임 전환 ── */}
        <section className="bg-gradient-to-br from-white via-slate-50/60 to-white rounded-3xl border border-slate-200/80 ring-1 ring-slate-100/80 p-5 sm:p-7 mb-6 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700 ring-2 ring-rose-300/50 flex items-center justify-center text-base font-bold shadow-md">1</span>
            <h2 className="text-xl sm:text-xl font-extrabold text-gray-900">{t.s1Title}</h2>
          </div>
          <p className="text-base text-gray-700 mb-4 leading-relaxed">{t.s1Lead}</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-gray-50 to-slate-100 border border-gray-200 rounded-xl p-4">
              <div className="text-sm font-bold text-gray-700 mb-1 tracking-wide">{t.s1OldEra}</div>
              <h4 className="text-base font-extrabold text-gray-900 mb-2">{t.s1OldTitle}</h4>
              <p className="text-sm text-gray-800 leading-relaxed">{t.s1OldDesc}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
              <div className="text-sm font-bold text-amber-700 mb-1 tracking-wide">{t.s1MidEra}</div>
              <h4 className="text-base font-extrabold text-gray-900 mb-2">{t.s1MidTitle}</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{t.s1MidDesc}</p>
            </div>
            <div className="relative bg-gradient-to-br from-emerald-50 via-cyan-50 to-emerald-50 border-2 border-emerald-300 ring-2 ring-emerald-200/60 rounded-xl p-4 shadow-md">
              <span className="absolute -top-2 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow">{t.s1NewBadge}</span>
              <div className="text-sm font-bold text-emerald-700 mb-1 tracking-wide">{t.s1NewEra}</div>
              <h4 className="text-base font-extrabold text-emerald-900 mb-2">{t.s1NewTitle}</h4>
              <p className="text-sm text-gray-800 leading-relaxed">{t.s1NewDesc}</p>
            </div>
          </div>
        </section>

        {/* ── Section 3. 후보자별 양자 대결 + 단독 계약 독점권 ── */}
        <section className="bg-gradient-to-br from-white via-slate-50/60 to-white rounded-3xl border border-slate-200/80 ring-1 ring-slate-100/80 p-5 sm:p-7 mb-6 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 text-violet-700 ring-2 ring-violet-300/50 flex items-center justify-center text-base font-bold shadow-md">2</span>
            <h2 className="text-xl sm:text-xl font-extrabold text-gray-900">{t.s2Title}</h2>
          </div>
          <p className="text-base text-gray-700 mb-4 leading-relaxed">{t.s2Lead}</p>

          {/* 단독 계약 독점권 강조 배너 */}
          <div className="relative mb-6">
            <span className="absolute -top-3 left-5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-20 ring-2 ring-white/50 whitespace-nowrap">
              {t.s2ExclusiveBadge}
            </span>
            <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 rounded-2xl p-5 sm:p-6 border-2 border-amber-300 ring-2 ring-amber-200/70 shadow-[0_12px_40px_-8px_rgba(245,158,11,0.4)] overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-rose-300/30 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <h3 className="text-lg sm:text-xl font-extrabold text-amber-900 mb-2 flex items-center gap-2 leading-snug">
                  <span className="text-xl">🏆</span>
                  <span>{t.s2ExclusiveTitle}</span>
                </h3>
                <p className="text-base text-slate-800 leading-relaxed">{t.s2ExclusiveDesc}</p>
              </div>
            </div>
          </div>

          {/* 그룹 헤더 + 페어 그리드 */}
          {(['mp', 'mayor'] as const).map((group) => {
            const groupPairs = PAIRS.filter(p => p.group === group);
            const groupLabel = group === 'mp' ? t.s2GroupMP : t.s2GroupMayor;
            const groupCount = group === 'mp' ? t.s2MPCount : t.s2MayorCount;
            const role = group === 'mp' ? t.s2RoleMP : t.s2RoleMayor;
            return (
              <div key={group} className="mb-6 last:mb-0">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-slate-800 to-slate-700 ${group === 'mp' ? 'text-amber-200' : 'text-emerald-200'} text-xs font-extrabold tracking-[0.2em] rounded-full shadow-sm`}>
                    {groupLabel}
                  </span>
                  <span className="flex-1 h-px bg-gradient-to-r from-slate-300 via-slate-200 to-transparent" />
                  <span className="text-[11px] font-bold text-slate-400 tracking-wide">{groupCount}</span>
                </div>

                <div className="space-y-8 sm:space-y-10 max-w-4xl mx-auto">
                  {groupPairs.map((pair, idx) => (
                    <div key={`${group}-${idx}`} className="relative grid grid-cols-[1fr_180px_1fr] sm:grid-cols-[1fr_280px_1fr] md:grid-cols-[1fr_320px_1fr] items-center gap-1 sm:gap-2">
                      {/* 좌측 후보 카드 — BLUE CORNER */}
                      <CandidateCard side={pair.left} role={role} regionKey={pair.regionKey} t={t} candidateHref={candidateHref} cornerLabel="BLUE" />

                      {/* 가운데 글러브 — grid 컬럼 폭에 맞춰 가득 차게, 카드보다 큰 임팩트 */}
                      <div className="relative w-full flex items-center justify-center -my-3">
                        {/* 황금 빛 후광 */}
                        <div className="absolute inset-0 rounded-full bg-amber-300/30 blur-2xl scale-75" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/election-2026/glove-vs.png"
                          alt={t.s2VsLabel}
                          className="relative w-full h-auto object-contain select-none pointer-events-none drop-shadow-[0_12px_24px_rgba(217,119,6,0.5)]"
                          loading="lazy"
                        />
                      </div>

                      {/* 우측 후보 카드 — RED CORNER */}
                      <CandidateCard side={pair.right} role={role} regionKey={pair.regionKey} t={t} candidateHref={candidateHref} cornerLabel="RED" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <p className="text-xs text-gray-700 mt-4 leading-relaxed">{t.s2Footer}</p>
        </section>

        {/* ── Section 4. 시간 압박 ── */}
        <section className="bg-gradient-to-br from-white via-slate-50/60 to-white rounded-3xl border border-slate-200/80 ring-1 ring-slate-100/80 p-5 sm:p-7 mb-6 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 ring-2 ring-amber-300/50 flex items-center justify-center text-base font-bold shadow-md">3</span>
            <h2 className="text-xl sm:text-xl font-extrabold text-gray-900">{t.s3Title}</h2>
          </div>

          <div className="overflow-x-auto -mx-1 px-1 mb-4">
            <table className="w-full text-base border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="text-left p-3 font-bold text-slate-700">{t.s3ColMethod}</th>
                  <th className="text-center p-3 font-bold text-slate-700">{t.s3ColIndex}</th>
                  <th className="text-center p-3 font-bold text-slate-700">{t.s3ColEffect}</th>
                  <th className="text-center p-3 font-bold text-slate-700">{t.s3ColIn3w}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="p-3 text-gray-700">{t.s3RowSeoMethod}</td>
                  <td className="p-3 text-center text-gray-800">{t.s3RowSeoIndex}</td>
                  <td className="p-3 text-center text-gray-800">{t.s3RowSeoEffect}</td>
                  <td className="p-3 text-center"><span className="text-rose-600 font-bold">❌</span></td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-3 text-gray-700">{t.s3RowSnsMethod}</td>
                  <td className="p-3 text-center text-gray-800">{t.s3RowSnsIndex}</td>
                  <td className="p-3 text-center text-gray-800">{t.s3RowSnsEffect}</td>
                  <td className="p-3 text-center"><span className="text-amber-600 font-bold">△</span><span className="block text-[11px] text-gray-700">{t.s3RowSnsCost}</span></td>
                </tr>
                <tr className="bg-emerald-50/50 border-b-2 border-emerald-300">
                  <td className="p-3 font-extrabold text-emerald-900">{t.s3RowGeoMethod}</td>
                  <td className="p-3 text-center font-bold text-emerald-700">{t.s3RowGeoIndex}</td>
                  <td className="p-3 text-center font-bold text-emerald-700">{t.s3RowGeoEffect}</td>
                  <td className="p-3 text-center"><span className="text-emerald-600 font-extrabold">✅</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="relative mt-2">
            <span className="absolute -top-3 left-5 bg-gradient-to-r from-yellow-400 via-orange-500 to-rose-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-20 ring-2 ring-white/50 whitespace-nowrap">
              {t.s3InstantBadge}
            </span>
            <div className="relative bg-gradient-to-br from-cyan-100 via-sky-100 to-cyan-100 rounded-2xl p-5 sm:p-6 border-2 border-cyan-400 ring-2 ring-cyan-200/70 shadow-[0_12px_40px_-8px_rgba(8,145,178,0.45)] overflow-hidden">
              <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-300/40 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-sky-300/40 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <h4 className="text-lg sm:text-xl font-extrabold text-cyan-900 mb-3 flex items-center gap-2 leading-snug">
                  <span className="text-2xl">🚀</span>
                  <span>{t.s3InstantTitle}</span>
                </h4>
                <p className="text-base text-gray-800 leading-relaxed">{t.s3InstantDesc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4. 다문화 유권자 — 표차의 결정자 (NEW) ── */}
        <section className="relative overflow-hidden rounded-3xl mb-6 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.18)]">
          {/* 배경 그라디언트 — 글로벌·다문화 톤 (Indigo + Cyan + Amber) */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/60 to-cyan-50/40" />
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-300/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-5 sm:p-7 border border-indigo-200/70 ring-1 ring-cyan-100/70 rounded-3xl">
            {/* 헤더 — 좌측 제목 / 우측 4개국 국기 (다국어 도달 가능 언어 시각화) */}
            <div className="flex items-start sm:items-center justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-cyan-200 text-indigo-700 ring-2 ring-indigo-300/50 flex items-center justify-center text-base font-bold shadow-md">4</span>
                <h2 className="text-xl sm:text-xl font-extrabold text-gray-900">{t.sMultiTitle}</h2>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 bg-white/80 border border-indigo-200 rounded-full shadow-sm" aria-label="supported languages">
                <span className="text-xl sm:text-2xl leading-none" title="ko">🇰🇷</span>
                <span className="text-xl sm:text-2xl leading-none" title="en">🇺🇸</span>
                <span className="text-xl sm:text-2xl leading-none" title="zh">🇨🇳</span>
                <span className="text-xl sm:text-2xl leading-none" title="ja">🇯🇵</span>
              </div>
            </div>
            <span className="inline-block text-[11px] font-extrabold tracking-[0.15em] uppercase text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-2.5 py-1 rounded-full mb-3">
              🌍 {t.sMultiBadge}
            </span>
            <p className="text-base text-gray-800 mb-5 leading-relaxed">{t.sMultiLead}</p>

            {/* 임팩트 카드 4개 — 큰 숫자 */}
            <div className="mb-5">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-3">📊 {t.sMultiStatsTitle}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {t.sMultiStats.map((s, i) => (
                  <div key={i} className="relative bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-md overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.accent}`} />
                    <div className={`absolute -bottom-8 -right-8 w-20 h-20 bg-gradient-to-br ${s.accent} opacity-15 rounded-full blur-2xl pointer-events-none`} />
                    <div className="relative">
                      <div className="text-[10px] sm:text-[11px] font-bold text-slate-600 mb-0.5">{s.region}</div>
                      <div className={`text-xl sm:text-3xl font-black bg-gradient-to-r ${s.accent} bg-clip-text text-transparent leading-none mb-1`}>
                        {s.count}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-700 font-semibold leading-tight">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3개 그룹 분류 */}
            <div className="mb-5">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mb-1">🧩 {t.sMultiGroupTitle}</h3>
              <p className="text-xs sm:text-sm text-slate-700 mb-3">{t.sMultiGroupSub}</p>
              <div className="grid sm:grid-cols-3 gap-2.5 sm:gap-3">
                {t.sMultiGroups.map((g, i) => {
                  const accents = ['from-indigo-500 to-violet-600', 'from-amber-500 to-orange-600', 'from-emerald-500 to-teal-600'];
                  return (
                    <div key={i} className="relative bg-white rounded-xl border border-slate-200 p-3.5 shadow-md overflow-hidden">
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accents[i]}`} />
                      <div className="text-sm font-extrabold text-slate-900 mb-2 leading-tight">{g.badge}</div>
                      <div className="text-xs text-amber-700 font-bold mb-2">표차 영향력 {g.weight}</div>
                      <ul className="space-y-1 text-[11px] sm:text-xs text-slate-800">
                        <li><span className="font-bold text-slate-600">신분:</span> {g.legal}</li>
                        <li><span className="font-bold text-slate-600">선거:</span> {g.elections}</li>
                        <li><span className="font-bold text-slate-600">언어:</span> {g.languages}</li>
                        <li><span className="font-bold text-slate-600">톤:</span> {g.tone}</li>
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Insight 강조 박스 */}
            <div className="relative mb-5">
              <span className="absolute -top-3 left-5 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-lg z-10 ring-2 ring-white/50 whitespace-nowrap">
                💡 핵심 통찰
              </span>
              <div className="relative bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 rounded-2xl p-5 sm:p-6 border-2 border-rose-300 ring-2 ring-rose-200/70 shadow-md overflow-hidden">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-300/30 rounded-full blur-3xl pointer-events-none" />
                <h4 className="text-base sm:text-lg font-extrabold text-rose-900 mb-2 leading-snug pl-1">{t.sMultiInsightTitle}</h4>
                <p className="text-sm sm:text-base text-slate-800 leading-relaxed">{t.sMultiInsightDesc}</p>
              </div>
            </div>

            {/* 다국어 발행 강조 + CTA */}
            <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <h4 className="text-base sm:text-lg font-extrabold text-amber-300 mb-2">🌐 {t.sMultiLangTitle}</h4>
                <p className="text-sm text-slate-200 mb-3 leading-relaxed">{t.sMultiLangDesc}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {t.sMultiLangChips.map((chip, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs font-bold text-white">
                      {chip}
                    </span>
                  ))}
                </div>
                <a
                  href="#contact"
                  onClick={(e) => { e.preventDefault(); document.querySelector('[href=\"tel:010-2397-5734\"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-extrabold rounded-full shadow-lg hover:from-amber-400 hover:to-amber-500 transition-colors"
                >
                  {t.sMultiCTA}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
                <p className="text-[11px] text-amber-200/80 mt-2">{t.sMultiCTASub}</p>
              </div>
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-600 mt-3 leading-relaxed">{t.sMultiSourceNote}</p>
          </div>
        </section>

        {/* ── Section 5. ROI 실증 ── */}
        <section className="bg-gradient-to-br from-white via-slate-50/60 to-white rounded-3xl border border-slate-200/80 ring-1 ring-slate-100/80 p-5 sm:p-7 mb-6 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 ring-2 ring-emerald-300/50 flex items-center justify-center text-base font-bold shadow-md">5</span>
            <h2 className="text-xl sm:text-xl font-extrabold text-gray-900">{t.s4Title}</h2>
          </div>
          <p className="text-base text-gray-700 mb-4 leading-relaxed">{t.s4Lead}</p>

          <div className="space-y-5">
            <div className="relative">
              <span className="absolute -top-2.5 left-5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 z-10 tracking-wide">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                </span>
                {t.s4LiveBadge}
              </span>
              <a href="https://buzzlab-busan-bukgu-pledge100.vercel.app/" target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-4 px-6 py-5 bg-gradient-to-r from-amber-50 via-amber-100/80 to-amber-50 border-2 border-amber-300 rounded-2xl shadow-[0_8px_28px_-6px_rgba(251,191,36,0.45)] ring-2 ring-amber-200/60 hover:scale-[1.02] hover:shadow-[0_16px_40px_-8px_rgba(251,191,36,0.55)] hover:border-amber-500 transition-colors duration-200">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shrink-0 shadow-md ring-2 ring-amber-300/40">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-amber-700 mb-1 tracking-wide uppercase">{t.s4Case1Tag}</p>
                  <p className="text-lg font-extrabold text-slate-900 leading-snug">{t.s4Case1Title}</p>
                </div>
                <svg className="w-6 h-6 text-amber-700 group-hover:translate-x-1.5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>

            <div className="relative">
              <span className="absolute -top-2.5 left-5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 z-10 tracking-wide">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                </span>
                {t.s4LiveBadge}
              </span>
              <a href="https://buzzlab-busan-bukgu-route.vercel.app/" target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-4 px-6 py-5 bg-gradient-to-r from-rose-50 via-pink-100/80 to-rose-50 border-2 border-pink-300 rounded-2xl shadow-[0_8px_28px_-6px_rgba(236,72,153,0.45)] ring-2 ring-pink-200/60 hover:scale-[1.02] hover:shadow-[0_16px_40px_-8px_rgba(236,72,153,0.55)] hover:border-pink-500 transition-colors duration-200">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-700 flex items-center justify-center shrink-0 shadow-md ring-2 ring-pink-300/40">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0L6.343 16.657a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-pink-700 mb-1 tracking-wide uppercase">{t.s4Case2Tag}</p>
                  <p className="text-lg font-extrabold text-slate-900 leading-snug">{t.s4Case2Title}</p>
                </div>
                <svg className="w-6 h-6 text-pink-700 group-hover:translate-x-1.5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ── Section 6. 채택 안내 ── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-6 sm:px-10 py-8 sm:py-10 mb-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.5)]">
          <div className="absolute -top-16 -right-16 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-amber-500/20 ring-2 ring-amber-400/50 text-amber-300 flex items-center justify-center text-base font-bold">6</span>
              <h2 className="text-xl sm:text-2xl font-extrabold">{t.s5Title}</h2>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-extrabold tracking-[0.2em] text-amber-300">{t.s5Group1}</span>
                <span className="flex-1 h-px bg-amber-400/30" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {t.s5Items1.map((item, i) => (
                  <div key={i} className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 flex items-start gap-3">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div>
                      <div className="text-base font-extrabold text-amber-200 mb-0.5">{item.title}</div>
                      <div className="text-sm text-slate-300 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-extrabold tracking-[0.2em] text-emerald-300">{t.s5Group2}</span>
                <span className="flex-1 h-px bg-emerald-400/30" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {t.s5Items2.map((item, i) => (
                  <div key={i} className="bg-emerald-500/10 border border-emerald-400/30 ring-1 ring-emerald-400/20 rounded-xl px-4 py-3 flex items-start gap-3">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div>
                      <div className="text-base font-extrabold text-emerald-200 mb-0.5">{item.title}</div>
                      <div className="text-sm text-slate-300 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-emerald-300/80 mt-2 leading-relaxed">{t.s5GroupNote}</p>
            </div>

            <div className="bg-amber-500/10 border border-amber-400/40 rounded-xl p-4 sm:p-5 mb-5">
              <div className="text-sm font-bold text-amber-300 tracking-wide mb-3">{t.s5RoadmapTitle}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {t.s5Roadmap.map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg px-3 py-3">
                    <div className="text-[11px] font-extrabold text-amber-300 tracking-widest mb-1">STEP {i + 1} · {s.step}</div>
                    <div className="text-base font-bold text-white mb-0.5">{s.title}</div>
                    <div className="text-xs text-slate-300 leading-snug">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/8 border border-white/15 rounded-xl p-4 sm:p-5">
              <div className="text-xs font-bold text-amber-300 tracking-wide mb-1">{t.s5ContactLabel}</div>
              <div className="text-lg font-extrabold text-white mb-0.5">{t.s5ContactCompany}</div>
              <div className="text-sm text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                <a href="tel:010-2397-5734" className="hover:text-white">📞 010-2397-5734</a>
                <a href="mailto:jaiwshim@gmail.com" className="hover:text-white">✉ jaiwshim@gmail.com</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 7. 영상 ── */}
        <section className="bg-gradient-to-br from-white via-slate-50/60 to-white rounded-3xl border border-slate-200/80 ring-1 ring-slate-100/80 p-5 sm:p-7 mb-6 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700 ring-2 ring-rose-300/50 flex items-center justify-center text-base font-bold shadow-md">7</span>
            <h2 className="text-xl sm:text-xl font-extrabold text-gray-900">{t.s6Title}</h2>
          </div>
          <p className="text-base text-gray-700 mb-4 leading-relaxed">{t.s6Desc}</p>
          <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden ring-1 ring-slate-200 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.25)]">
            <iframe
              src="https://www.youtube.com/embed/2nRsOd-EyDQ"
              title="GEO-AIO 선거 마케팅 솔루션 소개"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </section>

        {/* ── Section 8. 12장 가이드 ── */}
        <section className="bg-gradient-to-br from-white via-slate-50/60 to-white rounded-3xl border border-slate-200/80 ring-1 ring-slate-100/80 p-5 sm:p-7 mb-6 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-amber-300 ring-2 ring-amber-400/40 flex items-center justify-center text-base font-bold shadow-md">8</span>
            <h2 className="text-xl sm:text-xl font-extrabold text-gray-900">{t.s7Title} <span className="text-slate-700">{t.s7Sub}</span></h2>
          </div>
          <p className="text-base text-gray-700 mb-5 leading-relaxed">{t.s7Desc}</p>
          <div className="space-y-4">
            {Array.from({ length: 12 }, (_, i) => {
              const n = String(i + 1).padStart(2, '0');
              return (
                <div key={n} className="relative bg-white rounded-2xl border border-slate-200/80 ring-1 ring-slate-100 shadow-[0_8px_24px_-10px_rgba(15,23,42,0.18)] overflow-hidden">
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/85 text-amber-300 text-[11px] font-extrabold rounded-full tracking-[0.15em] z-10 ring-1 ring-amber-400/40 shadow-md">
                    {n} / 12
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/images/election-2026/page-${n}.jpg`}
                    alt={`${t.s7Alt} ${i + 1}`}
                    className="w-full block"
                    loading="lazy"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 9. 저자/개발자 저서 ── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-6 sm:px-10 py-8 sm:py-10 mb-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.5)]">
          <div className="absolute -top-16 -right-16 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 ring-1 ring-amber-400/40 text-amber-300 text-[11px] font-extrabold tracking-[0.2em] uppercase">
                {t.s8Badge}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold mb-2">{t.s8Title}</h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-5 max-w-3xl">{t.s8Desc}</p>

            <a
              href="https://www.yes24.com/product/goods/167254666"
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-white/5 border border-white/15 ring-1 ring-white/10 rounded-2xl p-5 sm:p-6 hover:bg-white/10 hover:border-amber-400/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-center sm:items-stretch">
                <div className="shrink-0 w-44 sm:w-48 rounded-xl overflow-hidden ring-2 ring-amber-400/30 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/election-2026/book-ai-election.png"
                    alt={t.s8Alt}
                    className="w-full h-auto block"
                    loading="lazy"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center text-center sm:text-left">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-1">{t.s8BookTitle}</h3>
                  <p className="text-base sm:text-lg font-bold text-amber-200 mb-3">{t.s8BookSubtitle}</p>
                  <p className="text-sm text-slate-300 mb-1">{t.s8Authors}</p>
                  <p className="text-xs text-slate-400 mb-4">{t.s8Publisher}</p>
                  <div className="inline-flex items-center justify-center sm:justify-start gap-2 self-center sm:self-start px-4 py-2.5 rounded-xl bg-amber-500 text-slate-900 font-extrabold text-sm shadow-[0_8px_24px_-8px_rgba(245,158,11,0.6)] ring-2 ring-amber-300/40 group-hover:bg-amber-400 transition-colors">
                    <span>{t.s8CTA}</span>
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </section>

        {/* ── 풋터 ── */}
        <section className="bg-gradient-to-br from-white via-slate-50/60 to-white rounded-3xl border border-slate-200/80 ring-1 ring-slate-100/80 p-5 mb-6 text-sm text-slate-700 leading-relaxed shadow-[0_8px_32px_-12px_rgba(15,23,42,0.06)]">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="font-bold text-gray-700 mb-1">{t.footerSourceTitle}</p>
              <p>{t.footerSourceText}</p>
            </div>
            <div>
              <p className="font-bold text-gray-700 mb-1">{t.footerLegalTitle}</p>
              <p>{t.footerLegalText}</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
