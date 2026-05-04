import { createClient } from './supabase-client';
import type { HistoryItem, RevisionItem, ContentCategory, GenerateResponse } from './types';

// ============================
// 블로그 포스트 타입
// ============================

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  tag: string;
  hashtags: string[];
  metadata: Record<string, unknown>;
  targetKeyword: string;
  historyId: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategory {
  id: string;
  slug: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
}

function getSupabase() {
  return createClient();
}

// === 카테고리 검증 (클라이언트 발행 경로) ===
// /api/blog/posts route는 외부 통합용이고 실제 클라이언트 발행은 saveBlogPost(s)Batch가 게이트.
// 같은 검증 규칙을 여기에도 박아 폴백 사고를 진짜로 막는다.
const FORBIDDEN_CATEGORY_VALUES = new Set([
  'blog', 'product', 'faq', 'howto', 'landing', 'technical', 'social', 'email', 'case', 'video',
  'undefined', 'null', '', 'autopilot', '__fallback__', 'fallback',
]);
function assertValidCategory(raw: unknown, ctx: string): string {
  if (typeof raw !== 'string') throw new Error(`[${ctx}] category must be a string`);
  const v = raw.trim();
  if (!v) throw new Error(`[${ctx}] category is empty — selectedBlogCategory를 먼저 선택하세요.`);
  if (FORBIDDEN_CATEGORY_VALUES.has(v.toLowerCase())) {
    throw new Error(`[${ctx}] category "${v}"는 콘텐츠 형식 식별자입니다. 프로젝트 카테고리/후보자명으로 다시 선택하세요.`);
  }
  if (v.length < 2 || v.length > 80) throw new Error(`[${ctx}] category 길이는 2~80자여야 합니다 (got ${v.length}: "${v}")`);
  if (!/^[\p{L}\p{N}\-_·\s/]+$/u.test(v)) throw new Error(`[${ctx}] category에 허용되지 않는 문자가 포함되었습니다: "${v}"`);
  return v;
}

async function getUserId(): Promise<string> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');
  return user.id;
}

// ============================
// 프로필 CRUD
// ============================

export interface ProfileData {
  companyName: string;
  brandName: string;
  industry: string;
  customIndustry: string;
  mainProduct: string;
  productDescription: string;
  priceRange: string;
  mainBenefit: string;
  targetAudience: string;
  customerNeeds: string;
  strengths: string[];
  uniquePoint: string;
  location: string;
  website: string;
}

export interface Profile {
  id: string;
  name: string;
  data: ProfileData;
  savedAt: string;
}

export async function getProfiles(): Promise<Profile[]> {
  const userId = await getUserId();
  const { data, error } = await getSupabase()
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    data: row.data as ProfileData,
    savedAt: new Date(row.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\. /g, '-').replace('.', ''),
  }));
}

export async function saveProfile(name: string, data: ProfileData): Promise<void> {
  const userId = await getUserId();
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('name', name)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('business_profiles')
      .update({ data, created_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('business_profiles')
      .insert({ name, data, user_id: userId });
    if (error) throw error;
  }
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await getSupabase().from('business_profiles').delete().eq('id', id);
  if (error) throw error;
}

// ============================
// 이력 CRUD
// ============================

export async function getHistoryItems(): Promise<HistoryItem[]> {
  const { data, error } = await getSupabase()
    .from('history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    type: row.type,
    title: row.title,
    summary: row.summary || '',
    date: row.date,
    category: row.category || undefined,
    targetKeyword: row.target_keyword || undefined,
    analysisResult: row.analysis_result || undefined,
    originalContent: row.original_content || undefined,
    generateResult: row.generate_result || undefined,
    topic: row.topic || undefined,
    tone: row.tone || undefined,
    revisions: row.revisions || [],
  }));
}

export async function saveHistoryItemSupabase(item: HistoryItem): Promise<void> {
  const userId = await getUserId();
  const { error } = await getSupabase().from('history').insert({
    id: item.id,
    type: item.type,
    title: item.title,
    summary: item.summary,
    date: item.date,
    category: item.category || null,
    target_keyword: item.targetKeyword || null,
    analysis_result: item.analysisResult || null,
    original_content: item.originalContent || null,
    generate_result: item.generateResult || null,
    topic: item.topic || null,
    tone: item.tone || null,
    revisions: item.revisions || [],
    user_id: userId,
  });
  if (error) throw error;
}

