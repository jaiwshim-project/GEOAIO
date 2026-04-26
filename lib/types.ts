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
  | 'email'
  | 'case';

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
  // === CEP (Category Entry Point) 통합 ===
  sceneSentence?: string;       // Step 5 — 점유할 장면 문장 (사람이 아닌 순간)
  searchPath?: string[];        // Step 2 — 소비자 검색 경로 (예: 선크림 밀림 → 화장 뜸 → 화장 잘먹는 선크림)
  cepCluster?: string[];        // Step 2 — 같은 의도 검색어 클러스터
  lifeLanguages?: string[];     // Step 1 — 카테고리 진입 직전의 삶의 언어
  cepKeyword?: string;          // Step 4 — 선택된 대표 CEP 키워드
  cepTask?: string;             // Step 3 — 소비자 과업 (예: "화장 망치지 않고 자외선 차단")
  masterId?: string;            // 마스터 글 ID (파생 콘텐츠일 때)
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
  masterId?: string;
}

export interface RevisionItem {
  id: string;
  date: string;
  editNotes: string;
  result: GenerateResponse;
}

// === CEP 발굴 5단계 ===

// Step 1·2 — 삶의 언어 + 검색 클러스터 수집
export interface CEPClusterRequest {
  seedKeyword: string;
  industry?: string;
  businessContext?: string;
}

export interface CEPCluster {
  clusterName: string;          // 클러스터 대표 이름 (예: "선크림 밀림 고민")
  keywords: string[];           // 같은 의도로 묶인 검색어들
  searchPath: string[];         // 검색 경로 (예: A → B → C)
  intent: string;               // 검색 의도 한 줄 요약
}

export interface CEPClusterResponse {
  seedKeyword: string;
  lifeLanguages: string[];      // 카테고리 진입 직전 삶의 언어 (Step 1)
  autoCompleteRaw: string[];    // 네이버 자동완성 원본
  clusters: CEPCluster[];       // 클러스터링 결과 (Step 2)
}

// Step 3 — 클러스터 → 장면 문장 번역
export interface CEPSceneTranslateRequest {
  cluster: CEPCluster | { clusterName?: string; keywords: string[]; searchPath?: string[] };
  industry?: string;
  businessContext?: string;
}

export interface CEPSceneTranslateResponse {
  sceneSentence: string;        // "아침 화장 전, 선크림은 발라야 하지만…"
  task: string;                 // 소비자 과업
  rationale: string;            // 번역 근거
  contentHooks: string[];       // 콘텐츠에 녹일 수 있는 후크 3개
}

// Step 4 — 시장성·브랜드 적합성·입증 가능성 3축 스코어링
export interface CEPCandidateInput {
  cepKeyword: string;
  sceneSentence?: string;
  searchPath?: string[];
  type?: 'explicit' | 'latent'; // 명시적 / 잠재적
}

export interface CEPCandidateScore {
  marketFit: number;            // 시장성 0~5
  brandFit: number;             // 브랜드 적합성 0~5
  provability: number;          // 입증 가능성 0~5
  total: number;                // 종합 0~15
  rationale: {
    market: string;
    brand: string;
    proof: string;
  };
}

export interface CEPCandidate extends CEPCandidateInput {
  score: CEPCandidateScore;
  recommendation: string;
}

export interface CEPScoreRequest {
  candidates: CEPCandidateInput[];
  businessContext?: string;
  ragSummary?: string;
}

export interface CEPScoreResponse {
  candidates: CEPCandidate[];
  topPick: CEPCandidate;
  explicitPicks: CEPCandidate[];
  latentPicks: CEPCandidate[];
}
