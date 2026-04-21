import { supabase } from '../lib/supabaseClient';

/**
 * Primary search: PostgreSQL Full-Text Search using websearch_to_tsquery.
 *
 * - `type: 'websearch'` accepts natural input ("john 2024", -word, "exact phrase")
 * - No manual query formatting needed — Postgres handles it
 * - Weighted FTS vector (owner_name=A, doc_type=B, content=C) via DB trigger
 * - Falls back to trigram fuzzy search when FTS returns zero results
 *
 * @param query   - Raw user input string
 * @param groupId - Optional family group UUID to scope results
 */
export async function searchDocuments(query: string, groupId?: string): Promise<any[]> {
  if (!query.trim()) return [];

  // ── 1. FTS search (websearch type — best UX, handles AND/OR/quotes/minus) ──
  let ftsQuery = supabase
    .from('documents')
    .select('*')
    .textSearch('fts_vector', query, {
      type: 'websearch',
      config: 'english',
    });

  if (groupId) {
    ftsQuery = ftsQuery.eq('group_id', groupId);
  }

  const { data: ftsData, error: ftsError } = await ftsQuery;

  if (ftsError) {
    console.error('[FTS] Search error:', ftsError.message);
    // Don't throw — fall through to fuzzy
  }

  if (ftsData && ftsData.length > 0) {
    return ftsData;
  }

  // ── 2. Fuzzy fallback via RPC (pg_trgm trigram similarity) ───────────────
  // Catches typos and partial matches when FTS finds nothing.
  // Requires: CREATE EXTENSION IF NOT EXISTS pg_trgm;
  // And the `fuzzy_search_documents` RPC defined in Supabase SQL editor.
  try {
    const { data: fuzzyData, error: fuzzyError } = await supabase.rpc(
      'fuzzy_search_documents',
      { q: query, group_id_filter: groupId || null }
    );

    if (fuzzyError) {
      console.warn('[Fuzzy] RPC not available, falling back to ilike:', fuzzyError.message);
      // Last-resort substring match
      let ilikeQuery = supabase
        .from('documents')
        .select('*')
        .or(`owner_name.ilike.%${query}%,doc_type.ilike.%${query}%`);
      if (groupId) ilikeQuery = ilikeQuery.eq('group_id', groupId);
      const { data: ilikeData } = await ilikeQuery;
      return ilikeData || [];
    }

    return fuzzyData || [];
  } catch {
    return [];
  }
}
