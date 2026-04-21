-- ============================================================
-- Family Archive Vault — Search Migration (Fixed)
-- fts_vector is already a GENERATED column — skip ADD COLUMN
-- and UPDATE. Only run what is still needed.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Enable trigram extension (needed for fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN index on the existing generated fts_vector column
CREATE INDEX IF NOT EXISTS idx_documents_fts
  ON documents USING GIN (fts_vector);

-- Trigram index on owner_name for fast similarity queries
CREATE INDEX IF NOT EXISTS idx_documents_owner_trgm
  ON documents USING GIN (owner_name gin_trgm_ops);

-- Trigram index on doc_type
CREATE INDEX IF NOT EXISTS idx_documents_type_trgm
  ON documents USING GIN (doc_type gin_trgm_ops);

-- 3. Fuzzy search RPC
--    Fallback when FTS returns zero results.
--    Ranks by trigram similarity on owner_name + doc_type.
CREATE OR REPLACE FUNCTION fuzzy_search_documents(
  q text,
  group_id_filter uuid DEFAULT NULL
)
RETURNS SETOF documents AS $$
  SELECT *
  FROM documents
  WHERE
    (group_id_filter IS NULL OR group_id = group_id_filter)
    AND (
      similarity(owner_name, q) > 0.15
      OR similarity(doc_type, q) > 0.15
      OR raw_content_vector ILIKE '%' || q || '%'
    )
  ORDER BY
    GREATEST(
      similarity(owner_name, q),
      similarity(doc_type, q)
    ) DESC
  LIMIT 20;
$$ LANGUAGE sql STABLE;

-- 4. Ranked FTS search RPC
--    Returns documents ordered by ts_rank relevance score.
--    Uses SETOF documents to avoid column-order mismatch errors.
CREATE OR REPLACE FUNCTION ranked_search_documents(
  q text,
  group_id_filter uuid DEFAULT NULL
)
RETURNS SETOF documents AS $$
  SELECT d.*
  FROM documents d
  WHERE
    (group_id_filter IS NULL OR d.group_id = group_id_filter)
    AND d.fts_vector @@ websearch_to_tsquery('english', q)
  ORDER BY
    ts_rank(d.fts_vector, websearch_to_tsquery('english', q)) DESC
  LIMIT 50;
$$ LANGUAGE sql STABLE;