export async function updateHistoryContentSupabase(id: string, content: string): Promise<void> {
  const supabase = getSupabase();
  const { data, error: fetchError } = await supabase
    .from('history')
    .select('generate_result, original_content, type')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;

  if (data?.type === 'generation' && data?.generate_result) {
    const updated = { ...data.generate_result, content };
    const { error } = await supabase
      .from('history')
      .update({ generate_result: updated })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('history')
      .update({ original_content: content })
      .eq('id', id);
    if (error) throw error;
  }
}

export async function deleteHistoryItemSupabase(id: string): Promise<void> {
  const { error } = await getSupabase().from('history').delete().eq('id', id);
  if (error) throw error;
}

export async function addRevisionSupabase(historyId: string, revision: RevisionItem): Promise<void> {
  const supabase = getSupabase();
  const { data, error: fetchError } = await supabase
    .from('history')
    .select('revisions')
    .eq('id', historyId)
    .single();
  if (fetchError) throw fetchError;

  const revisions = [...(data?.revisions || []), revision];
  const { error } = await supabase
    .from('history')
    .update({ revisions })
    .eq('id', historyId);
  if (error) throw error;
}

// ============================
// API 키 CRUD
// ============================

export async function getApiKey(keyType: string): Promise<string | null> {
  const userId = await getUserId();
  const { data, error } = await getSupabase()
    .from('api_keys')
    .select('encrypted_key')
    .eq('key_type', keyType)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.encrypted_key || null;
}

export async function saveApiKey(keyType: string, key: string): Promise<void> {
  const userId = await getUserId();
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('api_keys')
    .select('id')
    .eq('key_type', keyType)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('api_keys')
      .update({ encrypted_key: key })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('api_keys')
      .insert({ key_type: keyType, encrypted_key: key, user_id: userId });
    if (error) throw error;
  }
}

export async function deleteApiKey(keyType: string): Promise<void> {
  const userId = await getUserId();
  const { error } = await getSupabase()
    .from('api_keys')
    .delete()
    .eq('key_type', keyType)
    .eq('user_id', userId);
  if (error) throw error;
}

// ============================
// 생성 결과 저장/조회
// ============================

export interface GenerateResultData {
  result: GenerateResponse;
  category: ContentCategory;
  topic: string;
  targetKeyword: string;
  tone: string;
  historyId: string;
  project_id?: string;
  selected_ab_index?: number;
}

export async function saveGenerateResult(data: GenerateResultData): Promise<string> {
  const userId = await getUserId();
  const id = `gr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { error } = await getSupabase()
    .from('generate_results')
    .insert({
      id,
      data,
      user_id: userId,
      project_id: data.project_id || null,
      selected_ab_index: data.selected_ab_index ?? 0,
    });
  if (error) throw error;
  return id;
}

export async function getGenerateResult(id: string): Promise<GenerateResultData | null> {
  const { data, error } = await getSupabase()
    .from('generate_results')
    .select('data')
    .eq('id', id)
    .single();
  if (error) return null;
  return data?.data as GenerateResultData || null;
}

// ============================
// 이미지 업로드/조회
// ============================

export async function uploadImage(historyId: string, base64: string, prompt: string): Promise<string> {
  const supabase = getSupabase();

  try {
    const matches = base64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return base64;

    const contentType = matches[1];
    const b64data = matches[2];
    const byteString = atob(b64data);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }

    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const fileName = `${historyId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(fileName, bytes, { contentType, upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    await supabase.from('generated_images').insert({
      history_id: historyId,
      image_url: imageUrl,
      prompt,
    });

    return imageUrl;
  } catch {
    return base64;
  }
}

export async function getImages(historyId: string): Promise<{ url: string; prompt: string }[]> {
  const { data, error } = await getSupabase()
    .from('generated_images')
    .select('image_url, prompt')
    .eq('history_id', historyId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data || []).map(row => ({ url: row.image_url, prompt: row.prompt || '' }));
}

// ============================
// 블로그 포스트 CRUD
// ============================

/**
 * blog_articles 행에서 CEP 메타를 추출.
 * metadata 컬럼 우선, 없으면 author 필드의 JSON 폴백.
 */
export function extractBlogCepMeta(row: { metadata?: unknown; author?: unknown }): {
  sceneSentence?: string;
  cepKeyword?: string;
  searchPath?: string[];
  cepTask?: string;
} | null {
  // 1순위: metadata 컬럼
  const md = row.metadata as Record<string, unknown> | null | undefined;
  if (md && typeof md === 'object') {
    const cep = (md as { cep?: Record<string, unknown> }).cep;
    if (cep && typeof cep === 'object') {
      return cep as ReturnType<typeof extractBlogCepMeta>;
    }
  }
  // 2순위: author 필드 JSON 폴백 (구 데이터)
  if (typeof row.author === 'string' && row.author.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(row.author) as { metadata?: { cep?: unknown } };
      if (parsed?.metadata?.cep && typeof parsed.metadata.cep === 'object') {
        return parsed.metadata.cep as ReturnType<typeof extractBlogCepMeta>;
      }
    } catch { /* ignore */ }
  }
  return null;
}

/**
 * CEP 자동 측정 큐 등록 — 어느 발행 경로(client/server)에서든 service role로 안전 INSERT.
 * fire-and-forget 권장. 실패해도 발행 자체를 막지 않음.
 */
async function enqueueCepMeasurement(post: {
  id: string;
  title?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const cep = (post.metadata as { cep?: { sceneSentence?: string; cepKeyword?: string; searchPath?: string[] } } | undefined)?.cep;
  if (!cep || (!cep.sceneSentence && !cep.cepKeyword)) return;

  // server: 절대 URL 필요 / client: 상대 URL OK
  const isServer = typeof window === 'undefined';
  const baseUrl = isServer
    ? (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.geo-aio.com')
    : '';
  const endpoint = `${baseUrl}/api/cep/enqueue`;

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blogArticleId: post.id,
        title: post.title,
        sceneSentence: cep.sceneSentence,
        cepKeyword: cep.cepKeyword,
        searchPath: cep.searchPath,
      }),
    });
  } catch (e) {
    console.error('[CEP] enqueueCepMeasurement failed:', e);
  }
}

