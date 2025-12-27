const { createClient } = require('@supabase/supabase-js');

const authenticate = async (req, res, next) => {
  try {
    // Get the token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No token provided. Please include Authorization header with Bearer token.' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Create a Supabase client with the user's token
    const supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Verify the token
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      });
    }

    // Attach user and authenticated client to request
    req.user = user;
    req.supabase = supabaseClient;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = { authenticate };