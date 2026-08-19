// annotations.test.js

jest.mock('../models/Annotations');
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const Annotations = require('../models/Annotations');
const { supabase } = require('../config/supabase');
const annotationController = require('../controllers/annotation.controller');

// ── Helpers ───────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReqWithIo = (overrides = {}) => {
  const emit = jest.fn();
  const to = jest.fn().mockReturnValue({ emit });
  const io = { to };
  return {
    app: { get: jest.fn().mockReturnValue(io) },
    _emit: emit,
    _to: to,
    ...overrides,
  };
};

const mockSupabaseSingle = (data, error = null) => {
  supabase.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data, error }),
      }),
    }),
  });
};

const mockSupabaseIn = (data, error = null) => {
  supabase.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({ data, error }),
    }),
  });
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── createAnnotation ──────────────────────────────────────

test('Create annotation and enrich with userName', async () => {
  const fakeAnnotation = {
    _id: 'ann1',
    paperId: 'paper1',
    userId: 'user1',
    content: 'test note',
    toObject: jest.fn().mockReturnValue({
      _id: 'ann1',
      paperId: 'paper1',
      userId: 'user1',
      content: 'test note',
    }),
  };
  Annotations.create.mockResolvedValue(fakeAnnotation);
  mockSupabaseSingle({ name: 'Alice' });

  const req = mockReqWithIo({
    body: { paperId: 'paper1', userId: 'user1', content: 'test note' },
  });
  const res = mockRes();

  await annotationController.createAnnotation(req, res);

  expect(Annotations.create).toHaveBeenCalledWith(
    expect.objectContaining({ paperId: 'paper1', replies: [] })
  );
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ userName: 'Alice' }));
});

test('Create annotation emits annotationUpdate to the correct paper room', async () => {
  const fakeAnnotation = {
    paperId: 'paper1',
    userId: 'user1',
    toObject: jest.fn().mockReturnValue({ paperId: 'paper1', userId: 'user1' }),
  };
  Annotations.create.mockResolvedValue(fakeAnnotation);
  mockSupabaseSingle({ name: 'Alice' });

  const req = mockReqWithIo({ body: { paperId: 'paper1', userId: 'user1' } });
  const res = mockRes();

  await annotationController.createAnnotation(req, res);

  expect(req._to).toHaveBeenCalledWith('paper1');
  expect(req._emit).toHaveBeenCalledWith(
    'annotationUpdate',
    expect.objectContaining({ paperId: 'paper1' })
  );
});

test('Default userName to Unknown when Supabase returns an error', async () => {
  const fakeAnnotation = {
    paperId: 'paper1',
    userId: 'user1',
    toObject: jest.fn().mockReturnValue({ paperId: 'paper1', userId: 'user1' }),
  };
  Annotations.create.mockResolvedValue(fakeAnnotation);
  mockSupabaseSingle(null, { message: 'not found' });

  const req = mockReqWithIo({ body: { paperId: 'paper1', userId: 'user1' } });
  const res = mockRes();

  await annotationController.createAnnotation(req, res);

  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ userName: 'Unknown' }));
});

test('Preserve replies array passed in the request body', async () => {
  const existingReplies = [{ text: 'hi', userId: 'u2' }];
  const fakeAnnotation = {
    paperId: 'paper1',
    userId: 'user1',
    toObject: jest.fn().mockReturnValue({
      paperId: 'paper1',
      userId: 'user1',
      replies: existingReplies,
    }),
  };
  Annotations.create.mockResolvedValue(fakeAnnotation);
  mockSupabaseSingle({ name: 'Bob' });

  const req = mockReqWithIo({
    body: { paperId: 'paper1', userId: 'user1', replies: existingReplies },
  });
  const res = mockRes();

  await annotationController.createAnnotation(req, res);

  expect(Annotations.create).toHaveBeenCalledWith(
    expect.objectContaining({ replies: existingReplies })
  );
});

test('Create annotation still succeeds when io is unavailable', async () => {
  const fakeAnnotation = {
    paperId: 'paper1',
    userId: 'user1',
    toObject: jest.fn().mockReturnValue({ paperId: 'paper1', userId: 'user1' }),
  };
  Annotations.create.mockResolvedValue(fakeAnnotation);
  mockSupabaseSingle({ name: 'Alice' });

  const req = { app: { get: jest.fn().mockReturnValue(undefined) }, body: {} };
  const res = mockRes();

  await annotationController.createAnnotation(req, res);

  expect(res.status).toHaveBeenCalledWith(201);
});