export async function saveBlogPost(post: {
  title: string;
  content: string;
  summary?: string;
  category: string;
  tag?: string;
  hashtags?: string[];
  metadata?: Record<string, unknown>;
  targetKeyword?: string;
  historyId?: string;
  masterId?: string;
}): Promise<string> {
  try {
    const validCategory = assertValidCategory(post.category, 'saveBlogPost');
    const meta = JSON.stringify({
      tag: post.tag || '',
      summary: post.summary || '',
      targetKeyword: post.targetKeyword || '',
      historyId: post.historyId || '',
      metadata: post.metadata || {},
    });
    const insertData = {
      title: post.title,
      content: post.content,
      category: validCategory,
      tags: post.hashtags || [],
      author: meta,
      metadata: post.metadata || {},
      master_id: post.masterId || null,
    };
    console.log('saveBlogPost inserting:', insertData);
    const { data, error } = await getSupabase()
      .from('blog_articles')
      .insert(insertData)
      .select('id')
      .single();
    if (error) {
      console.error('saveBlogPost error:', error);
      throw new Error(`DB 오류: ${error.message} (code: ${error.code})`);
    }
    console.log('saveBlogPost success:', data);
    // CEP 자동 측정 큐 등록 (fire-and-forget — 발행 흐름 막지 않음)
    enqueueCepMeasurement({
      id: data.id,
      title: post.title,
      metadata: post.metadata,
    }).catch(() => {});
    return data.id;
  } catch (err) {
    console.error('saveBlogPost catch:', err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}

export async function saveBlogPostsBatch(posts: {
  title: string;
  content: string;
  summary?: string;
  category: string;
  tag?: string;
  hashtags?: string[];
  metadata?: Record<string, unknown>;
  targetKeyword?: string;
  historyId?: string;
  masterId?: string;
}[]): Promise<string[]> {
  // 모든 글의 카테고리를 사전 검증 — 1건이라도 폴백 의심값이면 전체 중단
  posts.forEach((post, idx) => assertValidCategory(post.category, `saveBlogPostsBatch[${idx}]`));
  const rows = posts.map(post => ({
    title: post.title,
    content: post.content,
    category: post.category.trim(),
    tags: post.hashtags || [],
    author: JSON.stringify({
      tag: post.tag || '',
      summary: post.summary || '',
      targetKeyword: post.targetKeyword || '',
      historyId: post.historyId || '',
      metadata: post.metadata || {},
    }),
    metadata: post.metadata || {},
    master_id: post.masterId || null,
  }));
  const { data, error } = await getSupabase()
    .from('blog_articles')
    .insert(rows)
    .select('id');
  if (error) throw error;
  const ids = (data || []).map(row => row.id);
  // CEP 자동 측정 큐 등록 (fire-and-forget, 각 글마다)
  posts.forEach((post, idx) => {
    if (ids[idx]) {
      enqueueCepMeasurement({
        id: ids[idx],
        title: post.title,
        metadata: post.metadata,
      }).catch(() => {});
    }
  });
  return ids;
}

export async function getBlogPosts(category?: string): Promise<BlogPost[]> {
  let query = getSupabase()
    .from('blog_articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.limit(10000);
  if (error) throw error;
  return (data || []).map(row => {
    let meta: Record<string, unknown> = {};
    if (row.author) {
      try { meta = JSON.parse(row.author); } catch { /* ignore */ }
    }
    // metadata 컬럼이 1급 시민. 없거나 비어있으면 author JSON에서 폴백.
    const columnMeta = (row.metadata && typeof row.metadata === 'object')
      ? (row.metadata as Record<string, unknown>)
      : null;
    const fallbackMeta = (meta.metadata as Record<string, unknown>) || {};
    const finalMetadata = (columnMeta && Object.keys(columnMeta).length > 0)
      ? columnMeta
      : fallbackMeta;
    // CEP 메타 추출 시 헬퍼 사용 (저장 안 하는 호출자는 무시)
    const cep = extractBlogCepMeta(row);
    if (cep && !finalMetadata.cep) {
      finalMetadata.cep = cep;
    }
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      summary: (meta.summary as string) || '',
      category: row.category || '',
      tag: (meta.tag as string) || '',
      hashtags: Array.isArray(row.tags) ? row.tags : [],
      metadata: finalMetadata,
      targetKeyword: (meta.targetKeyword as string) || '',
      historyId: (meta.historyId as string) || '',
      published: true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

export async function deleteBlogPost(id: string): Promise<void> {
  const { error } = await getSupabase().from('blog_articles').delete().eq('id', id);
  if (error) throw error;
}

// ============================
// 블로그 카테고리 (blog_articles의 category 컬럼 기반)
// ============================

const DEFAULT_CATEGORIES: BlogCategory[] = [
  { id: '1', slug: 'geo-aio', label: 'GEO-AIO', description: 'AI 검색 최적화 관련 콘텐츠', color: 'from-indigo-500 to-violet-600', icon: 'search', sortOrder: 0 },
  { id: '2', slug: 'regenmed', label: '리젠메드컨설팅', description: '컨설팅 관련 콘텐츠', color: 'from-emerald-500 to-teal-600', icon: 'building', sortOrder: 1 },
  { id: '3', slug: 'brewery', label: '대전맥주장 수제맥주', description: '수제맥주 관련 콘텐츠', color: 'from-amber-500 to-orange-600', icon: 'badge', sortOrder: 2 },
  { id: '4', slug: 'dental', label: '치과병원', description: '치과 관련 콘텐츠', color: 'from-sky-500 to-blue-600', icon: 'heart', sortOrder: 3 },
];

const EXTRA_COLORS = [
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-purple-600',
  'from-orange-500 to-red-600',
];

export async function getBlogCategories(): Promise<BlogCategory[]> {
  // DB에서 사용된 카테고리 목록을 가져와 기본 카테고리와 병합
  try {
    const { data } = await getSupabase()
      .from('blog_articles')
      .select('category');
    const dbCategories = [...new Set((data || []).map(r => r.category).filter(Boolean))];
    const result = [...DEFAULT_CATEGORIES];
    let extraIdx = 0;
    for (const cat of dbCategories) {
      if (!result.find(c => c.slug === cat)) {
        result.push({
          id: `custom-${extraIdx}`,
          slug: cat,
          label: cat,
          description: '',
          color: EXTRA_COLORS[extraIdx % EXTRA_COLORS.length],
          icon: 'document',
          sortOrder: DEFAULT_CATEGORIES.length + extraIdx,
        });
        extraIdx++;
      }
    }
    return result;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export async function saveBlogCategory(_cat: {
  slug: string;
  label: string;
  description?: string;
  color?: string;
}): Promise<string> {
  // 카테고리는 blog_articles의 category 컬럼으로 자동 생성됨
  // 별도 저장 불필요 - 첫 포스트 게시 시 자동으로 카테고리가 됨
  return _cat.slug;
}

export async function deleteBlogCategory(_id: string): Promise<void> {
  // 카테고리 삭제는 해당 카테고리의 포스트가 없으면 자동으로 사라짐
}
