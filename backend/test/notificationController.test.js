// test/notificationController.test.js

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

// ── Helpers ──────────────────────────────────────────────────────────────

function chainable(result) {
  const obj = {};
  ['select', 'update', 'eq', 'order', 'delete', 'limit', 'in'].forEach((m) => {
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

const userNotFound = { data: null, error: { code: 'PGRST116' } };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

// ── getNotifications ─────────────────────────────────────────────────────

describe('getNotifications', () => {
  test('returns notifications successfully (basic case, no enrichment needed)', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'user-1' }, error: null })) // currentUser
      .mockImplementationOnce(() =>
        chainable({
          data: [{ id: 'n1', type: 'follow', message: 'X followed you', is_read: false, actor: null }],
          error: null,
        })
      ); // notifications
    const req = { user: { id: 'auth-1' }, supabase: reqSupabase };
    const res = mockRes();

    await getNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('BUG CHECK: crashes instead of degrading gracefully when the paper-lookup enrichment query fails', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'user-1' }, error: null })) // currentUser
      .mockImplementationOnce(() =>
        chainable({
          data: [
            { id: 'n1', type: 'new_publication', reference_id: 'paper-1', message: 'New paper', is_read: false, actor: null },
          ],
          error: null,
        })
      ) // notifications
      .mockImplementationOnce(() => chainable({ data: null, error: { message: 'papers table unreachable' } })); // papers lookup FAILS

    const req = { user: { id: 'auth-1' }, supabase: reqSupabase };
    const res = mockRes();

    await getNotifications(req, res);

    // Expected: a failure enriching one notification type shouldn't crash
    // the whole notifications list — it should still return the base
    // notification data (just without s2_paper_id attached), status 200.
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ── getUnreadCount ───────────────────────────────────────────────────────

describe('getUnreadCount', () => {
  test('returns unread count successfully', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'user-1' }, error: null }))
      .mockImplementationOnce(() => chainable({ count: 3, error: null }));
    const req = { user: { id: 'auth-1' }, supabase: reqSupabase };
    const res = mockRes();

    await getUnreadCount(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ unreadCount: 3 }));
  });

  test('BUG CHECK: returns 500 instead of 404 when the user profile is not found', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from.mockImplementationOnce(() => chainable(userNotFound));
    const req = { user: { id: 'auth-ghost' }, supabase: reqSupabase };
    const res = mockRes();

    await getUnreadCount(req, res);

    // Expected: a clean 404 "User not found", matching the pattern used
    // elsewhere in the app (authController, userController, etc.)
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── markAsRead ───────────────────────────────────────────────────────────

describe('markAsRead', () => {
  test('marks a notification as read successfully', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'user-1' }, error: null }))
      .mockImplementationOnce(() => chainable({ error: null }));
    const req = { user: { id: 'auth-1' }, params: { notification_id: 'n1' }, supabase: reqSupabase };
    const res = mockRes();

    await markAsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('BUG CHECK: returns 500 instead of 404 when the user profile is not found', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from.mockImplementationOnce(() => chainable(userNotFound));
    const req = { user: { id: 'auth-ghost' }, params: { notification_id: 'n1' }, supabase: reqSupabase };
    const res = mockRes();

    await markAsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('BUG CHECK: marking a non-existent or non-owned notification still returns 200 success', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'user-1' }, error: null }))
      // update "succeeds" with 0 rows actually affected — Supabase doesn't error on this
      .mockImplementationOnce(() => chainable({ error: null }));
    const req = {
      user: { id: 'auth-1' },
      params: { notification_id: 'someone-elses-notification' },
      supabase: reqSupabase,
    };
    const res = mockRes();

    await markAsRead(req, res);

    // Expected: the app should be able to tell the difference between
    // "successfully marked as read" and "nothing matched" — 404 for the latter.
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── markAllAsRead ────────────────────────────────────────────────────────

describe('markAllAsRead', () => {
  test('marks all notifications as read successfully', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'user-1' }, error: null }))
      .mockImplementationOnce(() => chainable({ error: null }));
    const req = { user: { id: 'auth-1' }, supabase: reqSupabase };
    const res = mockRes();

    await markAllAsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('BUG CHECK: returns 500 instead of 404 when the user profile is not found', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from.mockImplementationOnce(() => chainable(userNotFound));
    const req = { user: { id: 'auth-ghost' }, supabase: reqSupabase };
    const res = mockRes();

    await markAllAsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── deleteNotification ───────────────────────────────────────────────────

describe('deleteNotification', () => {
  test('deletes a notification successfully', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'user-1' }, error: null }))
      .mockImplementationOnce(() => chainable({ error: null }));
    const req = { user: { id: 'auth-1' }, params: { notification_id: 'n1' }, supabase: reqSupabase };
    const res = mockRes();

    await deleteNotification(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('BUG CHECK: returns 500 instead of 404 when the user profile is not found', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from.mockImplementationOnce(() => chainable(userNotFound));
    const req = { user: { id: 'auth-ghost' }, params: { notification_id: 'n1' }, supabase: reqSupabase };
    const res = mockRes();

    await deleteNotification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('BUG CHECK: deleting a non-existent or non-owned notification still returns 200 success', async () => {
    const reqSupabase = makeReqSupabase();
    reqSupabase.from
      .mockImplementationOnce(() => chainable({ data: { id: 'user-1' }, error: null }))
      .mockImplementationOnce(() => chainable({ error: null }));
    const req = {
      user: { id: 'auth-1' },
      params: { notification_id: 'someone-elses-notification' },
      supabase: reqSupabase,
    };
    const res = mockRes();

    await deleteNotification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});