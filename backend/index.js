// const express = require("express");
// const cors = require("cors");
// require('dotenv').config();

// const { supabase } = require('./config/supabase');
// const connectDB = require('./config/mongodb');
// const userRoutes = require('./routes/userRoutes');
// const paperRoutes = require('./routes/paperRoutes');
// const libraryRoutes = require('./routes/libraryRoutes');
// const userPapersRoutes = require('./routes/userPapersRoutes');
// const authRoutes = require('./routes/authRoutes');
// const followRoutes = require('./routes/followRoutes');
// const notificationRoutes = require('./routes/notificationRoutes');
// const annotationRoutes = require('./routes/annotation.route');

// const https = require('https');
// const http = require('http');
// const { URL } = require('url');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// connectDB();

// const autocompleteRoute = require("./routes/autocompleteRoute");
// const paperSearchRoute = require("./routes/papersearch.route");
// const paperDetailsRoute = require("./routes/paperdetails.route");
// const paperCitationsRoute = require("./routes/paper-citations.route");
// const paperReferencesRoute = require("./routes/paper-references.route");
// const relatedPapersRoute = require("./routes/related-papers.route");
// const citationRoutes = require("./routes/citation.route");
// const libraryBibtexRoute = require('./routes/libraryBibtex.route');
// const allPaperBibtexRoute = require('./routes/all-paper-bibtex-route');
// const paperAiRoutes = require("./routes/paperAi.route");
// const authorAutocompleteRoute = require('./routes/authorAutocomplete.route');

// // Root route
// app.get("/", (req, res) => {
//   res.json({ 
//     message: "Novara Backend API is running!",
//     version: "1.0.0",
//     endpoints: {
//       users: "/api/users",
//       papers: "/api/papers",
//       libraries: "/api/libraries",
//       userPapers: "/api/user/papers"
//     }
//   });
// });

// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/libraries', libraryRoutes);
// app.use('/api/user/papers', userPapersRoutes);

// // Autocomplete routes
// app.use("/api/autocomplete", autocompleteRoute);
// app.use('/api/author-autocomplete', authorAutocompleteRoute);

// // Paper routes 
// app.use("/api/papers", paperSearchRoute);           
// app.use("/api/papers", paperRoutes);                
// app.use("/api/papers", paperCitationsRoute);       
// app.use("/api/papers", paperReferencesRoute);       
// app.use("/api/papers", relatedPapersRoute);         
// app.use("/api/papers", paperDetailsRoute);          

// // Citation generation
// app.use('/api/citations', citationRoutes);

// // Paper AI
// app.use("/api/paper-ai", paperAiRoutes);

// // Bibtex routes
// app.use('/api/library-bibtex', libraryBibtexRoute);
// app.use('/api/all-library-bibtex', allPaperBibtexRoute);

// app.use('/api/users', followRoutes);
// app.use('/api/notifications', notificationRoutes);

// app.use('/api/annotations', annotationRoutes);

// /* ─────────────────────────────────────────────────────────────
//    PDF URL normaliser
// ───────────────────────────────────────────────────────────── */
// const normalisePdfUrl = (url) => {
//   const arxivMatch = url.match(/arxiv\.org\/(?:abs|pdf)\/([0-9]{4}\.[0-9]+(?:v[0-9]+)?)/i);
//   if (arxivMatch) {
//     return `https://export.arxiv.org/pdf/${arxivMatch[1]}`;
//   }

//   const pmcMatch = url.match(/ncbi\.nlm\.nih\.gov\/pmc\/articles\/(PMC[0-9]+)/i);
//   if (pmcMatch) {
//     return `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcMatch[1]}/pdf/`;
//   }

//   const europePmcMatch = url.match(/europepmc\.org\/articles\/(PMC[0-9]+)/i);
//   if (europePmcMatch) {
//     return `https://europepmc.org/articles/${europePmcMatch[1]}/pdf/render`;
//   }

//   if (url.includes('semanticscholar.org')) {
//     return url;
//   }

