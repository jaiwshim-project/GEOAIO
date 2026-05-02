// Supabase에 색인 snapshot을 저장·조회. 미구성 시 in-memory mock으로 대체.

import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockSnapshot } from './gsc-client';

// 쓰기용 service-role 클라이언트 (RLS 우회). 읽기는 anon 클라이언트 그대로 사용.
function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export interface IndexingSnapshot {
  id?: string;
  site_id: string;
  site_url?: string;
  taken_at: string;
  total_pages: number;
  indexed: number;
  not_indexed: number;
  reasons: Record<string, number>;
  by_category: Record<string, { total: number; indexed: number }>;
  raw?: unknown;
  is_mock?: boolean;
}

export async function saveSnapshot(snap: Omit<IndexingSnapshot, 'id'>): Promise<{ ok: boolean; id?: string; error?: string }> {
  // service_role로 INSERT (RLS 우회). 없으면 anon으로 폴백 (RLS 정책에 INSERT 허용 시에만 성공).
  const writer = getServiceRoleClient() || supabase;
  if (!writer) return { ok: false, error: 'supabase not configured' };
  const { data, error } = await writer
    .from('indexing_snapshots')
    .insert(snap)
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id };
}

export async function getLatestSnapshot(siteId: string): Promise<IndexingSnapshot | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ...mockSnapshot(siteId) } as IndexingSnapshot;
  }
  const { data, error } = await supabase
    .from('indexing_snapshots')
    .select('*')
    .eq('site_id', siteId)
    .order('taken_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[indexing-store] getLatest error', error);
    return null;
  }
  return data as IndexingSnapshot | null;
}

export interface SnapshotHistoryPoint {
  date: string;
  indexed: number;
  total: number;
  not_indexed: number;
}

export async function getSnapshotHistory(siteId: string, days: number = 60): Promise<SnapshotHistoryPoint[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return mockSnapshot(siteId).history.map(h => ({ ...h, not_indexed: h.total - h.indexed }));
  }
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data, error } = await supabase
    .from('indexing_snapshots')
    .select('taken_at, indexed, total_pages')
    .eq('site_id', siteId)
    .gte('taken_at', cutoff.toISOString())
    .order('taken_at', { ascending: true });
  if (error || !data) return [];
  return data.map(r => ({
    date: r.taken_at.slice(0, 10),
    indexed: r.indexed,
    total: r.total_pages,
    not_indexed: r.total_pages - r.indexed,
  }));
}