test('Return 400 when Annotations.create throws', async () => {
  Annotations.create.mockRejectedValue(new Error('validation failed'));

  const req = mockReqWithIo({ body: {} });
  const res = mockRes();

  await annotationController.createAnnotation(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: 'validation failed' });
});

// ── getAnnotations ────────────────────────────────────────

test('Get annotations enriched with userName and replies', async () => {
  const fakeAnnotations = [
    {
      userId: 'user1',
      replies: [],
      toObject: jest.fn().mockReturnValue({ userId: 'user1', replies: [] }),
    },
    {
      userId: 'user2',
      replies: [{ text: 'reply' }],
      toObject: jest.fn().mockReturnValue({ userId: 'user2', replies: [{ text: 'reply' }] }),
    },
  ];
  Annotations.find.mockResolvedValue(fakeAnnotations);
  mockSupabaseIn([
    { auth_id: 'user1', name: 'Alice' },
    { auth_id: 'user2', name: 'Bob' },
  ]);

  const req = { params: { paperId: 'paper1' } };
  const res = mockRes();

  await annotationController.getAnnotations(req, res);

  expect(Annotations.find).toHaveBeenCalledWith({ paperId: 'paper1' });
  expect(res.json).toHaveBeenCalledWith([
    expect.objectContaining({ userId: 'user1', userName: 'Alice' }),
    expect.objectContaining({ userId: 'user2', userName: 'Bob' }),
  ]);
});

test('Return empty array when there are no annotations for the paper', async () => {
  Annotations.find.mockResolvedValue([]);

  const req = { params: { paperId: 'paper1' } };
  const res = mockRes();

  await annotationController.getAnnotations(req, res);

  expect(res.json).toHaveBeenCalledWith([]);
  expect(supabase.from).not.toHaveBeenCalled();
});

test('Fall back to Unknown userName when Supabase lookup errors', async () => {
  const fakeAnnotations = [
    {
      userId: 'user1',
      replies: [],
      toObject: jest.fn().mockReturnValue({ userId: 'user1', replies: [] }),
    },
  ];
  Annotations.find.mockResolvedValue(fakeAnnotations);
  mockSupabaseIn(null, { message: 'supabase down' });

  const req = { params: { paperId: 'paper1' } };
  const res = mockRes();

  await annotationController.getAnnotations(req, res);

  expect(res.json).toHaveBeenCalledWith([expect.objectContaining({ userName: 'Unknown' })]);
});

test('Return 400 when Annotations.find throws', async () => {
  Annotations.find.mockRejectedValue(new Error('db error'));

  const req = { params: { paperId: 'paper1' } };
  const res = mockRes();

  await annotationController.getAnnotations(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: 'db error' });
});

// ── updateAnnotation ──────────────────────────────────────

test('Update annotation and emit socket update', async () => {
  const updated = {
    paperId: 'paper1',
    userId: 'user1',
    replies: [{ text: 'edited' }],
    toObject: jest.fn().mockReturnValue({
      paperId: 'paper1',
      userId: 'user1',
      replies: [{ text: 'edited' }],
    }),
  };
  Annotations.findByIdAndUpdate.mockResolvedValue(updated);
  mockSupabaseSingle({ name: 'Alice' });

  const req = mockReqWithIo({
    params: { id: 'ann1' },
    body: { content: 'edited content' },
  });
  const res = mockRes();

  await annotationController.updateAnnotation(req, res);

  expect(Annotations.findByIdAndUpdate).toHaveBeenCalledWith(
    'ann1',
    { content: 'edited content' },
    { new: true }
  );
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ userName: 'Alice', replies: [{ text: 'edited' }] })
  );
  expect(req._to).toHaveBeenCalledWith('paper1');
});

test('Return 404 when the annotation id does not exist on update', async () => {
  Annotations.findByIdAndUpdate.mockResolvedValue(null);

  const req = mockReqWithIo({ params: { id: 'missing' }, body: {} });
  const res = mockRes();

  await annotationController.updateAnnotation(req, res);

  expect(res.status).toHaveBeenCalledWith(404);
});

test('Return 400 when findByIdAndUpdate throws', async () => {
  Annotations.findByIdAndUpdate.mockRejectedValue(new Error('cast error'));

  const req = mockReqWithIo({ params: { id: 'bad-id' }, body: {} });
  const res = mockRes();

  await annotationController.updateAnnotation(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: 'cast error' });
});

// ── deleteAnnotation ──────────────────────────────────────

