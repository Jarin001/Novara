# Component & Architecture Diagram

## Frontend Component Hierarchy

```
App.jsx (React Router)
│
├── Home.jsx
│
├── LoginRegister.jsx
│
└── ResultsPage.jsx ⭐ (MAIN COMPONENT - Backend Connected)
    │
    ├── Navbar (Top navigation)
    │
    ├── Search Form Section
    │   ├── Input: searchInput state
    │   ├── Autocomplete Dropdown
    │   │   └── Suggestions from /api/autocomplete
    │   └── Search Button
    │
    ├── Filters Section
    │   ├── Fields of Study Filter
    │   │   └── Extracted from results.fieldsOfStudy
    │   ├── Date Range Filter
    │   │   └── Min: 1931, Max: 2026
    │   └── Sort By Dropdown
    │       ├── Relevance
    │       └── Citation Count
    │
    ├── Results Display Section
    │   ├── Result count header
    │   ├── Paper List
    │   │   ├── Paper Title (clickable → /paper/{paperId})
    │   │   ├── Authors (tags)
    │   │   ├── Venue + Year
    │   │   ├── Abstract (truncated)
    │   │   ├── Save Button → SaveModal
    │   │   └── Cite Button → CiteModal
    │   │
    │   └── Pagination
    │       ├── Previous Button
    │       ├── Page Numbers
    │       └── Next Button
    │
    ├── CiteModal ⭐
    │   ├── Format Tabs (BibTeX, MLA, APA, IEEE)
    │   ├── Citation Text Area
    │   ├── Copy Button
    │   └── Export BibTeX Button
    │
    └── SaveModal
        ├── Paper Info
        ├── Library List (Checkboxes)
        ├── Selected Count
        └── Save Button
```

## Backend Route Architecture

```
Express App (index.js)
│
├── CORS Middleware
├── JSON Parser
├── MongoDB Connection
│
├── Routes
│   ├── /api/auth → authRoutes
│   ├── /api/users → userRoutes
│   ├── /api/papers → paperRoutes
│   ├── /api/papers → ⭐ paperSearchRoute ← ResultsPage uses this
│   │   │
│   │   └── GET / (no path extension)
│   │       └── paperSearchController.searchPapers
│   │           └── paperSearchService.searchPapers
│   │               └── Semantic Scholar API
│   │
│   ├── /api/autocomplete → autocompleteRoute
│   ├── /api/citations → citationRoutes
│   ├── /api/libraries → libraryRoutes
│   ├── /api/user/papers → userPapersRoutes
│   ├── /api/paper-ai → paperAiRoutes
│   └── ... other routes
│
└── Error Handlers
    ├── 404 Handler
    └── Global Error Handler
```

## Data State Management in ResultsPage

```
Component State:
├── Search State
│   ├── searchInput (string)
│   ├── q (query param)
│   └── type (query param)
│
├── Results State ⭐
│   ├── results (array of papers)
│   ├── totalResults (number)
│   ├── resultsLoading (boolean)
│   └── resultsError (string | null)
│
├── Filter State ⭐
│   ├── selectedFields (array)
│   ├── dateRange (array: [min, max])
│   ├── sortBy (string: 'relevance' | 'citations')
│   ├── openFields (boolean - dropdown open)
│   └── openDate (boolean - dropdown open)
│
├── Pagination State
│   ├── currentPage (number)
│   └── papersPerPage (number = 7)
│
├── Suggestions State
│   ├── suggestions (array)
│   ├── showSuggestions (boolean)
│   └── suggestionsLoading (boolean)
│
├── Citation Modal State
│   ├── citeOpen (boolean)
│   ├── citeItem (paper object)
│   ├── citeFormats (array)
│   ├── citeFormat (string)
│   ├── citeLoading (boolean)
│   ├── citeError (string)
│   └── copied (boolean)
│
└── Save Modal State
    ├── saveOpen (boolean)
    ├── saveItem (paper object)
    └── selectedLibraries (array)
```

## API Request/Response Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ResultsPage.jsx - useEffect triggered by query/filters  │
└─────────────────────┬──────────────────────────────────┘
                      │
                      │ 1. Build URLSearchParams
                      │    query, limit, offset
                      │    sortByCitations, yearFrom, yearTo
                      │    fieldsOfStudy
                      ▼
┌──────────────────────────────────────────────────────────┐
│   fetch(`/api/papers?query=...&limit=100&...`)          │
│   Method: GET                                            │
│   Headers: Content-Type: application/json               │
└─────────────────────┬──────────────────────────────────┘
                      │
                      │ 2. HTTP Request sent to backend
                      ▼
┌──────────────────────────────────────────────────────────┐
│              BACKEND (Express.js)                        │
│  Route: app.use('/api/papers', paperSearchRoute)         │
└─────────────────────┬──────────────────────────────────┘
                      │
                      │ 3. Route handler
                      ▼