//   const aclMatch = url.match(/aclanthology\.org\/([^\s/?]+?)(?:\.pdf)?$/i);
//   if (aclMatch && !url.endsWith('.pdf')) {
//     return `https://aclanthology.org/${aclMatch[1]}.pdf`;
//   }

//   const springerArticleMatch = url.match(/link\.springer\.com\/article\/(10\.[0-9]+\/.+)/i);
//   if (springerArticleMatch) {
//     return `https://link.springer.com/content/pdf/${springerArticleMatch[1]}.pdf`;
//   }

//   if (url.includes('researchgate.net')) return null;
//   if (url.includes('sciencedirect.com') || url.includes('elsevier.com')) return null;
//   if (url.includes('ieeexplore.ieee.org')) return null;
//   if (url.includes('onlinelibrary.wiley.com')) return null;

//   return url;
// };

// /* ─────────────────────────────────────────────────────────────
//    Internal fetch helper — follows up to 5 redirects
// ───────────────────────────────────────────────────────────── */
// const fetchWithRedirects = (url, options, res, depth = 0) => {
//   if (depth > 5) {
//     if (!res.headersSent) res.status(508).json({ error: 'Too many redirects', url });
//     return;
//   }

//   let parsedUrl;
//   try {
//     parsedUrl = new URL(url);
//   } catch (e) {
//     if (!res.headersSent) res.status(400).json({ error: 'Invalid URL', url });
//     return;
//   }

//   const protocol = parsedUrl.protocol === 'https:' ? https : http;

//   const request = protocol.get(url, options, (proxyRes) => {
//     console.log(`[PDF Proxy] Status: ${proxyRes.statusCode}, Content-Type: ${proxyRes.headers['content-type']}, URL: ${url}`);

//     if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode)) {
//       let redirectUrl = proxyRes.headers['location'];
//       if (redirectUrl) {
//         if (redirectUrl.startsWith('/')) {
//           redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
//         }
//         console.log(`[PDF Proxy] Redirect (${proxyRes.statusCode}) -> ${redirectUrl}`);
//         proxyRes.resume();
//         const normalisedRedirect = normalisePdfUrl(redirectUrl) || redirectUrl;
//         return fetchWithRedirects(normalisedRedirect, options, res, depth + 1);
//       }
//     }

//     if (proxyRes.statusCode !== 200) {
//       console.error(`[PDF Proxy] Upstream ${proxyRes.statusCode} for: ${url}`);
//       if (!res.headersSent) {
//         return res.status(proxyRes.statusCode).json({
//           error: `Upstream returned ${proxyRes.statusCode}`,
//           url,
//         });
//       }
//       return;
//     }

//     const contentType = proxyRes.headers['content-type'] || '';
//     if (
//       !contentType.includes('pdf') &&
//       !contentType.includes('octet-stream') &&
//       !contentType.includes('binary')
//     ) {
//       console.error(`[PDF Proxy] Not a PDF. Content-Type: "${contentType}", URL: ${url}`);
//       if (!res.headersSent) {
//         proxyRes.resume();
//         return res.status(400).json({
//           error: `URL did not return a PDF (Content-Type: ${contentType})`,
//           url,
//         });
//       }
//       return;
//     }

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Cache-Control', 'public, max-age=3600');
//     if (proxyRes.headers['content-length']) {
//       res.setHeader('Content-Length', proxyRes.headers['content-length']);
//     }

//     proxyRes.pipe(res);

//     proxyRes.on('error', (err) => {
//       console.error(`[PDF Proxy] Stream error: ${err.message}`);
//       if (!res.headersSent) res.status(500).json({ error: err.message });
//     });
//   });

//   request.on('error', (err) => {
//     console.error(`[PDF Proxy] Request error for ${url}: ${err.message}`);
//     if (!res.headersSent) res.status(500).json({ error: err.message, url });
//   });

//   request.setTimeout(30000, () => {
//     request.destroy();
//     console.error(`[PDF Proxy] Timeout for ${url}`);
//     if (!res.headersSent) res.status(504).json({ error: 'PDF fetch timed out', url });
//   });
// };

