// === 분석 요청/응답 타입 ===

export interface AnalysisRequest {
  content: string;
  url?: string;
  targetKeyword?: string;
  competitorUrls?: string[];
  analysisType: 'full' | 'aio' | 'geo' | 'keyword';
}

export interface AnalysisResponse {
  overallScore: number;
  aio: AIOScore;
  geo: GEOScore;
  keywords: KeywordAnalysis;
  competitor: CompetitorAnalysis | null;
  recommendations: Recommendation[];
}

// === AIO 분석 ===

export interface AIOScore {
  total: number;
  structuredAnswer: number;    // 구조화된 답변 적합성
  clarity: number;             // 명확성/간결성
  citability: number;          // 인용 가능성
  aiOverviewProbability: number; // AI Overview 노출 확률
  details: AIODetail[];
}

export interface AIODetail {
  category: string;
  score: number;
  description: string;
  suggestions: string[];
}

// === GEO 분석 ===

export interface GEOScore {
  total: number;
  aiSearchFriendliness: number;  // AI 검색엔진 친화도
  eeat: EEATScore;               // E-E-A-T 신호
  structuredData: number;        // 구조화 데이터 활용도
  semanticCompleteness: number;  // 의미적 완성도
  details: GEODetail[];
}

export interface EEATScore {
  experience: number;
  expertise: number;
  authoritativeness: number;
  trustworthiness: number;
}

export interface GEODetail {
  category: string;
  score: number;
  description: string;
  suggestions: string[];
}

// === 키워드 분석 ===

export interface KeywordAnalysis {
  primaryKeywords: KeywordInfo[];
  relatedKeywords: string[];
  longTailOpportunities: string[];
  density: KeywordDensity[];
  placementSuggestions: string[];
}

export interface KeywordInfo {
  keyword: string;
  count: number;
  density: number;
  prominence: 'high' | 'medium' | 'low';
}

export interface KeywordDensity {
  keyword: string;
  percentage: number;
  optimal: boolean;
}

// === 경쟁사 비교 ===

export interface CompetitorAnalysis {
  competitors: CompetitorScore[];
  gaps: string[];
  differentiators: string[];
}

export interface CompetitorScore {
  url: string;
  overallScore: number;
  aioScore: number;
  geoScore: number;
}

// === 개선 제안 ===

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'aio' | 'geo' | 'keyword' | 'structure' | 'content';
  title: string;
  description: string;
  before?: string;
  after?: string;
  expectedImpact: string;
}

// === UI 상태 ===

export type AnalysisTab = 'overview' | 'aio' | 'geo' | 'keywords' | 'competitor' | 'recommendations' | 'optimize';

// === AI 최적화 변환 ===

export interface OptimizeRequest {
  originalContent: string;
  targetKeyword?: string;
  recommendations: Recommendation[];
  aioScore: number;
  geoScore: number;
}

export interface OptimizeResponse {
  optimizedContent: string;
  changeSummary: string[];
  expectedScoreImprovement: {
    aio: number;
    geo: number;
    overall: number;
  };
}

export interface DashboardState {
  isAnalyzing: boolean;
  activeTab: AnalysisTab;
  result: AnalysisResponse | null;
  error: string | null;
}

// === 콘텐츠 생성 ===

export type ContentCategory =
  | 'blog'
  | 'product'
  | 'faq'
  | 'howto'
  | 'landing'
  | 'technical'
  | 'social'
  | 'email';

export interface GenerateRequest {
  category: ContentCategory;
  topic: string;
  targetKeyword?: string;
  subKeyword?: string;
  tone?: string;
  additionalNotes?: string;
  company_name?: string;
  representative_name?: string;
  region?: string;
}

export interface GenerateResponse {
  title: string;
  content: string;
  hashtags?: string[];
  metadata: {
    wordCount: number;
    estimatedReadTime: string;
    seoTips: string[];
  };
}

// === 이력 관리 ===

export interface HistoryItem {
  id: string;
  type: 'analysis' | 'generation';
  title: string;
  summary: string;
  date: string;
  category?: ContentCategory;
  targetKeyword?: string;
  // 분석용
  analysisResult?: AnalysisResponse;
  originalContent?: string;
  // 생성용
  generateResult?: GenerateResponse;
  topic?: string;
  tone?: string;
  revisions?: RevisionItem[];
}

export interface RevisionItem {
  id: string;
  date: string;
  editNotes: string;
  result: GenerateResponse;
}