┌──────────────────────────────────────────────────────────┐
│  paperSearchController.searchPapers(req, res)            │
│  • Extract: req.query.{query, limit, offset, ...}      │
│  • Validate: query required                             │
│  • Call: paperSearchService.searchPapers({...})         │
└─────────────────────┬──────────────────────────────────┘
                      │
                      │ 4. Service processing
                      ▼
┌──────────────────────────────────────────────────────────┐
│  paperSearchService.searchPapers({...})                  │
│  • Build Semantic Scholar request                       │
│  • Add filters: year range, fields, etc                │
│  • Call external API with x-api-key header             │
└─────────────────────┬──────────────────────────────────┘
                      │
                      │ 5. External API call
                      ▼
┌──────────────────────────────────────────────────────────┐
│  Semantic Scholar API                                   │
│  https://api.semanticscholar.org/graph/v1/paper/search  │
│  • Query papers in knowledge graph                      │
│  • Apply filters and sorting                            │
│  • Return matching papers                               │
└─────────────────────┬──────────────────────────────────┘
                      │
                      │ 6. Response: { data: [...], total, offset, next }
                      ▼
┌──────────────────────────────────────────────────────────┐
│  Service formatting                                     │
│  • Map response to standard format                      │
│  • Extract: paperId, title, authors, year, venue, etc  │
│  • Return formatted response                            │
└─────────────────────┬──────────────────────────────────┘
                      │
                      │ 7. res.json(result)
                      ▼
┌──────────────────────────────────────────────────────────┐
│   HTTP Response: 200 OK                                 │
│   Body: JSON with papers array and metadata             │
└─────────────────────┬──────────────────────────────────┘
                      │
                      │ 8. Frontend receives response
                      ▼
┌──────────────────────────────────────────────────────────┐
│              FRONTEND (React)                           │
│  • response.json() parsing                              │
│  • setResults(data.data)                                │
│  • setTotalResults(data.total)                          │
│  • State update triggers re-render                      │
└─────────────────────┬──────────────────────────────────┘
                      │
                      │ 9. Component re-render
                      ▼
┌──────────────────────────────────────────────────────────┐
│  Papers display on page                                │
│  ✓ Paper titles                                        │
│  ✓ Authors                                              │
│  ✓ Year and venue                                       │
│  ✓ Citation count                                       │
│  ✓ Abstract                                             │
│  ✓ Save/Cite buttons                                    │
└──────────────────────────────────────────────────────────┘
```

## Filter Processing Flow

```
User Input (Filter/Sort Change)
    ↓
useEffect triggered with dependency changes
    ↓
┌─ If sortBy changes
│  └─ Only client-side sort (instant UX)
│
├─ If dateRange changes
│  └─ Rebuild query params with yearFrom, yearTo
│  └─ Send to backend
│
├─ If selectedFields changes
│  └─ Rebuild query params with fieldsOfStudy
│  └─ Send to backend
│
└─ If sortBy='citations' AND (dateRange OR selectedFields)
   └─ Send sortByCitations=true to backend
   └─ Backend sorts, client may re-sort
```

## File Organization

```
backend/
├── controllers/
│   └── papersearch.controller.js ⭐
│       └── exports.searchPapers(req, res)
│
├── routes/
│   └── papersearch.route.js ⭐
│       └── router.get("/", searchPapers)
│
├── services/
│   └── papersearch.service.js ⭐
│       └── exports.searchPapers({options})
│
└── index.js
    └── app.use('/api/papers', paperSearchRoute)

frontend/
├── config/
│   └── api.js ⭐ (NEW - Centralized endpoints)
│       └── exports.API_ENDPOINTS
│
└── pages/
    └── ResultsPage.jsx ⭐ (Modified)
        ├── Imports API_ENDPOINTS
        ├── Fetches from /api/papers
        ├── Handles filters
        └── Displays results
```

## Key Integration Points

### Point 1: API Configuration
```
frontend/src/config/api.js
  ↓
export const API_ENDPOINTS = {
  PAPER_SEARCH: `${API_BASE_URL}/api/papers`
}
```

### Point 2: Search Trigger
```
ResultsPage.jsx - useEffect
  ↓
if (q changed or filters changed)
  ↓
fetch(`${API_ENDPOINTS.PAPER_SEARCH}?query=...`)
```

### Point 3: Backend Processing
```
backend/routes/papersearch.route.js
  ↓
GET /api/papers → paperSearchController.searchPapers
  ↓
paperSearchService.searchPapers(params)
  ↓
axios.get(Semantic Scholar API)
```

### Point 4: Response Handling
```
Backend service formats response
  ↓
Controller sends res.json(result)
  ↓
Frontend setResults(data.data)
  ↓
Component renders papers
```

## Success Indicators

✅ Results appear after search
✅ Results match search query
✅ Filter reduces result count
✅ Sort changes result order
✅ Pagination shows different papers
✅ No console errors
✅ Network requests show 200 status
✅ All paper fields populated correctly
✅ Cite modal shows formats
✅ Save modal shows libraries
