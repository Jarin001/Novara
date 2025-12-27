-- 1. USERS TABLE
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

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = auth_id);

CREATE POLICY "Users can delete own profile"
    ON users FOR DELETE
    USING (auth.uid() = auth_id);

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PAPERS TABLE
CREATE TABLE papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    s2_paper_id VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    published_date DATE,
    citation_count INTEGER DEFAULT 0,
    fields_of_study TEXT[]
);

CREATE INDEX idx_papers_s2_paper_id ON papers(s2_paper_id);
CREATE INDEX idx_papers_title ON papers USING gin(to_tsvector('english', title));

ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert papers"
    ON papers FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view papers"
    ON papers FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to update papers"
    ON papers FOR UPDATE TO authenticated
    USING (true);

-- 3. AUTHORS TABLE
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    affiliation TEXT
);

CREATE INDEX idx_authors_name ON authors(name);

ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX idx_libraries_created_by ON libraries(created_by_user_id);

ALTER TABLE libraries ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX idx_user_papers_user_id ON user_papers(user_id);
CREATE INDEX idx_user_papers_paper_id ON user_papers(paper_id);

ALTER TABLE user_papers ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX idx_author_papers_author_id ON author_papers(author_id);
CREATE INDEX idx_author_papers_paper_id ON author_papers(paper_id);

ALTER TABLE author_papers ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX idx_library_papers_library_id ON library_papers(library_id);
CREATE INDEX idx_library_papers_paper_id ON library_papers(paper_id);

ALTER TABLE library_papers ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX idx_user_libraries_user_id ON user_libraries(user_id);
CREATE INDEX idx_user_libraries_library_id ON user_libraries(library_id);

ALTER TABLE user_libraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own library memberships"
    ON user_libraries FOR SELECT
    USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_libraries_updated_at
    BEFORE UPDATE ON libraries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. STORAGE POLICIES FOR PROFILE PICTURES
CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

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

CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');