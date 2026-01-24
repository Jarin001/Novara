# Data Flow Architecture - ResultsPage Backend Integration

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             ResultsPage.jsx Component                   │  │
│  │                                                          │  │
│  │  • Search Input: "machine learning"                    │  │
│  │  • Filters: dateRange, selectedFields, sortBy          │  │
│  │  • State: results[], totalResults, currentPage         │  │
│  │  • Handlers: openCite, openSave, pagination            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          API Configuration (api.js)                      │  │
│  │  • API_ENDPOINTS.PAPER_SEARCH                           │  │
│  │  • API_ENDPOINTS.AUTOCOMPLETE                           │  │
│  │  • API_ENDPOINTS.CITATIONS                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │ HTTP Requests
                             │ (fetch API)
┌────────────────────────────┼────────────────────────────────────┐
│                            ▼                                    │
│                     BACKEND (Express.js)                       │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              API Routes (index.js)                       │ │
│  │  • app.use('/api/papers', paperSearchRoute)             │ │
│  │  • app.use('/api/autocomplete', autocompleteRoute)      │ │
│  │  • app.use('/api/citations', citationRoutes)           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                            │                                   │
│                            ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Controllers (papersearch.controller.js)                │ │
│  │  • searchPapers(req, res)                               │ │
│  │  • Extracts query parameters                            │ │
│  │  • Calls paperSearchService                             │ │
│  │  • Returns formatted JSON response                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                            │                                   │
│                            ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Services (papersearch.service.js)                      │ │
│  │  • Constructs Semantic Scholar API request             │ │
│  │  • Applies filters (year, fieldsOfStudy, etc)          │ │
│  │  • Formats response data                                │ │
│  │  • Returns: { total, offset, next, data[] }            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                            │                                   │
│                            ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  External API (Semantic Scholar)                        │ │
│  │  • https://api.semanticscholar.org/graph/v1/paper/search
│  │  • Requires: x-api-key header                           │ │
│  │  • Parameters: query, limit, offset, fields, year, etc  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

### 1. USER SEARCH REQUEST

**Location**: ResultsPage.jsx (line ~114-173)

```javascript
// User searches for "machine learning" with filters
const params = new URLSearchParams();
params.append('query', 'machine learning');
params.append('limit', 100);
params.append('offset', 0);
params.append('sortByCitations', 'true');  // Optional
params.append('yearFrom', 2020);           // Optional
params.append('yearTo', 2024);             // Optional
params.append('fieldsOfStudy', 'Computer Science,AI');  // Optional

// Send to backend
fetch(`${API_ENDPOINTS.PAPER_SEARCH}?${params.toString()}`)
```

### 2. HTTP REQUEST SENT

```
GET /api/papers?query=machine+learning&limit=100&offset=0&sortByCitations=true&yearFrom=2020&yearTo=2024&fieldsOfStudy=Computer+Science%2CAI HTTP/1.1
Host: localhost:5000
Content-Type: application/json
```

### 3. BACKEND ROUTING & CONTROLLER

**Location**: backend/routes/papersearch.route.js (line 6)

```javascript
router.get("/", paperSearchController.searchPapers);
// Handles: GET /api/papers
```

**Location**: backend/controllers/papersearch.controller.js (line 3-32)

```javascript
exports.searchPapers = async (req, res) => {
  // Extract query parameters
  const { query, offset = 0, limit = 10, sortByCitations = "false", fieldsOfStudy, yearFrom, yearTo } = req.query;
  
  // Validate required parameter
  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }
  
  // Call service with parameters
  const result = await paperSearchService.searchPapers({
    query,
    offset: Number(offset),
    limit: Number(limit),
    sortByCitations: sortByCitations === "true",
    fieldsOfStudy,
    yearFrom,
    yearTo
  });
  
  res.json(result);
}
```

### 4. SERVICE PROCESSING

**Location**: backend/services/papersearch.service.js (line 6-68)

```javascript
exports.searchPapers = async ({
  query,
  offset,
  limit,
  sortByCitations,
  fieldsOfStudy,
  yearFrom,
  yearTo
}) => {
  // 1. Build request parameters for Semantic Scholar
  const params = {
    query,
    offset,
    limit: Math.min(limit, 100),
    fields: "paperId,title,authors,year,venue,publicationDate,fieldsOfStudy,citationCount,abstract,citationStyles"
  };
  
  // 2. Add optional filters
  if (fieldsOfStudy) {
    params.fieldsOfStudy = fieldsOfStudy;
  }
  
  if (yearFrom || yearTo) {
    params.year = `${yearFrom || ""}-${yearTo || ""}`;
  }
  
  // 3. Call external API
  const response = await axios.get(BASE_URL, {
    headers: { "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY },
    params
  });
  
  // 4. Process results
  let papers = response.data.data;
  
  if (sortByCitations) {
    papers = papers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
  }
  
  // 5. Format papers for frontend
  const formattedPapers = papers.map(paper => ({
    paperId: paper.paperId,
    title: paper.title,
    authors: paper.authors?.map(a => ({ authorId: a.authorId, name: a.name })) || [],
    year: paper.year,
    venue: paper.venue || [],
    publicationDate: paper.publicationDate,
    fieldsOfStudy: paper.fieldsOfStudy || [],
    citationCount: paper.citationCount || 0,
    abstract: paper.abstract || [],
    bibtex: paper.citationStyles?.bibtex || []
  }));
  
  // 6. Return formatted response
  return {
    total: response.data.total,
    offset: response.data.offset,
    next: response.data.next,
    data: formattedPapers
  };
}
```

