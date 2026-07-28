// __tests__/askAI.service.test.js

const mockGenerateContent = jest.fn();
const mockExtractPdfText = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent
    }
  }))
}));

jest.mock('../utils/pdfUtils', () => ({
  extractPdfText: mockExtractPdfText
}));

const { askQuestionFromPaper } = require('../services/askAI.service');

describe('AskAI Service', () => {

  beforeEach(() => {
    mockGenerateContent.mockClear();
    mockExtractPdfText.mockClear();
  });

  // TEST 1: Valid PDF and question - SHOULD PASS
  test('should return answer for valid PDF and question', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{ text: 'Machine learning is discussed.' }]
        }
      }]
    };

    mockExtractPdfText.mockResolvedValue('Paper about machine learning.');
    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await askQuestionFromPaper('valid.pdf', 'What is this about?');
    expect(result).toBe('Machine learning is discussed.');
  });

  // TEST 2: Empty PDF text - SHOULD FAIL → BUG FOUND
  test('should throw error when PDF text is empty', async () => {
    mockExtractPdfText.mockResolvedValue(''); // Empty PDF

    await expect(askQuestionFromPaper('valid.pdf', 'question'))
      .rejects.toThrow('PDF content is empty');
  });


// TEST 3: Extremely long PDF text - SHOULD FAIL → BUG FOUND
test('should truncate or throw error when PDF text is too long', async () => {
  const longText = 'a'.repeat(2000000); // 2M chars
  mockExtractPdfText.mockResolvedValue(longText);

  await expect(askQuestionFromPaper('valid.pdf', 'question'))
    .rejects.toThrow('PDF content too large');
});

  // TEST 4: API timeout - SHOULD FAIL → BUG FOUND
test('should timeout after 5 seconds if Gemini takes too long', async () => {
  mockExtractPdfText.mockResolvedValue('Paper content');
  // Simulate Gemini taking forever (NEVER resolves or rejects)
  mockGenerateContent.mockImplementation(() => 
    new Promise((resolve) => {}) // Hangs forever
  );

  // This should throw a timeout error from YOUR CODE
  await expect(askQuestionFromPaper('valid.pdf', 'question'))
    .rejects.toThrow('Request timed out');
}, 6000); // Give it 6 seconds total

// TEST: Empty API response - SHOULD PASS (returns fallback)
test('should return fallback message when API returns empty response', async () => {
  mockExtractPdfText.mockResolvedValue('Paper content');
  mockGenerateContent.mockResolvedValue({});

  const result = await askQuestionFromPaper('valid.pdf', 'question');
  
  expect(result).toBe('Sorry, Could not find any answer for this question. Please ask anything from this paper.');
});

// TEST: Malformed API response - SHOULD PASS (returns fallback)
test('should return fallback message when API returns malformed response', async () => {
  mockExtractPdfText.mockResolvedValue('Paper content');
  const mockResponse = {
    candidates: [{
      content: {
        parts: [] // No text
      }
    }]
  };
  mockGenerateContent.mockResolvedValue(mockResponse);

  const result = await askQuestionFromPaper('valid.pdf', 'question');
  
  expect(result).toBe('Sorry, Could not find any answer for this question. Please ask anything from this paper.');
});

  // TEST 7: API failure - SHOULD PASS
  test('should throw error when API call fails', async () => {
    mockExtractPdfText.mockResolvedValue('Paper content');
    mockGenerateContent.mockRejectedValue(new Error('API Error'));

    await expect(askQuestionFromPaper('valid.pdf', 'question'))
      .rejects.toThrow('API Error');
  });

  // TEST 8: Missing API key - SHOULD FAIL → BUG FOUND
  test('should throw error when API key is missing', async () => {
    jest.resetModules();
    jest.doMock('@google/genai', () => ({
      GoogleGenAI: jest.fn().mockImplementation(() => {
        throw new Error('API key required');
      })
    }));

    const { askQuestionFromPaper: ask } = require('../services/askAI.service');
    mockExtractPdfText.mockResolvedValue('Paper content');
    
    await expect(ask('valid.pdf', 'question'))
      .rejects.toThrow('API key required');
  });

  // TEST 9: No question provided - SHOULD FAIL → BUG FOUND
  test('should throw error when question is empty', async () => {
    mockExtractPdfText.mockResolvedValue('Paper content');

    await expect(askQuestionFromPaper('valid.pdf', ''))
      .rejects.toThrow('Question is required');
  });

  // TEST 10: PDF extraction fails - SHOULD PASS
  test('should throw error when PDF extraction fails', async () => {
    mockExtractPdfText.mockRejectedValue(new Error('PDF extraction failed'));

    await expect(askQuestionFromPaper('invalid.pdf', 'question'))
      .rejects.toThrow('PDF extraction failed');
  });

});

test('should return fallback message when question is outside paper content', async () => {
  const paperText = 'This paper is about quantum physics.';
  const question = 'What is machine learning?';
  
  mockExtractPdfText.mockResolvedValue(paperText);
  
  const mockResponse = {
    candidates: [{
      content: {
        parts: [{ 
          text: 'Sorry, Could not find any answer for this question. Please ask anything else related to this paper.' 
        }]
      }
    }]
  };
  mockGenerateContent.mockResolvedValue(mockResponse);

  const result = await askQuestionFromPaper('valid.pdf', question);
  
  expect(result).toBe('Sorry, Could not find any answer for this question. Please ask anything else related to this paper.');
});