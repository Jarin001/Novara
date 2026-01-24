# Backend Integration - ResultsPage Connection

## Overview
Successfully connected the frontend ResultsPage component to the backend paper search functionality using the following backend files:
- `papersearch.controller.js` - Handles search requests
- `papersearch.route.js` - Routes search requests to GET /api/papers
- `papersearch.service.js` - Fetches data from Semantic Scholar API

## Changes Made

### 1. Frontend Configuration File
**File**: `frontend/src/config/api.js` (NEW)
- Created centralized API endpoint configuration
- Supports environment variable `REACT_APP_API_URL` for easy deployment
- Defines all API endpoints used in the application

### 2. ResultsPage Component Updates
**File**: `frontend/src/pages/ResultsPage.jsx`

#### Imports
- Added import for `API_ENDPOINTS` from config/api.js

#### Search Functionality
- Updated fetch call to use `API_ENDPOINTS.PAPER_SEARCH`
- Now properly constructs query parameters:
  - `query`: The search term
  - `limit`: Results per page (100)
  - `offset`: Pagination offset
  - `sortByCitations`: Boolean for sorting by citation count
  - `yearFrom` & `yearTo`: Year range filters
  - `fieldsOfStudy`: Comma-separated field filters

#### Effect Hooks
- Updated dependency array in results fetch effect to trigger on filter changes:
  - `q` (search query)
  - `sortBy` (citation sorting)
  - `dateRange` (year range)
  - `selectedFields` (field of study filters)

#### Filtering Logic
- Removed redundant client-side filtering for fields and date range
- Backend now handles these filters server-side
- Client-side sorting by citation count is kept for immediate UX response

#### API Calls Updated
1. **Paper Search**: `/api/papers?query=...` - Returns paginated results with metadata
2. **Autocomplete**: `/api/autocomplete?query=...` - Returns search suggestions
3. **Citations**: `/api/citations/{paperId}` - Returns citation formats

## Backend API Endpoints

### Paper Search
```
GET /api/papers
Query Parameters:
  - query (required): Search term
  - limit: Results per page (default: 10, max: 100)
  - offset: Pagination offset (default: 0)
  - sortByCitations: Sort by citation count (default: false)
  - fieldsOfStudy: Comma-separated field filters
  - yearFrom: Minimum publication year
  - yearTo: Maximum publication year

Response:
{
  "total": number,
  "offset": number,
  "next": number,
  "data": [
    {
      "paperId": string,
      "title": string,
      "authors": [{ "authorId": string, "name": string }],
      "year": number,
      "venue": string[],
      "publicationDate": string,
      "fieldsOfStudy": string[],
      "citationCount": number,
      "abstract": string,
      "bibtex": string
    }
  ]
}
```

## How It Works

1. **User Search**: User enters search query in ResultsPage
2. **Query Construction**: Search parameters are built including filters
3. **Backend Request**: Fetch request sent to `/api/papers` with query parameters
4. **Controller Processing**: `papersearch.controller.js` validates query and calls service
5. **Service Call**: `papersearch.service.js` calls Semantic Scholar API with appropriate filters
6. **Data Formatting**: Results are formatted and returned with metadata
7. **UI Update**: Results display with applied filters, pagination, and sorting

## Features

✅ Full-text search across academic papers
✅ Filtering by field of study
✅ Filtering by publication year range
✅ Sorting by relevance or citation count
✅ Pagination support
✅ Autocomplete suggestions
✅ Citation generation (BibTeX, MLA, APA, IEEE)
✅ Save papers to libraries
✅ Proper error handling and loading states

## Environment Variables

Backend needs:
- `SEMANTIC_SCHOLAR_API_KEY`: API key for Semantic Scholar

Frontend can optionally use:
- `REACT_APP_API_URL`: Override default backend URL (defaults to http://localhost:5000)

## Testing

To test the integration:

1. Start backend: `npm start` (in backend directory)
2. Start frontend: `npm start` (in frontend directory)
3. Navigate to search page
4. Enter a search query
5. Verify results load from backend
6. Test filters, sorting, and pagination
7. Test cite and save functionality
