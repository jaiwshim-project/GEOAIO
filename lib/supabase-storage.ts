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
  const userId = await getUserId();
  const { data, error } = await getSupabase()
    .from('blog_posts')
    .insert({
      title: post.title,
      content: post.content,
      summary: post.summary || '',
      category: post.category,
      tag: post.tag || '',
      hashtags: post.hashtags || [],
      metadata: post.metadata || {},
      target_keyword: post.targetKeyword || '',
      history_id: post.historyId || '',
      published: true,
      user_id: userId,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
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
  const userId = await getUserId();
  const rows = posts.map(post => ({
    title: post.title,
    content: post.content,
    summary: post.summary || '',
    category: post.category,
    tag: post.tag || '',
    hashtags: post.hashtags || [],
    metadata: post.metadata || {},
    target_keyword: post.targetKeyword || '',
    history_id: post.historyId || '',
    published: true,
    user_id: userId,
  }));
  const { data, error } = await getSupabase()
    .from('blog_posts')
    .insert(rows)
    .select('id');
  if (error) throw error;
  return (data || []).map(row => row.id);
}

export async function getBlogPosts(category?: string): Promise<BlogPost[]> {
  let query = getSupabase()
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.limit(200);
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    summary: row.summary || '',
    category: row.category,
    tag: row.tag || '',
    hashtags: row.hashtags || [],
    metadata: row.metadata || {},
    targetKeyword: row.target_keyword || '',
    historyId: row.history_id || '',
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deleteBlogPost(id: string): Promise<void> {
  const { error } = await getSupabase().from('blog_posts').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleBlogPostPublished(id: string, published: boolean): Promise<void> {
  const { error } = await getSupabase()
    .from('blog_posts')
    .update({ published, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ============================
// 블로그 카테고리 CRUD
// ============================

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const { data, error } = await getSupabase()
    .from('blog_categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    slug: row.slug,
    label: row.label,
    description: row.description || '',
    color: row.color || 'from-gray-500 to-gray-600',
    icon: row.icon || 'document',
    sortOrder: row.sort_order || 0,
  }));
}

export async function saveBlogCategory(cat: {
  slug: string;
  label: string;
  description?: string;
  color?: string;
}): Promise<string> {
  const userId = await getUserId();
  const supabase = getSupabase();

  // 중복 확인
  const { data: existing } = await supabase
    .from('blog_categories')
    .select('id')
    .eq('slug', cat.slug)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    throw new Error(`'${cat.label}' 카테고리가 이미 존재합니다.`);
  }

  const { data, error } = await supabase
    .from('blog_categories')
    .insert({
      slug: cat.slug,
      label: cat.label,
      description: cat.description || '',
      color: cat.color || 'from-gray-500 to-gray-600',
      icon: 'document',
      user_id: userId,
    })
    .select('id')
    .single();
  if (error) throw new Error(`카테고리 추가 실패: ${error.message}`);
  return data.id;
}

export async function deleteBlogCategory(id: string): Promise<void> {
  const { error } = await getSupabase().from('blog_categories').delete().eq('id', id);
  if (error) throw error;
}
