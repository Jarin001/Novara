const fetch = require('node-fetch'); 

const SEMANTIC_FIELDS =
  'title,year,citationCount,fieldsOfStudy,authors,venue,isOpenAccess,openAccessPdf,externalIds';

/**
 * Preview paper details (NO DB write)
 */
exports.fetchPaperPreview = async (req, res) => {
  try {
    const { paperId } = req.body;

    console.log('Received paperId:', paperId); // ADD THIS

    if (!paperId) {
      return res.status(400).json({ message: 'paperId is required' });
    }

    const url = `https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(
      paperId
    )}?fields=${SEMANTIC_FIELDS}`;

    console.log('Fetching URL:', url); // ADD THIS

    const response = await fetch(url, {
      headers: {
        // 'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY
      }
    });

    console.log('Response status:', response.status); // ADD THIS

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText); // ADD THIS
      return res.status(404).json({ message: 'Paper not found' });
    }

    const data = await response.json();

    res.json({
      s2_paper_id: data.paperId,
      title: data.title,
      published_year: data.year,
      citation_count: data.citationCount,
      fields_of_study: data.fieldsOfStudy || [],
      authors: data.authors?.map(a => a.name) || [],
      venue: data.venue || null,
      is_open_access: data.isOpenAccess || false,
      pdf_url: data.openAccessPdf?.url || null,
      doi: data.externalIds?.DOI || null,
      arxiv_id: data.externalIds?.ArXiv || null
    });
  } catch (err) {
    console.error('Full error:', err); // MODIFY THIS
    res.status(500).json({ message: 'Failed to fetch paper preview' });
  }
};

/**
 * Save paper (minimal DB fields only)
 */
exports.savePaper = async (req, res) => {
  try {
    const authId = req.user.id; // This is the auth_id
    const supabase = req.supabase;

    console.log('Auth ID:', authId);

    const {
      s2_paper_id,
      title,
      published_year,
      citation_count,
      fields_of_study
    } = req.body;

    if (!s2_paper_id || !title) {
      return res.status(400).json({ message: 'Invalid paper data' });
    }

    // STEP 1: Get the actual user ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return res.status(404).json({ message: 'User not found in database' });
    }

    const userId = userData.id; // This is the actual user ID
    console.log('User ID from users table:', userId);

    // STEP 2: Upsert paper
    const { data: paper, error } = await supabase
      .from('papers')
      .upsert(
        {
          s2_paper_id,
          title,
          published_date: published_year ? `${published_year}-01-01` : null,
          citation_count,
          fields_of_study
        },
        { onConflict: 's2_paper_id' }
      )
      .select()
      .single();

    if (error) throw error;

    console.log('Paper saved:', paper.id);

    // STEP 3: Link paper to user
    const { error: linkError } = await supabase
      .from('user_papers')
      .insert({
        user_id: userId, // Use the ID from users table
        paper_id: paper.id
      });

    if (linkError) throw linkError;

    res.json({ message: 'Paper saved successfully' });
  } catch (err) {
    console.error('FULL ERROR DETAILS:', err);
    res.status(500).json({ message: 'Failed to save paper' });
  }
};