test('Delete annotation and emit annotationDelete socket event', async () => {
  const deleted = { _id: 'ann1', paperId: 'paper1' };
  Annotations.findByIdAndDelete.mockResolvedValue(deleted);

  const req = mockReqWithIo({ params: { id: 'ann1' } });
  const res = mockRes();

  await annotationController.deleteAnnotation(req, res);

  expect(Annotations.findByIdAndDelete).toHaveBeenCalledWith('ann1');
  expect(req._to).toHaveBeenCalledWith('paper1');
  expect(req._emit).toHaveBeenCalledWith('annotationDelete', { id: 'ann1' });
  expect(res.json).toHaveBeenCalledWith({ success: true });
});

test('Still return success true when annotation to delete does not exist', async () => {
  Annotations.findByIdAndDelete.mockResolvedValue(null);

  const req = mockReqWithIo({ params: { id: 'missing' } });
  const res = mockRes();

  await annotationController.deleteAnnotation(req, res);

  expect(req._emit).not.toHaveBeenCalled();
  expect(res.json).toHaveBeenCalledWith({ success: true });
});

test('Return 400 when findByIdAndDelete throws', async () => {
  Annotations.findByIdAndDelete.mockRejectedValue(new Error('delete failed'));

  const req = mockReqWithIo({ params: { id: 'ann1' } });
  const res = mockRes();

  await annotationController.deleteAnnotation(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: 'delete failed' });
});

// ── updateAnnotation (new edge/negative cases) ────────────────────────

test('Negative case — Update — malformed ObjectId returns 400 CastError', async () => {
  // "123" is not 24 hex chars — Mongoose throws CastError immediately before
  // even querying the DB. This is CORRECT behavior, worth documenting.
  Annotations.findByIdAndUpdate.mockRejectedValue(
    new Error('Cast to ObjectId failed for value "123" at path "_id"')
  );

  const req = mockReqWithIo({ params: { id: '123' }, body: { content: 'test' } });
  const res = mockRes();

  await annotationController.updateAnnotation(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ error: expect.stringContaining('Cast to ObjectId failed') })
  );
});

test('Edge case — Update — well-formed but nonexistent ObjectId crashes to 400 instead of clean 404 (BUG)', async () => {
  // "64b000000000000000000000" is valid ObjectId format — Mongoose queries the DB
  // and gets null back (no error). Then annotation.toObject() crashes with
  // TypeError, landing in catch as 400 instead of the correct 404.
  Annotations.findByIdAndUpdate.mockResolvedValue(null); // valid query, nothing found

  const req = mockReqWithIo({
    params: { id: '64b000000000000000000000' },
    body: { content: 'test' },
  });
  const res = mockRes();

  await annotationController.updateAnnotation(req, res);

  // BUG: currently returns 400 with "Cannot read properties of null (reading 'toObject')"
  // Expected: should return 404 "Annotation not found" with a null-check before .toObject()
  expect(res.status).toHaveBeenCalledWith(404);
});

// ── deleteAnnotation (new edge/negative cases) ────────────────────────

test('Edge case — Delete — well-formed but nonexistent ObjectId returns false-positive 200 (BUG)', async () => {
  // findByIdAndDelete returns null when nothing is found — no error thrown.
  // The controller never inspects the return value, so it always claims success.
  Annotations.findByIdAndDelete.mockResolvedValue(null);

  const req = mockReqWithIo({ params: { id: '64b000000000000000000000' } });
  const res = mockRes();

  await annotationController.deleteAnnotation(req, res);

  // BUG: currently returns 200 { "success": true } even though nothing was deleted.
  // Expected: should return 404 so callers can distinguish a real deletion from a no-op.
  // Confirming the bug — this assertion documents the incorrect behavior:
  expect(res.json).toHaveBeenCalledWith({ success: true });
  // Once fixed, replace the above with:
  // expect(res.status).toHaveBeenCalledWith(404);
});

test('Negative case — Delete — malformed ObjectId returns 400 CastError', async () => {
  // "abc" is not a valid ObjectId — Mongoose throws CastError immediately.
  // This is CORRECT behavior, worth documenting alongside the nonexistent-ID case.
  Annotations.findByIdAndDelete.mockRejectedValue(
    new Error('Cast to ObjectId failed for value "abc" at path "_id"')
  );

  const req = mockReqWithIo({ params: { id: 'abc' } });
  const res = mockRes();

  await annotationController.deleteAnnotation(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ error: expect.stringContaining('Cast to ObjectId failed') })
  );
});