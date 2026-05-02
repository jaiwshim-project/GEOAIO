// 색인 모니터링 대상 사이트 등록부
// 사이트를 추가하려면 이 배열에 한 항목만 추가하면 됨.

export interface IndexingSiteConfig {
  id: string;                    // URL 식별자 (lowercase, kebab-case)
  label: string;                 // UI에 표시되는 이름
  domain: string;                // 사용자 친화적 도메인
  description: string;           // 카드 설명
  siteUrl: string;               // GSC 속성 URL (sc-domain:... 또는 https://...)
  sitemapUrl: string;            // 사이트맵 URL
  categoryMap?: Record<string, string[]>;  // 카테고리 라벨 → URL prefix 배열
  color: 'emerald' | 'indigo' | 'violet' | 'rose' | 'amber' | 'cyan';
  emoji: string;
}

export const INDEXING_SITES: IndexingSiteConfig[] = [
  {
    id: 'metabiz101-tistory',
    label: 'AX Biz Group',
    domain: 'metabiz101.tistory.com',
    description: '심재우 대표 운영. AX비즈·AX메디·AX에듀·GEO-AIO·에바셀 등 다영역 콘텐츠 5,400+편',
    siteUrl: 'sc-domain:metabiz101.tistory.com',
    sitemapUrl: 'https://metabiz101.tistory.com/sitemap.xml',
    categoryMap: {
      'AX비즈': ['/category/AX비즈', '/category/ax-biz'],
      'AX메디': ['/category/AX메디', '/category/ax-medi'],
      'AX에듀': ['/category/AX에듀', '/category/ax-edu'],
      'GEO-AIO': ['/category/GEO-AIO', '/category/geo-aio'],
      '에바셀': ['/category/E-VAR Cell', '/category/에바셀'],
      'RQTDW': ['/category/RQTDW', '/category/창의사고'],
      '병원교육': ['/category/병원 스킬교육', '/category/병원교육'],
      '인셀랩': ['/category/인셀랩', '/category/InCellLab'],
      '북리뷰/뉴스레터': ['/category/북 리뷰', '/category/뉴스레터'],
      '취강/조강': ['/category/취강', '/category/조강'],
    },
    color: 'indigo',
    emoji: '🏢',
  },
  {
    id: 'digitalsmile-tistory',
    label: '디지털스마일치과',
    domain: 'digitalsmile.tistory.com',
    description: '박찬익 원장 운영. DSD(디지털 스마일 디자인) 중심 6 카테고리, 240편 매트릭스 발행 예정',
    siteUrl: 'sc-domain:digitalsmile.tistory.com',
    sitemapUrl: 'https://digitalsmile.tistory.com/sitemap.xml',
    categoryMap: {
      '디지털스마일치과': ['/category/1', '/category/디지털스마일치과'],
      '임플란트': ['/category/2', '/category/임플란트'],
      '교정': ['/category/3', '/category/교정'],
      '라미네이트': ['/category/4', '/category/라미네이트'],
      '보철': ['/category/5', '/category/보철'],
      '틀니': ['/category/6', '/category/틀니'],
    },
    color: 'emerald',
    emoji: '🦷',
  },
  {
    id: 'geo-aio-blog',
    label: 'GEO-AIO 블로그',
    domain: 'www.geo-aio.com/blog',
    description: '심재우 대표 운영. GEO-AIO·리젠메드·대전맥주장·치과병원 등 4 카테고리, 501편(다국어 ko/en/zh/ja) 운영',
    siteUrl: 'sc-domain:geo-aio.com',
    sitemapUrl: 'https://www.geo-aio.com/sitemap.xml',
    categoryMap: {
      'GEO-AIO': ['/blog/category/geo-aio'],
      '리젠메드컨설팅': ['/blog/category/regenmed'],
      '대전맥주장 수제맥주': ['/blog/category/brewery'],
      '치과병원': ['/blog/category/dental'],
    },
    color: 'amber',
    emoji: '🌐',
  },
];

export function getSiteConfig(id: string): IndexingSiteConfig | null {
  return INDEXING_SITES.find(s => s.id === id) || null;
}
