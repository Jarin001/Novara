CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    profile_picture_url TEXT,
    affiliation VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = auth_id);

CREATE POLICY "Users can delete own profile"
    ON users FOR DELETE
    USING (auth.uid() = auth_id);

-- 2. PAPERS TABLE

CREATE TABLE papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    s2_paper_id VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    doi VARCHAR(255) UNIQUE,
    published_date DATE,
    citation_count INTEGER DEFAULT 0,
    is_open_access BOOLEAN DEFAULT FALSE,
    pdf_url TEXT,
    venue VARCHAR(255),
    fields_of_study TEXT[]
);

-- Indexes
CREATE INDEX idx_papers_s2_paper_id ON papers(s2_paper_id);
CREATE INDEX idx_papers_doi ON papers(doi);
CREATE INDEX idx_papers_title ON papers USING gin(to_tsvector('english', title));

-- Enable RLS
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read papers
CREATE POLICY "Papers are viewable by everyone"
    ON papers FOR SELECT
    USING (true);

-- 3. AUTHORS TABLE

CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    affiliation TEXT
);

-- Index
CREATE INDEX idx_authors_name ON authors(name);

-- Enable RLS
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read authors
CREATE POLICY "Authors are viewable by everyone"
    ON authors FOR SELECT
    USING (true);

-- 4. LIBRARIES TABLE

CREATE TABLE libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    paper_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_libraries_created_by ON libraries(created_by_user_id);

-- Enable RLS
ALTER TABLE libraries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view accessible libraries"
    ON libraries FOR SELECT
    USING (
        created_by_user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
        OR is_public = true
        OR id IN (
            SELECT library_id FROM user_libraries 
            WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY "Users can create libraries"
    ON libraries FOR INSERT
    WITH CHECK (created_by_user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own libraries"
    ON libraries FOR UPDATE
    USING (created_by_user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete own libraries"
    ON libraries FOR DELETE
    USING (created_by_user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));


-- 5. USER_PAPERS TABLE

CREATE TABLE user_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    publication_status VARCHAR(50) CHECK (publication_status IN ('published', 'preprint', 'under_review', 'draft')),
    UNIQUE(user_id, paper_id)
);

-- Indexes
CREATE INDEX idx_user_papers_user_id ON user_papers(user_id);
CREATE INDEX idx_user_papers_paper_id ON user_papers(paper_id);

-- Enable RLS
ALTER TABLE user_papers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own papers"
    ON user_papers FOR SELECT
    USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own papers"
    ON user_papers FOR INSERT
    WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 6. AUTHOR_PAPERS TABLE

CREATE TABLE author_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    UNIQUE(author_id, paper_id)
);

-- Indexes
CREATE INDEX idx_author_papers_author_id ON author_papers(author_id);
CREATE INDEX idx_author_papers_paper_id ON author_papers(paper_id);

-- Enable RLS
ALTER TABLE author_papers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read
CREATE POLICY "Author papers are viewable by everyone"
    ON author_papers FOR SELECT
    USING (true);

-- 7. LIBRARY_PAPERS TABLE

CREATE TABLE library_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    added_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reading_status VARCHAR(50) CHECK (reading_status IN ('unread', 'in_progress', 'read')) DEFAULT 'unread',
    last_read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(library_id, paper_id)
);

-- Indexes
CREATE INDEX idx_library_papers_library_id ON library_papers(library_id);
CREATE INDEX idx_library_papers_paper_id ON library_papers(paper_id);

-- Enable RLS
ALTER TABLE library_papers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view papers in their libraries
CREATE POLICY "Users can view papers in accessible libraries"
    ON library_papers FOR SELECT
    USING (
        library_id IN (
            SELECT id FROM libraries WHERE created_by_user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
        )
        OR library_id IN (
            SELECT library_id FROM user_libraries WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
        )
    );

-- 8. USER_LIBRARIES TABLE

CREATE TABLE user_libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('creator', 'collaborator')),
    invited_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, library_id)
);

-- Indexes
CREATE INDEX idx_user_libraries_user_id ON user_libraries(user_id);
CREATE INDEX idx_user_libraries_library_id ON user_libraries(library_id);

-- Enable RLS
ALTER TABLE user_libraries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their library memberships
CREATE POLICY "Users can view own library memberships"
    ON user_libraries FOR SELECT
    USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 10. STORAGE BUCKET FOR PROFILE PICTURES 

-- Policy 1: Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Anyone can view avatars (public access)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

