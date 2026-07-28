// test/userController.test.js
//
// Tests both normal behavior and expected-but-unverified security/logic
// properties. A failing test = a real finding, not something to "fix" by
// weakening the assertion.

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('../models/PaperContent', () => ({
  findOne: jest.fn(),
}));

const { supabase } = require('../config/supabase');
const {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  removeProfilePicture,
  getPublicUserProfile,
} = require('../controllers/userController');

// ── Helpers ──────────────────────────────────────────────────────────────

// Fake Supabase query-builder: chainable, resolves via .single() or via
// being awaited directly (covers both usage patterns in the controller).
function chainable(result) {
  const obj = {};
  ['select', 'update', 'eq', 'order'].forEach((m) => {
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

// Builds a fake req.supabase (per-request client used by most controller fns)
function makeReqSupabase() {
  return {
    from: jest.fn(),
    storage: { from: jest.fn() },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  console.log.mockRestore();
});

// ── getUserProfile ──────────────────────────────────────────────────────

describe('getUserProfile', () => {
  test('returns 404 if profile not found', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from.mockImplementationOnce(() =>
      chainable({ data: null, error: { code: 'PGRST116' } })
    );
    const req = { user: { id: 'auth-1' }, supabase: reqSupabase };
    const res = mockRes();

    await getUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 with user data on success', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from.mockImplementationOnce(() =>
      chainable({ data: { id: 'u1', name: 'Test User' }, error: null })
    );
    const req = { user: { id: 'auth-1' }, supabase: reqSupabase };
    const res = mockRes();

    await getUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ id: 'u1' }) })
    );
  });
});

// ── updateUserProfile ───────────────────────────────────────────────────