// // PDF Proxy - must be BEFORE the 404 handler
// app.get('/api/pdf-proxy', (req, res) => {
//   const { url } = req.query;
//   if (!url) return res.status(400).json({ error: 'URL parameter is required' });

//   console.log(`[PDF Proxy] Incoming request for: ${url}`);

//   const fetchUrl = normalisePdfUrl(url);

//   if (fetchUrl === null) {
//     console.warn(`[PDF Proxy] Blocked source: ${url}`);
//     return res.status(403).json({
//       error: 'This publisher does not allow direct PDF access. Please visit the publisher website.',
//       url,
//     });
//   }

//   if (fetchUrl !== url) {
//     console.log(`[PDF Proxy] Normalised URL: ${url} -> ${fetchUrl}`);
//   }

//   const options = {
//     headers: {
//       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//       'Accept': 'application/pdf,*/*',
//       'Accept-Language': 'en-US,en;q=0.9',
//       'Accept-Encoding': 'identity',
//     },
//     rejectUnauthorized: false,
//   };

//   fetchWithRedirects(fetchUrl, options, res);
// });

// // 404 handler - must come after all routes
// app.use((req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// // Error handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ error: 'Something went wrong!' });
// });

// const PORT = process.env.PORT || 5000;

// const server = http.createServer(app);

// const io = require('socket.io')(server, {
//   cors: {
//     origin: '*',
//     methods: ['GET', 'POST', 'PUT', 'DELETE']
//   }
// });

// // ─── THIS IS THE FIX: exposes io to all controllers via req.app.get('io') ───
// app.set('io', io);

// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

//   socket.on('joinPaper', ({ paperId }) => {
//     socket.join(paperId);
//     console.log(`[Socket] ${socket.id} joined room: ${paperId}`);
//   });

//   // Kept for safety — but controller now handles all broadcasts directly
//   socket.on('annotationChanged', ({ paperId, annotation }) => {
//     socket.to(paperId).emit('annotationUpdate', annotation); // socket.to = exclude sender
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// server.listen(PORT, () => {
//   console.log(`Server running at: http://localhost:${PORT}`);
//   console.log(`Available endpoints:`);
//   console.log(`  - Auth: http://localhost:${PORT}/api/auth`);
//   console.log(`  - Users: http://localhost:${PORT}/api/users`);
//   console.log(`  - Papers: http://localhost:${PORT}/api/papers`);
//   console.log(`  - Libraries: http://localhost:${PORT}/api/libraries`);
//   console.log(`  - User Papers: http://localhost:${PORT}/api/user/papers`);
//   console.log(`  - Annotations: http://localhost:${PORT}/api/annotations`);
//   console.log(`  - PDF Proxy: http://localhost:${PORT}/api/pdf-proxy`);
// });



const express = require("express");
const cors = require("cors");
require('dotenv').config();

