const { askPaperQuestion } = require('../controllers/paperAi.controller');
const { askQuestionFromPaper } = require('../services/askAI.service');

// Mock the service
jest.mock('../services/askAI.service');

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});


test('askPaperQuestion returns 400 when pdfUrl is missing', async () => {
  const req = {
    body: { question: 'What is this paper about?' }
  };
  const res = mockRes();

  await askPaperQuestion(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({
    error: 'Both pdfUrl and question are required in the request body'
  });
  expect(askQuestionFromPaper).not.toHaveBeenCalled();
});


test('askPaperQuestion returns 400 when question is missing', async () => {
  const req = {
    body: { pdfUrl: 'https://arxiv.org/pdf/1706.03762.pdf' }
  };
  const res = mockRes();

  await askPaperQuestion(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({
    error: 'Both pdfUrl and question are required in the request body'
  });
  expect(askQuestionFromPaper).not.toHaveBeenCalled();
});


test('askPaperQuestion returns answer successfully', async () => {
  const mockAnswer = 'The paper introduces the Transformer model.';
  askQuestionFromPaper.mockResolvedValue(mockAnswer);

  const req = {
    body: {
      pdfUrl: 'https://arxiv.org/pdf/1706.03762.pdf',
      question: 'What is the main contribution?'
    }
  };
  const res = mockRes();

  await askPaperQuestion(req, res);

  expect(askQuestionFromPaper).toHaveBeenCalledWith(
    'https://arxiv.org/pdf/1706.03762.pdf',
    'What is the main contribution?'
  );
  expect(res.json).toHaveBeenCalledWith({ answer: mockAnswer });
});


test('askPaperQuestion returns 500 when service fails', async () => {
  askQuestionFromPaper.mockRejectedValue(new Error('PDF extraction failed'));

  const req = {
    body: {
      pdfUrl: 'https://arxiv.org/pdf/1706.03762.pdf',
      question: 'What is this about?'
    }
  };
  const res = mockRes();

  await askPaperQuestion(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({
    error: 'PDF extraction failed'
  });
});