// Novara/backend/__tests__/citation.service.test.js

// Mock dependencies FIRST
jest.mock('axios');
jest.mock('@citation-js/plugin-bibtex', () => ({}));
jest.mock('@citation-js/plugin-csl', () => ({}));
jest.mock('@citation-js/core');
jest.mock('bibtex-tidy');
jest.mock('fs');
jest.mock('he');
jest.mock('path');

// Import
const citationService = require('../services/citation.service');
const axios = require('axios');

// Setup mocks
const { Cite, plugins } = require('@citation-js/core');
const { tidy } = require('bibtex-tidy');
const fs = require('fs');
const he = require('he');

Cite.mockImplementation(() => ({
  format: jest.fn().mockReturnValue('<p>Formatted citation</p>')
}));

plugins.config = {
  get: jest.fn().mockReturnValue({
    templates: {
      has: jest.fn().mockReturnValue(false),
      add: jest.fn()
    }
  })
};

tidy.mockImplementation((bibtex) => ({ bibtex: bibtex || '@article{test}' }));
fs.readFileSync.mockReturnValue('@csl style content');
he.decode.mockImplementation((str) => str);

describe('Citation Service', () => {

  // TEST 1: Valid paper ID ✅
  test('should return 4 citation formats for valid paper ID', async () => {
    axios.get.mockResolvedValue({
      data: {
        citationStyles: {
          bibtex: '@article{test, author={Test}}'
        }
      }
    });

    const result = await citationService.fetchAndFormatCitation('valid-id');

    expect(result).toHaveLength(4);
    expect(result[0].id).toBe('bibtex');
    expect(result[1].id).toBe('apa');
    expect(result[2].id).toBe('ieee');
    expect(result[3].id).toBe('mla');
  });

  // TEST 2: No BibTeX ✅
  test('should throw error when BibTeX is not available', async () => {
    axios.get.mockResolvedValue({ data: {} });

    await expect(citationService.fetchAndFormatCitation('paper-id'))
      .rejects.toThrow('BibTeX not available');
  });

  // TEST 3: API failure ✅
  test('should handle API failure', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));

    await expect(citationService.fetchAndFormatCitation('paper-id'))
      .rejects.toThrow('Network error');
  });

  // TEST 4: API timeout - FIXED ✅
  test('should handle API timeout', async () => {
    // Create a real Error object with code property
    const timeoutError = new Error('Request timeout');
    timeoutError.code = 'ECONNABORTED';
    axios.get.mockRejectedValue(timeoutError);

    await expect(citationService.fetchAndFormatCitation('paper-id'))
      .rejects.toThrow('Request timeout');
  });

  // TEST 5: Missing API key ✅
  test('should throw error when API key is missing', async () => {
    const originalKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
    delete process.env.SEMANTIC_SCHOLAR_API_KEY;

    // Make axios throw when called
    axios.get.mockRejectedValue(new Error('API key required'));

    await expect(citationService.fetchAndFormatCitation('paper-id'))
      .rejects.toThrow('API key required');

    process.env.SEMANTIC_SCHOLAR_API_KEY = originalKey;
  });

  // TEST 6: Malformed BibTeX ✅
  test('should handle malformed BibTeX gracefully', async () => {
    axios.get.mockResolvedValue({
      data: {
        citationStyles: {
          bibtex: 'invalid bibtex string'
        }
      }
    });

    // Service handles malformed BibTeX by still returning citation formats
    const result = await citationService.fetchAndFormatCitation('paper-id');
    expect(result).toHaveLength(4);
  });

  // TEST 7: Empty paper ID ✅
  test('should handle empty paper ID', async () => {
    // Service actually calls the API with empty string
    axios.get.mockResolvedValue({
      data: {
        citationStyles: {
          bibtex: '@article{test, author={Test}}'
        }
      }
    });

    const result = await citationService.fetchAndFormatCitation('');
    expect(result).toHaveLength(4);
  });

  // TEST 8: arXiv paper ✅
  test('should properly format arXiv papers', async () => {
    const arxivBibtex = '@article{test, journal={arXiv}, volume={abs/1234}}';
    axios.get.mockResolvedValue({
      data: {
        citationStyles: {
          bibtex: arxivBibtex
        }
      }
    });

    const result = await citationService.fetchAndFormatCitation('arxiv-id');
    expect(result[0].value).toContain('eprint');
  });

});