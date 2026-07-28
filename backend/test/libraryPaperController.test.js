// test/libraryPaperController.test.js

jest.mock('../services/paperService');
jest.mock('../services/libraryAccessService');
jest.mock('../services/authorService');

const PaperService = require('../services/paperService');
const LibraryAccessService = require('../services/libraryAccessService');
const AuthorService = require('../services/authorService');
const {
  savePaperToLibrary,
  getLibraryPapers,
  removePaperFromLibrary,
  updateReadingStatus,
  updatePaperNote,
} = require('../controllers/libraryPaperController');

// ── Helpers ──────────────────────────────────────────────────────────────

function chainable(result) {
  const obj = {};
  ['select', 'eq', 'delete'].forEach((m) => {
    obj[m] = jest.fn(() => obj);
  });
  obj.single = jest.fn(() => Promise.resolve(result));
  obj.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return obj;
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function accessDeniedError() {
  const err = new Error('Access denied');
  err.code = 'ACCESS_DENIED';
  return err;
}

function duplicateError() {
  const err = new Error('Paper already saved');
  err.code = 'DUPLICATE';
  return err;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

// ── savePaperToLibrary ───────────────────────────────────────────────────

describe('savePaperToLibrary', () => {
  test('returns 400 if s2_paper_id or title missing', async () => {
    const req = {
      user: { id: 'auth-1' },
      supabase: {},
      params: { library_id: 'lib1' },
      body: { title: 'Only a title' },
    };
    const res = mockRes();

    await savePaperToLibrary(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(LibraryAccessService.getUserId).not.toHaveBeenCalled();
  });

  test('returns 403 if user lacks library access', async () => {
    LibraryAccessService.getUserId.mockResolvedValue('user-1');
    LibraryAccessService.verifyLibraryAccess.mockRejectedValue(accessDeniedError());

    const req = {
      user: { id: 'auth-1' },
      supabase: {},
      params: { library_id: 'lib1' },
      body: { s2_paper_id: 's2-1', title: 'A Paper' },
    };
    const res = mockRes();

    await savePaperToLibrary(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 409 if paper is a duplicate', async () => {
    LibraryAccessService.getUserId.mockResolvedValue('user-1');
    LibraryAccessService.verifyLibraryAccess.mockResolvedValue(undefined);
    PaperService.upsertPaper.mockRejectedValue(duplicateError());

    const req = {
      user: { id: 'auth-1' },
      supabase: {},
      params: { library_id: 'lib1' },
      body: { s2_paper_id: 's2-1', title: 'A Paper' },
    };
    const res = mockRes();

    await savePaperToLibrary(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('saves successfully end to end', async () => {
    LibraryAccessService.getUserId.mockResolvedValue('user-1');
    LibraryAccessService.verifyLibraryAccess.mockResolvedValue(undefined);
    PaperService.upsertPaper.mockResolvedValue({ id: 'paper-1' });
    PaperService.savePaperContent.mockResolvedValue(undefined);
    PaperService.linkPaperToLibrary.mockResolvedValue({ id: 'lp-1' });
    PaperService.upsertReadingStatus.mockResolvedValue({ reading_status: 'unread' });
    PaperService.saveUserNote.mockResolvedValue(undefined);
    AuthorService.getPaperWithAuthors.mockResolvedValue({ id: 'paper-1', title: 'A Paper' });

    const req = {
      user: { id: 'auth-1' },
      supabase: {},
      params: { library_id: 'lib1' },
      body: { s2_paper_id: 's2-1', title: 'A Paper' },
    };
    const res = mockRes();

    await savePaperToLibrary(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('BUG CHECK: accepts an arbitrary reading_status value instead of validating it', async () => {
    LibraryAccessService.getUserId.mockResolvedValue('user-1');
    LibraryAccessService.verifyLibraryAccess.mockResolvedValue(undefined);
    PaperService.upsertPaper.mockResolvedValue({ id: 'paper-1' });
    PaperService.savePaperContent.mockResolvedValue(undefined);
    PaperService.linkPaperToLibrary.mockResolvedValue({ id: 'lp-1' });
    PaperService.upsertReadingStatus.mockResolvedValue({ reading_status: 'not-a-real-status' });
    PaperService.saveUserNote.mockResolvedValue(undefined);
    AuthorService.getPaperWithAuthors.mockResolvedValue({ id: 'paper-1', title: 'A Paper' });

    const req = {
      user: { id: 'auth-1' },
      supabase: {},
      params: { library_id: 'lib1' },
      body: { s2_paper_id: 's2-1', title: 'A Paper', reading_status: 'not-a-real-status' },
    };
    const res = mockRes();

    await savePaperToLibrary(req, res);

    // Expected: same validation as updateReadingStatus enforces
    // (unread / in_progress / read) should apply here too.
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── updateReadingStatus ──────────────────────────────────────────────────

describe('updateReadingStatus', () => {
  test('returns 400 for an invalid reading_status value', async () => {
    const req = {
      user: { id: 'auth-1' },
      supabase: {},
      params: { library_id: 'lib1', paper_id: 'paper-1' },
      body: { reading_status: 'bogus' },
    };
    const res = mockRes();

    await updateReadingStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('succeeds with a valid reading_status', async () => {
    LibraryAccessService.getUserId.mockResolvedValue('user-1');
    PaperService.upsertReadingStatus.mockResolvedValue({ reading_status: 'read' });

    const req = {
      user: { id: 'auth-1' },
      supabase: {},
      params: { library_id: 'lib1', paper_id: 'paper-1' },
      body: { reading_status: 'read' },
    };
    const res = mockRes();

    await updateReadingStatus(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Reading status updated' })
    );
  });

  test('BUG CHECK: never verifies the user has access to this library before updating status', async () => {
    LibraryAccessService.getUserId.mockResolvedValue('user-1');
    PaperService.upsertReadingStatus.mockResolvedValue({ reading_status: 'read' });

    const req = {
      user: { id: 'auth-1' },
      supabase: {},
      params: { library_id: 'some-library-i-should-not-have-access-to', paper_id: 'paper-1' },
      body: { reading_status: 'read' },
    };
    const res = mockRes();

    await updateReadingStatus(req, res);

    // Expected: verifyLibraryAccess should be called before mutating
    // per-library state, same as every other endpoint in this file does.
    expect(LibraryAccessService.verifyLibraryAccess).toHaveBeenCalled();
  });
});

// ── updatePaperNote ──────────────────────────────────────────────────────

describe('updatePaperNote', () => {
  test('returns 404 if the paper is not found in the library', async () => {
    LibraryAccessService.getUserId.mockResolvedValue('user-1');
    const reqSupabase = { from: jest.fn(() => chainable({ data: null, error: null })) };

    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      params: { library_id: 'lib1', paper_id: 'paper-1' },
      body: { user_note: 'hello' },
    };
    const res = mockRes();

    await updatePaperNote(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updates note successfully when paper exists in library', async () => {
    LibraryAccessService.getUserId.mockResolvedValue('user-1');
    PaperService.saveUserNote.mockResolvedValue({ userNote: 'hello' });
    const reqSupabase = { from: jest.fn(() => chainable({ data: { id: 'lp-1' }, error: null })) };

    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      params: { library_id: 'lib1', paper_id: 'paper-1' },
      body: { user_note: 'hello' },
    };
    const res = mockRes();

    await updatePaperNote(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Note updated successfully' })
    );
  });

  test('BUG CHECK: never verifies the user has access to this library before updating the note', async () => {
    LibraryAccessService.getUserId.mockResolvedValue('user-1');
    PaperService.saveUserNote.mockResolvedValue({ userNote: 'hello' });
    const reqSupabase = { from: jest.fn(() => chainable({ data: { id: 'lp-1' }, error: null })) };

    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      params: { library_id: 'some-library-i-should-not-have-access-to', paper_id: 'paper-1' },
      body: { user_note: 'hello' },
    };
    const res = mockRes();

    await updatePaperNote(req, res);

    // Expected: existence of the library_papers row is not the same as
    // confirming THIS user has access to that library. verifyLibraryAccess
    // should be called too.
    expect(LibraryAccessService.verifyLibraryAccess).toHaveBeenCalled();
  });
});

// ── removePaperFromLibrary (control/contrast case) ──────────────────────

describe('removePaperFromLibrary', () => {
  test('verifies library access before removing a paper (correct pattern, for contrast)', async () => {
    LibraryAccessService.getUserId.mockResolvedValue('user-1');
    LibraryAccessService.verifyLibraryAccess.mockResolvedValue(undefined);
    PaperService.paperExistsInOtherLibraries.mockResolvedValue(true);
    PaperService.deleteReadingStatus.mockResolvedValue(undefined);
    PaperService.deleteUserNote.mockResolvedValue(undefined);
    const reqSupabase = { from: jest.fn(() => chainable({ error: null })) };

    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      params: { library_id: 'lib1', paper_id: 'paper-1' },
    };
    const res = mockRes();

    await removePaperFromLibrary(req, res);

    expect(LibraryAccessService.verifyLibraryAccess).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Paper removed from library successfully' })
    );
  });
});

// ── getLibraryPapers ─────────────────────────────────────────────────────

describe('getLibraryPapers', () => {
  test('returns an empty papers array cleanly when library has no papers', async () => {
    LibraryAccessService.getUserId.mockResolvedValue('user-1');
    LibraryAccessService.verifyLibraryAccess.mockResolvedValue(undefined);
    PaperService.getLibraryPapersFromDB.mockResolvedValue([]);

    const req = {
      user: { id: 'auth-1' },
      supabase: {},
      params: { library_id: 'lib1' },
    };
    const res = mockRes();

    await getLibraryPapers(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ papers: [] })
    );
  });
});