// test/authController.test.js

// ── Mock supabase BEFORE requiring the controller ──
jest.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      resend: jest.fn(),
      verifyOtp: jest.fn(),
      refreshSession: jest.fn(),
    },
  },
}));

// ── Mock dns.promises so we don't do real network lookups ──
jest.mock('dns', () => ({
  promises: {
    resolveMx: jest.fn(),
  },
}));

const { supabase } = require('../config/supabase');
const dns = require('dns').promises;
const {
  register,
  login,
  resendVerificationEmail,
  verifyEmail,
  refreshToken,
} = require('../controllers/authController'); // adjust path if needed

// ── Helper to fake Express req/res ──
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {}); // silence expected error logs
});

afterEach(() => {
  console.error.mockRestore();
});

describe('register', () => {
  const validBody = {
    email: 'user@gmail.com',
    password: 'StrongPass1!',
    name: 'Test User',
    affiliation: 'Test Uni',
  };

  beforeEach(() => {
    dns.resolveMx.mockResolvedValue([{ exchange: 'mx.gmail.com', priority: 10 }]);
  });

  test('rejects weak passwords with details', async () => {
    const req = { body: { ...validBody, password: 'weak' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Password does not meet requirements',
        details: expect.arrayContaining([expect.any(String)]),
      })
    );
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  test('rejects registration when email already exists (Supabase says "already registered")', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'User already registered' },
    });
    const req = { body: validBody };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'An account with this email already exists' })
    );
  });

  test('duplicate-email detection breaks if Supabase wording differs', async () => {
    // Same meaning, different wording — no "already registered" substring.
    supabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'A user with this email address already exists' },
    });
    const req = { body: validBody };
    const res = mockRes();

    await register(req, res);

    // Expected: clean 400 "already exists" response.
    // Actual (bug): falls through to `throw authError` -> generic 500 via errorHandler.
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 201 and requiresEmailVerification=true for a new unconfirmed user', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: validBody.email, email_confirmed_at: null },
      },
      error: null,
    });
    const req = { body: validBody };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ requiresEmailVerification: true })
    );
  });
});

describe('login', () => {
  test('returns 401 for invalid credentials', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });
    const req = { body: { email: 'user@gmail.com', password: 'wrong' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid email or password' })
    );
  });

  test('returns 403 if email not confirmed', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Email not confirmed' },
    });
    const req = { body: { email: 'user@gmail.com', password: 'StrongPass1!' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 200 with user and session on success', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'user@gmail.com', email_confirmed_at: '2026-01-01' },
        session: { access_token: 'access-token-abc', refresh_token: 'refresh-token-xyz' },
      },
      error: null,
    });
    const req = { body: { email: 'user@gmail.com', password: 'StrongPass1!' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        session: { access_token: 'access-token-abc', refresh_token: 'refresh-token-xyz' },
      })
    );
  });
});

describe('resendVerificationEmail', () => {
  test('returns 400 if already confirmed', async () => {
    supabase.auth.resend.mockResolvedValue({ error: { message: 'Email already confirmed' } });
    const req = { body: { email: 'user@gmail.com' } };
    const res = mockRes();

    await resendVerificationEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 200 on success', async () => {
    supabase.auth.resend.mockResolvedValue({ error: null });
    const req = { body: { email: 'user@gmail.com' } };
    const res = mockRes();

    await resendVerificationEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('verifyEmail', () => {
  test('returns 400 if token_hash or type missing', async () => {
    const req = { query: {} };
    const res = mockRes();

    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'invalid_link' }));
  });

  test('returns 200 on successful verification', async () => {
    supabase.auth.verifyOtp.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'user@gmail.com' } },
      error: null,
    });
    const req = { query: { token_hash: 'abc123', type: 'email' } };
    const res = mockRes();

    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ user: expect.objectContaining({ email_confirmed: true }) })
    );
  });
});

describe('refreshToken', () => {
  test('returns 401 if refresh token is invalid/expired', async () => {
    supabase.auth.refreshSession.mockResolvedValue({
      data: null,
      error: { message: 'invalid token' },
    });
    const req = { body: { refresh_token: 'bad-token' } };
    const res = mockRes();

    await refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 200 with new tokens on success', async () => {
    supabase.auth.refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'new-access',
          refresh_token: 'new-refresh',
          expires_at: 123456,
          expires_in: 3600,
        },
        user: { id: 'user-123', email: 'user@gmail.com', email_confirmed_at: '2026-01-01' },
      },
      error: null,
    });
    const req = { body: { refresh_token: 'old-refresh' } };
    const res = mockRes();

    await refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});