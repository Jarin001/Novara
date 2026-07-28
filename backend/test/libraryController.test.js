// test/libraryController.test.js

const {
  createLibrary,
  updateLibrary,
  deleteLibrary,
  shareLibrary,
} = require('../controllers/libraryController');

// ── Helpers ──────────────────────────────────────────────────────────────

function chainable(result) {
  const obj = {};
  ['select', 'update', 'eq', 'neq', 'in', 'order', 'insert', 'delete', 'limit', 'maybeSingle'].forEach((m) => {
    obj[m] = jest.fn(() => obj);
  });
  obj.single = jest.fn(() => Promise.resolve(result));
  obj.maybeSingle = jest.fn(() => Promise.resolve(result));
  obj.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return obj;
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeReqSupabase() {
  return { from: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

// ── createLibrary ────────────────────────────────────────────────────────

describe('createLibrary', () => {
  test('returns 400 if name is missing/empty', async () => {
    const req = { user: { id: 'auth-1' }, supabase: makeReqSupabase(), body: { name: '   ' } };
    const res = mockRes();

    await createLibrary(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 if user not found', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from.mockImplementationOnce(() => chainable({ data: null, error: { code: 'PGRST116' } }));
    const req = { user: { id: 'auth-1' }, supabase: reqSupabase, body: { name: 'My Library' } };
    const res = mockRes();

    await createLibrary(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('creates library successfully', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'u1' }, error: null }))
      .mockImplementationOnce(() => chainable({ data: { id: 'lib1', name: 'My Library' }, error: null }))
      .mockImplementationOnce(() => chainable({ error: null }));
    const req = { user: { id: 'auth-1' }, supabase: reqSupabase, body: { name: 'My Library' } };
    const res = mockRes();

    await createLibrary(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('BUG CHECK: rejects an absurdly long library name instead of writing it to the DB', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'u1' }, error: null }))
      .mockImplementationOnce(() => chainable({ data: { id: 'lib1' }, error: null }))
      .mockImplementationOnce(() => chainable({ error: null }));
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      body: { name: 'X'.repeat(20000) },
    };
    const res = mockRes();

    await createLibrary(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── updateLibrary ────────────────────────────────────────────────────────

describe('updateLibrary', () => {
  test('returns 403 if user has no access (not creator, not collaborator)', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'u1' }, error: null })) // userData
      .mockImplementationOnce(() => chainable({ data: { created_by_user_id: 'someone-else' }, error: null })) // library
      .mockImplementationOnce(() => chainable({ data: null, error: null })); // not a collaborator either
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      params: { library_id: 'lib1' },
      body: { name: 'New Name' },
    };
    const res = mockRes();

    await updateLibrary(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('creator can update library fields', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'u1' }, error: null }))
      .mockImplementationOnce(() => chainable({ data: { created_by_user_id: 'u1' }, error: null }))
      .mockImplementationOnce(() => chainable({ data: { id: 'lib1', name: 'Updated' }, error: null }));
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      params: { library_id: 'lib1' },
      body: { name: 'Updated' },
    };
    const res = mockRes();

    await updateLibrary(req, res);

    // NOTE: this controller calls a bare res.json(...) on success (implicit
    // 200), it never calls res.status(200) explicitly — so we assert on the
    // response body instead of the status mock.
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Library updated successfully' })
    );
    expect(res.status).not.toHaveBeenCalled();
  });

});

// ── deleteLibrary ────────────────────────────────────────────────────────

describe('deleteLibrary', () => {
  test('returns 403 if requester is not the creator', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'u1' }, error: null }))
      .mockImplementationOnce(() => chainable({ data: { created_by_user_id: 'someone-else' }, error: null }));
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      params: { library_id: 'lib1' },
    };
    const res = mockRes();

    await deleteLibrary(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('creator can delete their library', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'u1' }, error: null }))
      .mockImplementationOnce(() => chainable({ data: { created_by_user_id: 'u1' }, error: null }))
      .mockImplementationOnce(() => chainable({ error: null }));
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      params: { library_id: 'lib1' },
    };
    const res = mockRes();

    await deleteLibrary(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Library deleted successfully' })
    );
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ── shareLibrary ─────────────────────────────────────────────────────────

describe('shareLibrary', () => {
  function setupHappyPath(reqSupabase, { senderName = 'Sender', libraryName = 'My Library' } = {}) {
    const notificationChain = chainable({ error: null });
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'sender-id', name: senderName }, error: null })) // sender
      .mockImplementationOnce(() => chainable({ data: null, error: null })) // existingAccess: none
      .mockImplementationOnce(() => chainable({ data: [], error: null })) // existingNotifications: none
      .mockImplementationOnce(() => chainable({ data: { id: 'lib1', name: libraryName }, error: null })) // library
      .mockImplementationOnce(() => notificationChain); // notification insert
    return notificationChain;
  }

  test('returns 400 if recipient_id is missing', async () => {
    const req = {
      user: { id: 'auth-1' },
      supabase: makeReqSupabase(),
      params: { library_id: 'lib1' },
      body: {},
    };
    const res = mockRes();

    await shareLibrary(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 if recipient already has access', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'sender-id', name: 'Sender' }, error: null }))
      .mockImplementationOnce(() => chainable({ data: { id: 'existing-row' }, error: null })) // existingAccess: found
      .mockImplementationOnce(() => chainable({ data: { name: 'Recipient' }, error: null }));
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      params: { library_id: 'lib1' },
      body: { recipient_id: 'recipient-1' },
    };
    const res = mockRes();

    await shareLibrary(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('succeeds when sharing a new library with a new recipient', async () => {
    const reqSupabase = makeReqSupabase();
    setupHappyPath(reqSupabase);
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      params: { library_id: 'lib1' },
      body: { recipient_id: 'recipient-1' },
    };
    const res = mockRes();

    await shareLibrary(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('BUG CHECK: a user with no access to the library can still share it', async () => {
    // Nothing here checks whether authId's user is the creator or a
    // collaborator of library_id before allowing the share to proceed.
    const reqSupabase = makeReqSupabase();
    setupHappyPath(reqSupabase);
    const req = {
      user: { id: 'unrelated-auth-id' }, // this user has no relationship to lib1 at all
      supabase: reqSupabase,
      params: { library_id: 'lib1' },
      body: { recipient_id: 'recipient-1' },
    };
    const res = mockRes();

    await shareLibrary(req, res);

    // Expected: sender should be verified as creator/collaborator of the
    // library before being allowed to share it — 403 if not.
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('BUG CHECK: sharing with a non-existent recipient user should 404, not silently succeed', async () => {
    const reqSupabase = makeReqSupabase();
    setupHappyPath(reqSupabase);
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      params: { library_id: 'lib1' },
      body: { recipient_id: 'this-user-id-does-not-exist' },
    };
    const res = mockRes();

    await shareLibrary(req, res);

    // Expected: the app should verify recipient_id maps to a real user
    // before creating a share invitation for them.
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('BUG CHECK: share notification embeds raw, unescaped sender name', async () => {
    const reqSupabase = makeReqSupabase();
    const notificationChain = setupHappyPath(reqSupabase, {
      senderName: '<script>alert(1)</script>',
    });
    const req = {
      user: { id: 'auth-1' },
      supabase: reqSupabase,
      params: { library_id: 'lib1' },
      body: { recipient_id: 'recipient-1' },
    };
    const res = mockRes();

    await shareLibrary(req, res);

    const notificationArgs = notificationChain.insert.mock.calls[0][0];
    expect(notificationArgs.message).not.toContain('<script>');
  });
});