describe('updateUserProfile', () => {
  test('returns 400 if no fields provided', async () => {
    const reqSupabase = makeReqSupabase();
    const req = { user: { id: 'auth-1' }, supabase: reqSupabase, body: {} };
    const res = mockRes();

    await updateUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updates successfully with valid fields', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from.mockImplementationOnce(() =>
      chainable({ data: { id: 'u1', name: 'New Name' }, error: null })
    );
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      body: { name: 'New Name' },
    };
    const res = mockRes();

    await updateUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('rejects an absurdly long name instead of writing it to the DB', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from.mockImplementationOnce(() =>
      chainable({ data: { id: 'u1' }, error: null })
    );
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      body: { name: 'A'.repeat(50000) },
    };
    const res = mockRes();

    await updateUserProfile(req, res);

    // Expected: an app-level max length on `name` before it ever reaches the DB.
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('rejects raw script tags in name instead of storing them as-is', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from.mockImplementationOnce(() =>
      chainable({ data: { id: 'u1' }, error: null })
    );
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      body: { name: '<script>alert(document.cookie)</script>' },
    };
    const res = mockRes();

    await updateUserProfile(req, res);

    // Expected: input is rejected or sanitized before storage — `name` is
    // later returned verbatim on the PUBLIC profile endpoint, so unsanitized
    // input here is a stored-XSS risk for every visitor to that profile.
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── uploadProfilePicture ────────────────────────────────────────────────

describe('uploadProfilePicture', () => {
  function setupSuccessfulUpload(reqSupabase, { hasExistingPicture = false } = {}) {
    // 1st req.supabase.from() call: fetch currentUser.profile_picture_url
    reqSupabase.from.mockImplementationOnce(() =>
      chainable({
        data: { profile_picture_url: hasExistingPicture ? 'https://x/avatars/old.png' : null },
        error: null,
      })
    );
    // 2nd req.supabase.from() call: update with new picture url
    reqSupabase.from.mockImplementationOnce(() =>
      chainable({ data: { id: 'u1', profile_picture_url: 'https://x/avatars/new.png' }, error: null })
    );

    const storageObj = {
      remove: jest.fn().mockResolvedValue({ error: null }),
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://x/avatars/new.png' } }),
    };
    reqSupabase.storage.from.mockReturnValue(storageObj);
    return storageObj;
  }

  test('rejects unsupported file extensions', async () => {
    const reqSupabase = makeReqSupabase();
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      body: { imageBase64: 'data:image/png;base64,AAAA', fileName: 'malware.exe' },
    };
    const res = mockRes();

    await uploadProfilePicture(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('rejects files over the 2MB size limit', async () => {
    const reqSupabase = makeReqSupabase();
    const bigBase64 = Buffer.alloc(3 * 1024 * 1024).toString('base64'); // 3MB
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      body: { imageBase64: bigBase64, fileName: 'photo.png' },
    };
    const res = mockRes();

    await uploadProfilePicture(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('uploads successfully within limits', async () => {
    const reqSupabase = makeReqSupabase();
    setupSuccessfulUpload(reqSupabase);
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      body: { imageBase64: 'data:image/png;base64,AAAA', fileName: 'photo.png' },
    };
    const res = mockRes();

    await uploadProfilePicture(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('file content is never verified against its claimed extension', async () => {
    const reqSupabase = makeReqSupabase();
    setupSuccessfulUpload(reqSupabase);
    // This is plain HTML/script content, not image data — but it's labeled .png
    const fakeImage = Buffer.from('<script>alert(1)</script>').toString('base64');
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      body: { imageBase64: fakeImage, fileName: 'totally-a-photo.png' },
    };
    const res = mockRes();

    await uploadProfilePicture(req, res);

    // Expected: the app should verify actual file content (magic bytes /
    // image parsing), not just trust the extension. Content-Type spoofing
    // like this should be rejected with 400.
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('old picture should not be deleted before the new upload is confirmed', async () => {
    const reqSupabase = makeReqSupabase();
    // currentUser HAS an existing picture
    reqSupabase.from.mockImplementationOnce(() =>
      chainable({ data: { profile_picture_url: 'https://x/avatars/old.png' }, error: null })
    );
    const storageObj = {
      remove: jest.fn().mockResolvedValue({ error: null }),
      // Upload FAILS
      upload: jest.fn().mockResolvedValue({ error: { message: 'Storage quota exceeded' } }),
      getPublicUrl: jest.fn(),
    };
    reqSupabase.storage.from.mockReturnValue(storageObj);

    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      body: { imageBase64: 'data:image/png;base64,AAAA', fileName: 'photo.png' },
    };
    const res = mockRes();

    await uploadProfilePicture(req, res);

    // Expected: if the new upload fails, the user's existing picture should
    // still be intact — deletion should only happen AFTER a successful
    // upload (or the operation should be transactional).
    expect(storageObj.remove).not.toHaveBeenCalled();
  });
});

// ── removeProfilePicture ────────────────────────────────────────────────

describe('removeProfilePicture', () => {
  test('removes picture and updates user record on success', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from.mockImplementationOnce(() =>
      chainable({ data: { profile_picture_url: 'https://x/avatars/old.png' }, error: null })
    );
    reqSupabase.from.mockImplementationOnce(() =>
      chainable({ data: { id: 'u1', profile_picture_url: null }, error: null })
    );
    const storageObj = { remove: jest.fn().mockResolvedValue({ error: null }) };
    reqSupabase.storage.from.mockReturnValue(storageObj);

    const req = { user: { id: 'auth-1' }, supabase: reqSupabase };
    const res = mockRes();

    await removeProfilePicture(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(storageObj.remove).toHaveBeenCalled();
  });
});

// ── getPublicUserProfile ────────────────────────────────────────────────

describe('getPublicUserProfile', () => {
  test('returns 404 if user not found', async () => {
    supabase.from.mockImplementationOnce(() =>
      chainable({ data: null, error: { code: 'PGRST116' } })
    );
    const req = { params: { user_id: 'nonexistent' }, headers: {} };
    const res = mockRes();

    await getPublicUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 with isOwnProfile=false for an anonymous request', async () => {
    supabase.from
      .mockImplementationOnce(() =>
        chainable({
          data: { id: 'u1', auth_id: 'auth-1', name: 'Test User', created_at: '2026-01-01' },
          error: null,
        })
      )
      .mockImplementationOnce(() => chainable({ data: [], error: null })); // no publications

    const req = { params: { user_id: 'u1' }, headers: {} };
    const res = mockRes();

    await getPublicUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ isOwnProfile: false, totalPapers: 0 }),
      })
    );
  });
});