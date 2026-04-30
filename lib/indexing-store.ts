// Supabase에 색인 snapshot을 저장·조회. 미구성 시 in-memory mock으로 대체.

import { supabase, isSupabaseConfigured } from './supabase';
import { mockSnapshot } from './gsc-client';

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
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, error: 'supabase not configured' };
  }
  const { data, error } = await supabase
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
