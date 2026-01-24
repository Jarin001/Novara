# Quick Start Guide - Backend Integration Testing

## Prerequisites
1. Ensure you have `SEMANTIC_SCHOLAR_API_KEY` in your `.env` file (backend)
2. Both backend and frontend servers should be running

## Starting the Application

### Terminal 1 - Backend
```bash
cd backend
npm start
# Expected: Server running at http://localhost:5000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
# Expected: App opens at http://localhost:3000
```

## Testing the Integration

### 1. Basic Search
1. Navigate to the search page or click search
2. Enter a search term (e.g., "machine learning", "quantum computing")
3. Click Search
4. **Expected Result**: Results should load from backend with paper titles, authors, venues, years, abstracts

### 2. Filter by Field of Study
1. After getting search results, click "Fields of Study" button
2. Select one or more fields (e.g., "Computer Science", "Physics")
3. **Expected Result**: Results filter to show only papers in selected fields

### 3. Filter by Date Range
1. Click "Date Range" button
2. Adjust the sliders to set a year range
3. **Expected Result**: Results update to show only papers within the selected year range

### 4. Sort Results
1. Look for "Sort by" dropdown on the right
2. Change from "Relevance" to "Citation count"
3. **Expected Result**: Results reorder with most-cited papers first

### 5. Pagination
1. If more than 7 results, pagination controls appear at bottom
2. Click next/previous or specific page numbers
3. **Expected Result**: Different sets of results display

### 6. Cite a Paper
1. Click "Cite" button on any result
2. Modal opens with different citation formats (BibTeX, MLA, APA, IEEE)
3. Switch between formats
4. Click "Copy" to copy citation text
5. Click "BibTeX" to download as .bib file
6. **Expected Result**: Citation formats display and copy/download works

### 7. Save to Library
1. Click "Save" button on any result
2. Modal opens with available libraries
3. Select one or more libraries
4. Click "Save to Library"
5. **Expected Result**: Confirmation that paper is saved

### 8. Autocomplete
1. Start typing in search field (2+ characters)
2. Wait ~1 second
3. **Expected Result**: Suggestions appear below search box
4. Click suggestion to search
5. **Expected Result**: Search executes with suggested query

## Checking Network Requests

### Using Browser DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Perform a search
4. **Expected Requests**:
   - `GET /api/papers?query=...&limit=100&offset=0`
   - Response: `{ "total": number, "data": [...], "offset": 0, "next": number }`

### Example Request
```
GET http://localhost:5000/api/papers?query=machine+learning&limit=100&offset=0&sortByCitations=false
```

### Example Response
```json
{
  "total": 15234,
  "offset": 0,
  "next": 100,
  "data": [
    {
      "paperId": "abc123def456",
      "title": "Sample Paper Title",
      "authors": [
        { "authorId": "auth1", "name": "John Doe" },
        { "authorId": "auth2", "name": "Jane Smith" }
      ],
      "year": 2023,
      "venue": ["Journal of AI", "Conference 2023"],
      "publicationDate": "2023-06-15",
      "fieldsOfStudy": ["Computer Science", "Artificial Intelligence"],
      "citationCount": 42,
      "abstract": "This is a sample abstract...",
      "bibtex": "@article{...}"
    }
  ]
}
```

## Troubleshooting

### Issue: "Error loading results"
- **Check**: Backend is running on port 5000
- **Check**: SEMANTIC_SCHOLAR_API_KEY is set in .env
- **Check**: Network tab shows backend errors

### Issue: No results appear
- **Check**: Search query is not empty
- **Check**: Backend returned data in Network tab
- **Check**: Browser console for JavaScript errors

### Issue: Filters not working
- **Check**: Filters are being sent in URL parameters
- **Check**: Backend is receiving filter parameters
- **Check**: API_ENDPOINTS is imported correctly

### Issue: Cite modal shows "Loading citation formats..."
- **Check**: `/api/citations/{paperId}` endpoint is responding
- **Check**: Paper has valid paperId

### Issue: CORS errors
- **Check**: Backend has CORS middleware enabled
- **Check**: Frontend API URL matches backend port

## Console Logging

The application logs detailed information. Check browser console (F12) for:
- `Fetching results for: "{query}"` - Search initiated
- `Results loaded: {...}` - Backend data received
- `Fetching citations for paper: {paperId}` - Citation request sent
- Any error messages

## API Response Verification

The backend integration is working correctly if:
✅ Results appear within 1-2 seconds of search
✅ Total count and individual results match
✅ Author names display correctly
✅ Year and venue information appears
✅ Citation count is visible
✅ Abstract truncates at 300 characters
✅ Cite formats are available
✅ Save to libraries works
✅ Filters reduce result count appropriately
✅ Pagination shows correct paper subset
