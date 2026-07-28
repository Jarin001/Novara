// test/authController.security.test.js
//
// These tests check EXPECTED authentication behavior, not what the code
// currently does. A failing test here means we found a bug/gap.

jest.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  },
}));

jest.mock('dns', () => ({
  promises: { resolveMx: jest.fn() },
}));

const { supabase } = require('../config/supabase');
const dns = require('dns').promises;
const { register, login } = require('../controllers/authController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Input length limits (DoS protection)', () => {
  test('rejects an absurdly long email instead of attempting DNS/Supabase calls', async () => {
    dns.resolveMx.mockResolvedValue([{ exchange: 'mx.gmail.com', priority: 10 }]);
    const req = {
      body: {
        email: 'a'.repeat(5000) + '@gmail.com',
        password: 'StrongPass1!',
        name: 'Test User',
      },
    };
    const res = mockRes();

    await register(req, res);

    // Expected: a well-behaved API rejects this early with 400 "input too long"
    // before ever hitting DNS or Supabase.
    expect(res.status).toHaveBeenCalledWith(400);
    expect(dns.resolveMx).not.toHaveBeenCalled();
  });

  test('rejects an absurdly long password before attempting registration', async () => {
    dns.resolveMx.mockResolvedValue([{ exchange: 'mx.gmail.com', priority: 10 }]);
    const req = {
      body: {
        email: 'user@gmail.com',
        password: 'A1!' + 'a'.repeat(10000),
        name: 'Test User',
      },
    };
    const res = mockRes();

    await register(req, res);

    // Expected: reasonable max length enforced (e.g. 72 chars, bcrypt's own limit,
    // or an explicit app-level cap) — should not silently accept and forward
    // a 10,000-char string to Supabase.
    expect(res.status).toHaveBeenCalledWith(400);
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  test('rejects an absurdly long name field', async () => {
    dns.resolveMx.mockResolvedValue([{ exchange: 'mx.gmail.com', priority: 10 }]);
    const req = {
      body: {
        email: 'user@gmail.com',
        password: 'StrongPass1!',
        name: 'X'.repeat(10000),
      },
    };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Credential stuffing / brute force protection', () => {
  test('locks out or rate-limits after repeated failed login attempts from the same request context', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    const res = mockRes();
    const attempts = 10;

    for (let i = 0; i < attempts; i++) {
      const req = { body: { email: 'victim@gmail.com', password: `guess${i}` } };
      await login(req, res);
    }

    // Expected: after N failed attempts, the endpoint should start responding
    // with 429 (rate limited) or a lockout message, NOT allow unlimited guesses.
    const statusCalls = res.status.mock.calls.map((c) => c[0]);
    const sawRateLimit = statusCalls.includes(429);

    expect(sawRateLimit).toBe(true);
    // If this fails: there is currently NO rate limiting / lockout mechanism
    // in login() or in server.js middleware — the endpoint allows unlimited
    // password guesses, which is a credential-stuffing / brute-force vulnerability.
  });
});

describe('Email normalization', () => {
  test('normalizes email case before sending to Supabase (prevents duplicate accounts)', async () => {
    dns.resolveMx.mockResolvedValue([{ exchange: 'mx.gmail.com', priority: 10 }]);
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@gmail.com', email_confirmed_at: null } },
      error: null,
    });

    const req = {
      body: { email: 'User@GMAIL.com', password: 'StrongPass1!', name: 'Test User' },
    };
    const res = mockRes();

    await register(req, res);

    // Expected: email should be lowercased/trimmed before being sent to Supabase,
    // so "User@GMAIL.com" and "user@gmail.com" are treated as the same account.
    const callArgs = supabase.auth.signUp.mock.calls[0][0];
    expect(callArgs.email).toBe('user@gmail.com');
  });

  test('trims leading/trailing whitespace from email', async () => {
    dns.resolveMx.mockResolvedValue([{ exchange: 'mx.gmail.com', priority: 10 }]);
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@gmail.com', email_confirmed_at: null } },
      error: null,
    });

    const req = {
      body: { email: '  user@gmail.com  ', password: 'StrongPass1!', name: 'Test User' },
    };
    const res = mockRes();

    await register(req, res);

    const callArgs = supabase.auth.signUp.mock.calls[0][0];
    expect(callArgs.email).toBe('user@gmail.com');
  });
});

describe('Type confusion / malformed input handling', () => {
  test('rejects non-string password instead of silently coercing it', async () => {
    dns.resolveMx.mockResolvedValue([{ exchange: 'mx.gmail.com', priority: 10 }]);
    const req = {
      body: { email: 'user@gmail.com', password: 12345678, name: 'Test User' },
    };
    const res = mockRes();

    await register(req, res);

    // Expected: a number passed as password should be explicitly rejected as
    // invalid input type (400), not silently coerced to a string and run
    // through regex checks, which can produce inconsistent validation results.
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('rejects object/array passed as email instead of crashing or misbehaving', async () => {
    const req = {
      body: { email: { $ne: null }, password: 'StrongPass1!', name: 'Test User' },
    };
    const res = mockRes();

    await register(req, res);

    // Expected: 400 for invalid type, not a 500 crash from calling
    // .split('@') or regex methods on a non-string.
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).not.toHaveBeenCalledWith(500);
  });
});

describe('Account enumeration via error messages', () => {
  test('registration failure message does not confirm whether the email is already registered', async () => {
    dns.resolveMx.mockResolvedValue([{ exchange: 'mx.gmail.com', priority: 10 }]);
    supabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'User already registered' },
    });

    const req = {
      body: { email: 'existing@gmail.com', password: 'StrongPass1!', name: 'Test User' },
    };
    const res = mockRes();

    await register(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    const responseText = JSON.stringify(jsonArg).toLowerCase();

    // Expected (strict security posture): response should NOT explicitly
    // confirm an account exists for this email, to prevent attackers from
    // enumerating valid accounts. A generic message like "if this email is
    // registered, check your inbox" is the safer pattern.
    //
    // NOTE: this is a judgment call — many products intentionally accept
    // this tradeoff for better UX. Flagging it here so it's a documented
    // decision, not an accidental leak.
    expect(responseText).not.toContain('already exists');
  });
});