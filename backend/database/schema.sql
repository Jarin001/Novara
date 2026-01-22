-- 1. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    profile_picture_url TEXT,
    affiliation VARCHAR(255),
    research_interests TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);

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
    year INTEGER,
    citation_count INTEGER DEFAULT 0,
    fields_of_study TEXT[],
    venue TEXT
);

CREATE INDEX idx_papers_s2_paper_id ON papers(s2_paper_id);
CREATE INDEX idx_papers_title ON papers USING gin(to_tsvector('english', title));

-- 3. AUTHORS TABLE
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    affiliation TEXT
);

CREATE INDEX idx_authors_name ON authors(name);

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

-- 6. AUTHOR_PAPERS TABLE
CREATE TABLE author_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    UNIQUE(author_id, paper_id)
);

CREATE INDEX idx_author_papers_author_id ON author_papers(author_id);
CREATE INDEX idx_author_papers_paper_id ON author_papers(paper_id);

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

-- Library paper count trigger
CREATE OR REPLACE FUNCTION update_library_paper_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE libraries
        SET paper_count = paper_count + 1,
            updated_at = NOW()
        WHERE id = NEW.library_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE libraries
        SET paper_count = GREATEST(paper_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.library_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER library_paper_count_trigger
    AFTER INSERT OR DELETE ON library_papers
    FOR EACH ROW
    EXECUTE FUNCTION update_library_paper_count();