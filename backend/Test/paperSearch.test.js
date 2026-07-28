const axios = require('axios');
const { searchPapers } = require('../services/papersearch.service');
const { searchPapers: searchPapersController } = require('../controllers/papersearch.controller');
const { resolvePdfUrl } = require('../services/pdfResolver.service');

jest.mock('axios');
jest.mock('../services/pdfResolver.service');

describe('Paper Search Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TEST 1: Valid search query
  test('should return papers for valid search query', async () => {
    const mockResponse = {
      data: {
        total: 1,
        offset: 0,
        next: null,
        data: [{
          paperId: '123',
          title: 'Test Paper',
          authors: [{ authorId: '1', name: 'Author' }],
          year: 2024,
          citationCount: 10
        }]
      }
    };

    axios.get.mockResolvedValue(mockResponse);
    resolvePdfUrl.mockResolvedValue({ url: 'http://pdf.com', status: 'success' });

    const result = await searchPapers({ query: 'machine learning' });

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe('Test Paper');
  });

  // TEST 2: Limit caps at 100
  test('should cap limit at 100', async () => {
    axios.get.mockResolvedValue({
      data: {
        total: 0,
        offset: 0,
        next: null,
        data: []
      }
    });
    resolvePdfUrl.mockResolvedValue({ url: null, status: 'not_found' });

    await searchPapers({ query: 'test', limit: 200 });

    expect(axios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({ limit: 100 })
      })
    );
  });

  // TEST 3: Sort by citations
  test('should sort by citation count', async () => {
    const mockResponse = {
      data: {
        total: 2,
        offset: 0,
        next: null,
        data: [
          { paperId: '1', citationCount: 5 },
          { paperId: '2', citationCount: 10 }
        ]
      }
    };

    axios.get.mockResolvedValue(mockResponse);
    resolvePdfUrl.mockResolvedValue({ url: null, status: 'not_found' });

    const result = await searchPapers({ query: 'test', sortByCitations: true });

    expect(result.data[0].citationCount).toBe(10);
  });

  // TEST 4: API failure
  test('should throw error when API call fails', async () => {
    axios.get.mockRejectedValue(new Error('API Error'));

    await expect(searchPapers({ query: 'test' }))
      .rejects.toThrow('API Error');
  });

  // ========== BUG TESTS (These SHOULD FAIL if bugs exist) ==========

  // TEST 5: No timeout mechanism - BUG TEST
  test('should have timeout mechanism (5 seconds)', async () => {
    // Simulate axios taking FOREVER (never resolves or rejects)
    axios.get.mockImplementation(() => new Promise(() => {}));

    // Your code should timeout and throw an error
    await expect(searchPapers({ query: 'test' }))
      .rejects.toThrow('Request timed out');
  }, 6000);

  // TEST 6: Empty API response - BUG TEST
  test('should handle empty API response gracefully', async () => {
    axios.get.mockResolvedValue({ data: {} });

    const result = await searchPapers({ query: 'test' });
    
    // Should return empty array, not crash
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  // TEST 7: resolvePdfUrl failure - BUG TEST
  test('should handle resolvePdfUrl failure gracefully', async () => {
    const mockResponse = {
      data: {
        total: 1,
        offset: 0,
        next: null,
        data: [{
          paperId: '123',
          title: 'Test Paper',
          authors: [],
          year: 2024
        }]
      }
    };

    axios.get.mockResolvedValue(mockResponse);
    resolvePdfUrl.mockRejectedValue(new Error('PDF resolve failed'));

    const result = await searchPapers({ query: 'test' });
    
    // Should continue with pdfUrl: null, not crash
    expect(result.data[0].pdfUrl).toBeNull();
    expect(result.data[0].pdfSource).toBe('failed');
  });

  // TEST 8: Missing data field in response - BUG TEST
  test('should handle missing data field in API response', async () => {
    axios.get.mockResolvedValue({
      data: {
        total: 0
        // No 'data' field
      }
    });

    const result = await searchPapers({ query: 'test' });
    
    // Should return empty array, not crash
    expect(result.data).toEqual([]);
  });

});

describe('Paper Search Controller', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TEST 9: Valid request
  test('should return 200 for valid request', async () => {
    const req = { query: { query: 'test' } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    axios.get.mockResolvedValue({
      data: {
        total: 0,
        offset: 0,
        next: null,
        data: []
      }
    });
    resolvePdfUrl.mockResolvedValue({ url: null, status: 'not_found' });

    await searchPapersController(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  // TEST 10: Missing query - returns 400
  test('should return 400 when query is missing', async () => {
    const req = { query: {} };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await searchPapersController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'query is required' });
  });

  // TEST 11: Controller catches error - returns 500
  test('should return 500 when service fails', async () => {
    const req = { query: { query: 'test' } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    axios.get.mockRejectedValue(new Error('Service error'));

    await searchPapersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch papers' });
  });

});