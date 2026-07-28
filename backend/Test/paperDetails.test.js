const axios = require('axios');
const { getPaperDetails, formatPaperId } = require('../services/paperdetails.service');
const { getPaperDetails: getPaperDetailsController } = require('../controllers/paperdetails.controller');
const { extractKeywords } = require('../services/keywordExtraction.service');
const { resolvePdfUrl } = require('../services/pdfResolver.service');

jest.mock('axios');
jest.mock('../services/keywordExtraction.service');
jest.mock('../services/pdfResolver.service');

describe('formatPaperId', () => {

  test('should format numeric ID as CorpusId', () => {
    const result = formatPaperId('12345');
    expect(result).toBe('CorpusId:12345');
  });

  test('should keep already formatted CorpusId', () => {
    const result = formatPaperId('CorpusId:12345');
    expect(result).toBe('CorpusId:12345');
  });

  test('should format DOI correctly', () => {
    const result = formatPaperId('10.1234/abc.123');
    expect(result).toBe('DOI:10.1234/abc.123');
  });

  test('should format DOI with doi: prefix', () => {
    const result = formatPaperId('doi:10.1234/abc.123');
    expect(result).toBe('DOI:10.1234/abc.123');
  });

  test('should format arXiv ID correctly', () => {
    const result = formatPaperId('2101.12345');
    expect(result).toBe('ARXIV:2101.12345');
  });

  test('should format arXiv ID with version', () => {
    const result = formatPaperId('2101.12345v2');
    expect(result).toBe('ARXIV:2101.12345v2');
  });

  test('should format arXiv with arxiv: prefix', () => {
    const result = formatPaperId('arxiv:2101.12345');
    expect(result).toBe('ARXIV:2101.12345');
  });

  test('should return trimmed ID for unknown format', () => {
    const result = formatPaperId('  unknown-id  ');
    expect(result).toBe('unknown-id');
  });

  test('should return empty string for empty input', () => {
    const result = formatPaperId('');
    expect(result).toBe('');
  });

});

describe('Paper Details Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return paper details for valid paper ID', async () => {
    const mockPaper = {
      paperId: '123',
      title: 'Test Paper',
      abstract: 'Test abstract',
      authors: [{ name: 'Author' }],
      year: 2024
    };

    axios.get.mockResolvedValue({ data: mockPaper });
    resolvePdfUrl.mockResolvedValue({ url: 'http://pdf.com', status: 'success' });
    extractKeywords.mockResolvedValue(['keyword1', 'keyword2']);

    const result = await getPaperDetails('123');

    expect(result.paperId).toBe('123');
    expect(result.title).toBe('Test Paper');
    expect(result.openAccessPdf).toEqual({ url: 'http://pdf.com', status: 'success' });
    expect(result.keywords).toEqual(['keyword1', 'keyword2']);
  });

  test('should throw "Paper not found" for 404 error', async () => {
    const error = { response: { status: 404 } };
    axios.get.mockRejectedValue(error);

    await expect(getPaperDetails('123'))
      .rejects.toThrow('Paper not found.');
  });

  test('should throw "Rate limit exceeded" for 429 error', async () => {
    const error = { response: { status: 429 } };
    axios.get.mockRejectedValue(error);

    await expect(getPaperDetails('123'))
      .rejects.toThrow('Rate limit exceeded.');
  });

  test('should throw generic error for other API errors', async () => {
    const error = { response: { status: 500 } };
    axios.get.mockRejectedValue(error);

    await expect(getPaperDetails('123'))
      .rejects.toThrow('Failed to fetch paper details.');
  });

  test('should return empty keywords when no title or abstract', async () => {
    const mockPaper = { paperId: '123', title: '', abstract: '' };

    axios.get.mockResolvedValue({ data: mockPaper });
    resolvePdfUrl.mockResolvedValue({ url: null, status: 'not_found' });

    const result = await getPaperDetails('123');
    expect(result.keywords).toEqual([]);
    expect(extractKeywords).not.toHaveBeenCalled();
  });

  test('should handle keyword extraction failure gracefully', async () => {
    const mockPaper = { paperId: '123', title: 'Test Paper', abstract: 'Test abstract' };

    axios.get.mockResolvedValue({ data: mockPaper });
    resolvePdfUrl.mockResolvedValue({ url: null, status: 'not_found' });
    extractKeywords.mockRejectedValue(new Error('Keyword extraction failed'));

    const result = await getPaperDetails('123');
    expect(result.keywords).toEqual([]);
  });

  // ========== BUG TEST 1: resolvePdfUrl FAILS ==========
  test('should handle resolvePdfUrl failure gracefully (set pdfUrl to null)', async () => {
    const mockPaper = { paperId: '123', title: 'Test Paper' };

    axios.get.mockResolvedValue({ data: mockPaper });
    resolvePdfUrl.mockRejectedValue(new Error('PDF resolve failed'));

    // CORRECT BEHAVIOR: Should handle gracefully, not crash
    const result = await getPaperDetails('123');
    expect(result.openAccessPdf).toEqual({ url: null, status: 'failed' });
    // This test WILL FAIL because your code doesn't do this
  });

  // ========== BUG TEST 2: Timeout ERROR MSG ==========
  test('should preserve original error message for timeout', async () => {
    axios.get.mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout of 60000ms exceeded')), 5000)
      )
    );

    // CORRECT BEHAVIOR: Should throw the original timeout error
    await expect(getPaperDetails('123'))
      .rejects.toThrow('timeout of 60000ms exceeded');
    // This test WILL FAIL because your code returns "Failed to fetch paper details."
  }, 6000);

  test('should throw error when API key is missing', async () => {
    const originalKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
    delete process.env.SEMANTIC_SCHOLAR_API_KEY;

    axios.get.mockRejectedValue(new Error('API key required'));

    await expect(getPaperDetails('123'))
      .rejects.toThrow();

    process.env.SEMANTIC_SCHOLAR_API_KEY = originalKey;
  });

  test('should handle empty paper ID', async () => {
    const mockPaper = { paperId: '', title: 'Test' };
    axios.get.mockResolvedValue({ data: mockPaper });
    resolvePdfUrl.mockResolvedValue({ url: null, status: 'not_found' });

    const result = await getPaperDetails('');
    expect(result.paperId).toBe('');
  });

  test('should handle malformed API response', async () => {
    axios.get.mockResolvedValue({ data: null });
    resolvePdfUrl.mockResolvedValue({ url: null, status: 'not_found' });

    await expect(getPaperDetails('123'))
      .rejects.toThrow('Failed to fetch paper details.');
  });

});

describe('Paper Details Controller', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 for valid paper ID', async () => {
    const req = { params: { paperId: '123' } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    axios.get.mockResolvedValue({ data: { paperId: '123', title: 'Test' } });
    resolvePdfUrl.mockResolvedValue({ url: null, status: 'not_found' });
    extractKeywords.mockResolvedValue([]);

    await getPaperDetailsController(req, res);

    expect(res.json).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(500);
  });

  test('should return 500 when service throws error', async () => {
    const req = { params: { paperId: '123' } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    axios.get.mockRejectedValue(new Error('Service error'));

    await getPaperDetailsController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch paper details' });
  });

});