const { supabase } = require('./config/supabase');
const connectDB = require('./config/mongodb');
const userRoutes = require('./routes/userRoutes');
const paperRoutes = require('./routes/paperRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const userPapersRoutes = require('./routes/userPapersRoutes');
const authRoutes = require('./routes/authRoutes');
const followRoutes = require('./routes/followRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const annotationRoutes = require('./routes/annotation.route');
const profilePicturesRoute = require('./routes/profilePictures.route');

const https = require('https');
const http = require('http');
const { URL } = require('url');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
connectDB();

const autocompleteRoute = require("./routes/autocompleteRoute");
const paperSearchRoute = require("./routes/papersearch.route");
const paperDetailsRoute = require("./routes/paperdetails.route");
const paperCitationsRoute = require("./routes/paper-citations.route");
const paperReferencesRoute = require("./routes/paper-references.route");
const relatedPapersRoute = require("./routes/related-papers.route");
const citationRoutes = require("./routes/citation.route");
const libraryBibtexRoute = require('./routes/libraryBibtex.route');
const allPaperBibtexRoute = require('./routes/all-paper-bibtex-route');
const paperAiRoutes = require("./routes/paperAi.route");
const authorAutocompleteRoute = require('./routes/authorAutocomplete.route');

// Root route
app.get("/", (req, res) => {
  res.json({ 
    message: "Novara Backend API is running!",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      papers: "/api/papers",
      libraries: "/api/libraries",
      userPapers: "/api/user/papers"
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/libraries', libraryRoutes);
app.use('/api/user/papers', userPapersRoutes);

// Autocomplete routes
app.use("/api/autocomplete", autocompleteRoute);
app.use('/api/author-autocomplete', authorAutocompleteRoute);

// Paper routes 
app.use("/api/papers", paperSearchRoute);           
app.use("/api/papers", paperRoutes);                
app.use("/api/papers", paperCitationsRoute);       
app.use("/api/papers", paperReferencesRoute);       
app.use("/api/papers", relatedPapersRoute);         
app.use("/api/papers", paperDetailsRoute);          

// Citation generation
app.use('/api/citations', citationRoutes);

// Paper AI
app.use("/api/paper-ai", paperAiRoutes);

// Bibtex routes
app.use('/api/library-bibtex', libraryBibtexRoute);
app.use('/api/all-library-bibtex', allPaperBibtexRoute);

app.use('/api/users', followRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/annotations', annotationRoutes);
app.use('/api/users', profilePicturesRoute);

/* ─────────────────────────────────────────────────────────────
   PDF URL normaliser
───────────────────────────────────────────────────────────── */
const normalisePdfUrl = (url) => {
  const arxivMatch = url.match(/arxiv\.org\/(?:abs|pdf)\/([0-9]{4}\.[0-9]+(?:v[0-9]+)?)/i);
  if (arxivMatch) {
    return `https://export.arxiv.org/pdf/${arxivMatch[1]}`;
  }

  const pmcMatch = url.match(/ncbi\.nlm\.nih\.gov\/pmc\/articles\/(PMC[0-9]+)/i);
  if (pmcMatch) {
    return `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcMatch[1]}/pdf/`;
  }

  const europePmcMatch = url.match(/europepmc\.org\/articles\/(PMC[0-9]+)/i);
  if (europePmcMatch) {
    return `https://europepmc.org/articles/${europePmcMatch[1]}/pdf/render`;
  }

  if (url.includes('semanticscholar.org')) {
    return url;
  }

  const aclMatch = url.match(/aclanthology\.org\/([^\s/?]+?)(?:\.pdf)?$/i);
  if (aclMatch && !url.endsWith('.pdf')) {
    return `https://aclanthology.org/${aclMatch[1]}.pdf`;
  }

  const springerArticleMatch = url.match(/link\.springer\.com\/article\/(10\.[0-9]+\/.+)/i);
  if (springerArticleMatch) {
    return `https://link.springer.com/content/pdf/${springerArticleMatch[1]}.pdf`;
  }

  if (url.includes('researchgate.net')) return null;
  if (url.includes('sciencedirect.com') || url.includes('elsevier.com')) return null;
  if (url.includes('ieeexplore.ieee.org')) return null;
  if (url.includes('onlinelibrary.wiley.com')) return null;

  return url;
};

/* ─────────────────────────────────────────────────────────────
   Internal fetch helper — follows up to 5 redirects
───────────────────────────────────────────────────────────── */
const fetchWithRedirects = (url, options, res, depth = 0) => {
  if (depth > 5) {
    if (!res.headersSent) res.status(508).json({ error: 'Too many redirects', url });
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    if (!res.headersSent) res.status(400).json({ error: 'Invalid URL', url });
    return;
  }

  const protocol = parsedUrl.protocol === 'https:' ? https : http;

  const request = protocol.get(url, options, (proxyRes) => {
    console.log(`[PDF Proxy] Status: ${proxyRes.statusCode}, Content-Type: ${proxyRes.headers['content-type']}, URL: ${url}`);

    if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode)) {
      let redirectUrl = proxyRes.headers['location'];
      if (redirectUrl) {
        if (redirectUrl.startsWith('/')) {
          redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
        }
        console.log(`[PDF Proxy] Redirect (${proxyRes.statusCode}) -> ${redirectUrl}`);
        proxyRes.resume();
        const normalisedRedirect = normalisePdfUrl(redirectUrl) || redirectUrl;
        return fetchWithRedirects(normalisedRedirect, options, res, depth + 1);
      }
    }

    if (proxyRes.statusCode !== 200) {
      console.error(`[PDF Proxy] Upstream ${proxyRes.statusCode} for: ${url}`);
      if (!res.headersSent) {
        return res.status(proxyRes.statusCode).json({
          error: `Upstream returned ${proxyRes.statusCode}`,
          url,
        });
      }
      return;
    }

    const contentType = proxyRes.headers['content-type'] || '';
    if (
      !contentType.includes('pdf') &&
      !contentType.includes('octet-stream') &&
      !contentType.includes('binary')
    ) {
      console.error(`[PDF Proxy] Not a PDF. Content-Type: "${contentType}", URL: ${url}`);
      if (!res.headersSent) {
        proxyRes.resume();
        return res.status(400).json({
          error: `URL did not return a PDF (Content-Type: ${contentType})`,
          url,
        });
      }
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (proxyRes.headers['content-length']) {
      res.setHeader('Content-Length', proxyRes.headers['content-length']);
    }

    proxyRes.pipe(res);

    proxyRes.on('error', (err) => {
      console.error(`[PDF Proxy] Stream error: ${err.message}`);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    });
  });

  request.on('error', (err) => {
    console.error(`[PDF Proxy] Request error for ${url}: ${err.message}`);
    if (!res.headersSent) res.status(500).json({ error: err.message, url });
  });

  request.setTimeout(30000, () => {
    request.destroy();
    console.error(`[PDF Proxy] Timeout for ${url}`);
    if (!res.headersSent) res.status(504).json({ error: 'PDF fetch timed out', url });
  });
};

// PDF Proxy - must be BEFORE the 404 handler
app.get('/api/pdf-proxy', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL parameter is required' });

  console.log(`[PDF Proxy] Incoming request for: ${url}`);

  const fetchUrl = normalisePdfUrl(url);

  if (fetchUrl === null) {
    console.warn(`[PDF Proxy] Blocked source: ${url}`);
    return res.status(403).json({
      error: 'This publisher does not allow direct PDF access. Please visit the publisher website.',
      url,
    });
  }

  if (fetchUrl !== url) {
    console.log(`[PDF Proxy] Normalised URL: ${url} -> ${fetchUrl}`);
  }

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/pdf,*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
    },
    rejectUnauthorized: false,
  };

  fetchWithRedirects(fetchUrl, options, res);
});

// 404 handler - must come after all routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// ─── THIS IS THE FIX: exposes io to all controllers via req.app.get('io') ───
app.set('io', io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinPaper', ({ paperId }) => {
    socket.join(paperId);
    console.log(`[Socket] ${socket.id} joined room: ${paperId}`);
  });

  // Kept for safety — but controller now handles all broadcasts directly
  socket.on('annotationChanged', ({ paperId, annotation }) => {
    socket.to(paperId).emit('annotationUpdate', annotation); // socket.to = exclude sender
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  - Auth: http://localhost:${PORT}/api/auth`);
  console.log(`  - Users: http://localhost:${PORT}/api/users`);
  console.log(`  - Papers: http://localhost:${PORT}/api/papers`);
  console.log(`  - Libraries: http://localhost:${PORT}/api/libraries`);
  console.log(`  - User Papers: http://localhost:${PORT}/api/user/papers`);
  console.log(`  - Annotations: http://localhost:${PORT}/api/annotations`);
  console.log(`  - PDF Proxy: http://localhost:${PORT}/api/pdf-proxy`);
});