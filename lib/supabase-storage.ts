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
}): Promise<string> {
  try {
    const insertData = {
      title: post.title,
      content: post.content,
      category: post.category,
      tags: JSON.stringify({
        tag: post.tag || '',
        hashtags: post.hashtags || [],
        summary: post.summary || '',
        targetKeyword: post.targetKeyword || '',
        historyId: post.historyId || '',
        metadata: post.metadata || {},
      }),
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
}[]): Promise<string[]> {
  const rows = posts.map(post => ({
    title: post.title,
    content: post.content,
    category: post.category,
    tags: JSON.stringify({
      tag: post.tag || '',
      hashtags: post.hashtags || [],
      summary: post.summary || '',
      targetKeyword: post.targetKeyword || '',
      historyId: post.historyId || '',
      metadata: post.metadata || {},
    }),
  }));
  const { data, error } = await getSupabase()
    .from('blog_articles')
    .insert(rows)
    .select('id');
  if (error) throw error;
  return (data || []).map(row => row.id);
}

export async function getBlogPosts(category?: string): Promise<BlogPost[]> {
  let query = getSupabase()
    .from('blog_articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.limit(200);
  if (error) throw error;
  return (data || []).map(row => {
    const tagsData = typeof row.tags === 'string' ? (() => { try { return JSON.parse(row.tags); } catch { return {}; } })() : (row.tags || {});
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      summary: tagsData.summary || '',
      category: row.category || '',
      tag: tagsData.tag || '',
      hashtags: tagsData.hashtags || [],
      metadata: tagsData.metadata || {},
      targetKeyword: tagsData.targetKeyword || '',
      historyId: tagsData.historyId || '',
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
