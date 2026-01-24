const { createClient } = require('@supabase/supabase-js');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Auth middleware: No bearer token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Auth middleware: Token received, length:', token.length);

    // Create Supabase client with the user's token
    const supabase = createClient(
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

    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Auth middleware: Token validation error:', error.message);
      return res.status(401).json({ error: 'Invalid or expired token', details: error.message });
    }
    
    if (!user) {
      console.error('Auth middleware: No user found for token');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log('Auth middleware: User authenticated:', user.email);
    req.user = user;  
    req.supabase = supabase;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
};