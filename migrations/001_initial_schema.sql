-- --------------------------------------------------------
-- Up Migration: Initial Schema Setup (Profiles, Groups, Documents, Search Index)
-- --------------------------------------------------------

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Table for Family Member Profiles (Linked to Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    family_group_id UUID, -- Will be set after group creation
    role TEXT CHECK (role IN ('Admin', 'Viewer', 'Contributor')) DEFAULT 'Viewer',
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Document Groups (Families)
CREATE TABLE document_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- e.g., "Smith Family Records"
    creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add FK back to profiles for family_group_id
ALTER TABLE profiles ADD CONSTRAINT fk_family_group FOREIGN KEY (family_group_id) REFERENCES document_groups(id);

-- Main Documents Table
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES document_groups(id) ON DELETE CASCADE,
    owner_name TEXT NOT NULL, -- The family member this belongs to
    doc_type TEXT NOT NULL, -- e.g., Birth Certificate, Tax Form, Passport
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT UNIQUE NOT NULL, -- Pointer/URL in Supabase Storage
    raw_content_vector TEXT, -- Stores cleaned, indexed text content for search
    metadata_json JSONB DEFAULT '{}'::jsonb, -- Flexible storage for dates, locations, etc.
    thumbnail_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Full-Text Search Vector Column
ALTER TABLE documents ADD COLUMN fts_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', raw_content_vector || ' ' || owner_name || ' ' || doc_type)) STORED;

-- Indexing for Search and Performance
CREATE INDEX idx_documents_group ON documents (group_id);
CREATE INDEX idx_documents_fts ON documents USING GIN (fts_vector);
CREATE INDEX idx_profiles_family ON profiles (family_group_id);

-- Comments
COMMENT ON TABLE profiles IS 'Stores family member details linked to Supabase Auth.';
COMMENT ON TABLE document_groups IS 'Organizational units for different family branches.';
COMMENT ON TABLE documents IS 'Central repository for document metadata and searchable content.';

-- --------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can see themselves and anyone in the same family group
CREATE POLICY "View own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "View family members" ON profiles FOR SELECT USING (
  family_group_id IS NOT NULL AND 
  family_group_id IN (SELECT p.family_group_id FROM profiles p WHERE p.id = auth.uid())
);

-- DOCUMENT GROUPS: Users can view groups they are part of
CREATE POLICY "View family groups" ON document_groups FOR SELECT USING (
  id IN (SELECT p.family_group_id FROM profiles p WHERE p.id = auth.uid())
);

-- DOCUMENTS: Access restricted to members of the associated group
CREATE POLICY "View group documents" ON documents FOR SELECT USING (
  group_id IN (SELECT p.family_group_id FROM profiles p WHERE p.id = auth.uid())
);

CREATE POLICY "Insert group documents" ON documents FOR INSERT WITH CHECK (
  group_id IN (SELECT p.family_group_id FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('Admin', 'Contributor'))
);

CREATE POLICY "Manage own group documents" ON documents FOR ALL USING (
  group_id IN (SELECT p.family_group_id FROM profiles p WHERE p.id = auth.uid() AND p.role = 'Admin')
);