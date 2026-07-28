// test/followController.test.js

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = require('../config/supabase');
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
} = require('../controllers/followController');

// ── Helpers ──────────────────────────────────────────────────────────────

function chainable(result) {
  const obj = {};
  ['select', 'update', 'eq', 'order', 'insert', 'delete'].forEach((m) => {
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

// ── followUser ───────────────────────────────────────────────────────────

describe('followUser', () => {
  test('prevents following yourself', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from.mockImplementationOnce(() =>
      chainable({ data: { id: 'me', name: 'Me' }, error: null })
    );
    const req = { user: { id: 'auth-me' }, params: { user_id: 'me' }, supabase: reqSupabase };
    const res = mockRes();

    await followUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 if target user does not exist', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'me', name: 'Me' }, error: null }))
      .mockImplementationOnce(() => chainable({ data: null, error: { code: 'PGRST116' } }));
    const req = { user: { id: 'auth-me' }, params: { user_id: 'ghost' }, supabase: reqSupabase };
    const res = mockRes();

    await followUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 if already following (existing-follow check finds a row)', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'me', name: 'Me' }, error: null }))
      .mockImplementationOnce(() => chainable({ data: { id: 'target', name: 'Target' }, error: null }))
      .mockImplementationOnce(() => chainable({ data: { id: 'existing-follow' }, error: null }));
    const req = { user: { id: 'auth-me' }, params: { user_id: 'target' }, supabase: reqSupabase };
    const res = mockRes();

    await followUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('succeeds on a normal new follow, sends "follow" notification', async () => {
    const reqSupabase = makeReqSupabase();
    const notificationChain = chainable({ data: null, error: null });
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'me', name: 'Me' }, error: null })) // currentUser
      .mockImplementationOnce(() => chainable({ data: { id: 'target', name: 'Target' }, error: null })) // targetUser
      .mockImplementationOnce(() => chainable({ data: null, error: null })) // existingFollow: none
      .mockImplementationOnce(() => chainable({ data: { id: 'follow-1' }, error: null })) // insert follow
      .mockImplementationOnce(() => chainable({ data: null, error: null })) // isFollowBack: no
      .mockImplementationOnce(() => notificationChain); // notification insert

    const req = { user: { id: 'auth-me' }, params: { user_id: 'target' }, supabase: reqSupabase };
    const res = mockRes();

    await followUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(notificationChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'follow' })
    );
  });

  test('BUG CHECK: race condition — duplicate follow insert should return 400, not crash to 500', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'me', name: 'Me' }, error: null })) // currentUser
      .mockImplementationOnce(() => chainable({ data: { id: 'target', name: 'Target' }, error: null })) // targetUser
      // existingFollow check finds NOTHING (race window — another request hasn't committed yet from this read's POV)
      .mockImplementationOnce(() => chainable({ data: null, error: null }))
      // insert FAILS because a concurrent request already created the row (unique constraint violation)
      .mockImplementationOnce(() =>
        chainable({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } })
      );

    const req = { user: { id: 'auth-me' }, params: { user_id: 'target' }, supabase: reqSupabase };
    const res = mockRes();

    await followUser(req, res);

    // Expected: the app recognizes a unique-constraint violation as "already
    // following" and returns 400, same as the explicit pre-check does.
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('BUG CHECK: follow notification message embeds raw, unescaped user name', async () => {
    const reqSupabase = makeReqSupabase();
    const notificationChain = chainable({ data: null, error: null });
    reqSupabase.from
      .mockImplementationOnce(() =>
        chainable({ data: { id: 'me', name: '<script>alert(1)</script>' }, error: null })
      )
      .mockImplementationOnce(() => chainable({ data: { id: 'target', name: 'Target' }, error: null }))
      .mockImplementationOnce(() => chainable({ data: null, error: null }))
      .mockImplementationOnce(() => chainable({ data: { id: 'follow-1' }, error: null }))
      .mockImplementationOnce(() => chainable({ data: null, error: null }))
      .mockImplementationOnce(() => notificationChain);

    const req = { user: { id: 'auth-me' }, params: { user_id: 'target' }, supabase: reqSupabase };
    const res = mockRes();

    await followUser(req, res);

    const notificationArgs = notificationChain.insert.mock.calls[0][0];
    // Expected: the name should be sanitized/escaped before being embedded
    // in a notification message that other users will see rendered.
    expect(notificationArgs.message).not.toContain('<script>');
  });
});

// ── unfollowUser ─────────────────────────────────────────────────────────

describe('unfollowUser', () => {
  test('succeeds when actually following the target user', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'me' }, error: null }))
      .mockImplementationOnce(() => chainable({ error: null }));
    const req = { user: { id: 'auth-me' }, params: { user_id: 'target' }, supabase: reqSupabase };
    const res = mockRes();

    await unfollowUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('BUG CHECK: unfollowing a user you were never following still returns 200 success', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'me' }, error: null }))
      // delete "succeeds" (0 rows affected, but Supabase delete doesn't error on that)
      .mockImplementationOnce(() => chainable({ error: null }));
    const req = { user: { id: 'auth-me' }, params: { user_id: 'never-followed' }, supabase: reqSupabase };
    const res = mockRes();

    await unfollowUser(req, res);

    // Expected: the app should be able to distinguish "you weren't following
    // this person" from "successfully unfollowed" — e.g. by checking the
    // existing relationship first, or checking rows affected — and respond
    // with 404 rather than a blanket success.
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── getFollowers / getFollowing ─────────────────────────────────────────

describe('getFollowers', () => {
  test('returns formatted followers list', async () => {
    supabase.from.mockImplementationOnce(() =>
      chainable({
        data: [
          { follower_id: 'f1', created_at: '2026-01-01', follower: { id: 'f1', name: 'Alice' } },
        ],
        error: null,
      })
    );
    const req = { params: { user_id: 'u1' } };
    const res = mockRes();

    await getFollowers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ total: 1 })
    );
  });
});

// ── getFollowStatus ──────────────────────────────────────────────────────

describe('getFollowStatus', () => {
  test('returns correct follow/follower booleans and counts on success', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'me' }, error: null })) // currentUser
      .mockImplementationOnce(() => chainable({ data: { id: 'f1' }, error: null })) // isFollowing: yes
      .mockImplementationOnce(() => chainable({ data: null, error: null })) // isFollower: no
      .mockImplementationOnce(() => chainable({ count: 5, error: null })) // followerCount
      .mockImplementationOnce(() => chainable({ count: 2, error: null })); // followingCount

    const req = { user: { id: 'auth-me' }, params: { user_id: 'target' }, supabase: reqSupabase };
    const res = mockRes();

    await getFollowStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        isFollowing: true,
        isFollower: false,
        followerCount: 5,
        followingCount: 2,
      })
    );
  });

  test('BUG CHECK: a failed count query should not silently report a count of 0', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'me' }, error: null })) // currentUser
      .mockImplementationOnce(() => chainable({ data: null, error: null })) // isFollowing
      .mockImplementationOnce(() => chainable({ data: null, error: null })) // isFollower
      // followerCount query actually FAILS at the DB level
      .mockImplementationOnce(() => chainable({ count: null, error: { message: 'DB connection error' } }))
      .mockImplementationOnce(() => chainable({ count: 2, error: null }));

    const req = { user: { id: 'auth-me' }, params: { user_id: 'target' }, supabase: reqSupabase };
    const res = mockRes();

    await getFollowStatus(req, res);

    // Expected: a genuine DB failure on the count query should surface as an
    // error response, not get silently swallowed and reported as "0 followers".
    expect(res.status).not.toHaveBeenCalledWith(200);
  });
});