### 5. EXTERNAL API CALL

```
GET https://api.semanticscholar.org/graph/v1/paper/search
Query:
  - query=machine+learning
  - limit=100
  - offset=0
  - fields=paperId,title,authors,year,venue,publicationDate,fieldsOfStudy,citationCount,abstract,citationStyles
  - year=2020-2024
  - fieldsOfStudy=Computer+Science,AI
Headers:
  - x-api-key: {SEMANTIC_SCHOLAR_API_KEY}
```

### 6. RESPONSE RECEIVED

```json
{
  "total": 15234,
  "offset": 0,
  "next": 100,
  "data": [
    {
      "paperId": "abc123",
      "title": "Deep Learning for NLP",
      "authors": [
        { "authorId": "a1", "name": "John Doe" },
        { "authorId": "a2", "name": "Jane Smith" }
      ],
      "year": 2023,
      "venue": "NeurIPS 2023",
      "publicationDate": "2023-12-01",
      "fieldsOfStudy": ["Computer Science", "Artificial Intelligence"],
      "citationCount": 245,
      "abstract": "This paper presents a novel approach...",
      "citationStyles": { "bibtex": "@inproceedings{...}" }
    }
    // ... more papers
  ]
}
```

### 7. BACKEND RESPONSE TO FRONTEND

```javascript
res.json(result); // Sends JSON response back to frontend
```

### 8. FRONTEND RECEIVES & PROCESSES

**Location**: ResultsPage.jsx (line ~146-160)

```javascript
if (response.ok) {
  const data = await response.json();
  console.log("Results loaded:", data);
  setResults(data.data || []);  // Store papers in state
  setTotalResults(data.total || data.data?.length || 0);  // Store total
  setCurrentPage(1);  // Reset pagination
} else {
  setResultsError("Failed to load results");
}
```

### 9. UI RENDERING

**Location**: ResultsPage.jsx (line ~780-810)

```javascript
{currentPapers.map((r, i) => (
  <div key={i}>
    <button onClick={() => navigate(`/paper/${r.paperId}`)}>
      {r.title}
    </button>
    <div>
      {r.authors.map(a => <span>{a.name}</span>)}
      <span>{r.venue} · {r.year}</span>
    </div>
    {r.abstract && <p>{r.abstract.substring(0, 300)}...</p>}
    <button onClick={() => openSave(r)}>Save</button>
    <button onClick={() => openCite(r)}>Cite</button>
  </div>
))}
```

## Complete Request Chain Timeline

```
T+0ms  → User clicks "Search" or filter changes
T+50ms → useEffect triggers, URL parameters built
T+100ms → fetch() called with query parameters
T+150ms → HTTP request sent to backend
T+200ms → Backend receives request
T+250ms → Controller extracts parameters
T+300ms → Service builds Semantic Scholar request
T+350ms → HTTP request sent to Semantic Scholar API
T+1500ms → Semantic Scholar responds (typical latency)
T+1550ms → Backend processes response
T+1600ms → Backend returns formatted JSON
T+1650ms → Frontend receives response
T+1700ms → React state updated (setResults, setTotalResults)
T+1750ms → Component re-renders
T+1800ms → User sees results on screen
```

## Error Handling Flow

```
Backend Error
      ↓
Controller catches exception
      ↓
Returns HTTP 500 + error message
      ↓
Frontend fetch() receives non-200 status
      ↓
setResultsError triggered
      ↓
Error message displayed to user
```

## Caching & Optimization

Currently: No caching implemented
- Each search makes new external API call
- Can be optimized with:
  - Frontend result caching
  - Backend result memoization
  - Browser localStorage for recent searches

## Security Considerations

✅ API key stored in backend .env (not exposed to frontend)
✅ Query parameter validation in controller
✅ CORS enabled for frontend-backend communication
✅ No sensitive data in responses
✅ Rate limiting should be added for production

## Performance Metrics

- API Key: Hidden ✓
- Max Results: 100 per request (configurable)
- Timeout: Uses axios default (~30 seconds)
- Pagination: Frontend side (can be optimized to backend)
- Sorting: Backend available, frontend fallback
