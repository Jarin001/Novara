// __tests__/keywordExtraction.service.test.js

// Create mock BEFORE importing
const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent
    }
  }))
}));

// Now import
const { extractKeywords } = require('../services/keywordExtraction.service');

describe('Keyword Extraction Service', () => {

  beforeEach(() => {
    mockGenerateContent.mockClear();
  });

  // TEST 1: Valid title and abstract
  test('should return array of keywords for valid title and abstract', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{ text: 'machine learning, neural networks, deep learning' }]
        }
      }]
    };

    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await extractKeywords('AI Research', 'This paper discusses AI');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result).toContain('machine learning');
  });

  // TEST 2: Missing both title and abstract
  test('should throw error when title and abstract are both missing', async () => {
    await expect(extractKeywords(null, null))
      .rejects.toThrow('Title or abstract is required');
  });

  // TEST 3: Empty API response → BUG EXPECTED
  test('should throw error when API returns empty response', async () => {
    mockGenerateContent.mockResolvedValue({});

    await expect(extractKeywords('AI', 'Abstract'))
      .rejects.toThrow();
  });

  // TEST 4: Malformed API response → BUG EXPECTED
  test('should throw error when API returns malformed response', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: []
        }
      }]
    };

    mockGenerateContent.mockResolvedValue(mockResponse);

    await expect(extractKeywords('AI', 'Abstract'))
      .rejects.toThrow();
  });

  // TEST 5: API failure
  test('should throw error when API call fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API Error'));

    await expect(extractKeywords('AI', 'Abstract'))
      .rejects.toThrow();
  });

  // TEST 6: API timeout → BUG EXPECTED
  test('should throw error when API times out', async () => {
    mockGenerateContent.mockImplementation(() => 
      new Promise((resolve) => setTimeout(resolve, 5000))
    );

    await expect(extractKeywords('AI', 'Abstract'))
      .rejects.toThrow();
  });

  // TEST 7: Missing API key → BUG EXPECTED
  test('should throw error when API key is missing', async () => {
    // Override the mock for this test only
    const { GoogleGenAI } = require('@google/genai');
    GoogleGenAI.mockImplementationOnce(() => {
      throw new Error('API key required');
    });

    // Need to re-import to use the new mock
    jest.resetModules();
    jest.doMock('@google/genai', () => ({
      GoogleGenAI: jest.fn().mockImplementation(() => {
        throw new Error('API key required');
      })
    }));

    const { extractKeywords: extract } = require('../services/keywordExtraction.service');
    
    await expect(extract('AI', 'Abstract'))
      .rejects.toThrow('API key required');
  });

});