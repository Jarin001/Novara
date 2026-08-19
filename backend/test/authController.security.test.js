const { register, login } = require("../controllers/authController");
const { supabase } = require("../config/supabase");
const dns = require("dns").promises;

jest.mock("../config/supabase", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  },
}));

jest.mock("dns", () => ({
  promises: {
    resolveMx: jest.fn(),
  },
}));

let res;

beforeEach(() => {
  jest.clearAllMocks();

  res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  dns.resolveMx.mockResolvedValue([
    {
      exchange: "gmail.com",
      priority: 10,
    },
  ]);
});


test("should reject missing required fields", async () => {
  const req = {
    body: {},
  };

  await register(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test("should reject invalid email format", async () => {
  const req = {
    body: {
      email: "invalidEmail",
      password: "Password123!",
      name: "Sanjana",
    },
  };

  await register(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test("should reject weak passwords", async () => {
  const req = {
    body: {
      email: "test@gmail.com",
      password: "abc",
      name: "Sanjana",
    },
  };

  await register(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test("should register successfully", async () => {
  const req = {
    body: {
      email: "test@gmail.com",
      password: "Password123!",
      name: "Sanjana",
    },
  };

  supabase.auth.signUp.mockResolvedValue({
    data: {
      user: {
        id: "1",
        email: "test@gmail.com",
        email_confirmed_at: null,
      },
    },
    error: null,
  });

  await register(req, res);

  expect(res.status).toHaveBeenCalledWith(201);
});

test("should login successfully", async () => {
  const req = {
    body: {
      email: "test@gmail.com",
      password: "Password123!",
    },
  };

  supabase.auth.signInWithPassword.mockResolvedValue({
    data: {
      user: {
        id: "1",
        email: "test@gmail.com",
        email_confirmed_at: true,
      },
      session: {
        access_token: "access-token",
        refresh_token: "refresh-token",
      },
    },
    error: null,
  });

  await login(req, res);

  expect(res.status).toHaveBeenCalledWith(200);
});

test("should reject invalid login credentials", async () => {
  const req = {
    body: {
      email: "test@gmail.com",
      password: "WrongPassword123!",
    },
  };

  supabase.auth.signInWithPassword.mockResolvedValue({
    data: null,
    error: {
      message: "Invalid login credentials",
    },
  });

  await login(req, res);

  expect(res.status).toHaveBeenCalledWith(401);
});

test('duplicate-email detection breaks if Supabase wording differs', async () => {
  supabase.auth.signUp.mockResolvedValue({
    data: null,
    error: { message: 'A user with this email address already exists' },
  });
  const req = { body: validBody };
  const res = mockRes();

  await register(req, res);


  expect(res.status).toHaveBeenCalledWith(400);
});


test("should reject oversized passwords", async () => {
  const req = {
    body: {
      email: "test@gmail.com",
      password: "Password123!" + "a".repeat(10000),
      name: "Sanjana",
    },
  };

  supabase.auth.signUp.mockResolvedValue({
    data: {
      user: {
        id: "1",
        email: "test@gmail.com",
        email_confirmed_at: null,
      },
    },
    error: null,
  });

  await register(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test("should reject oversized names", async () => {
  const req = {
    body: {
      email: "test@gmail.com",
      password: "Password123!",
      name: "a".repeat(10000),
    },
  };

  supabase.auth.signUp.mockResolvedValue({
    data: {
      user: {
        id: "1",
        email: "test@gmail.com",
        email_confirmed_at: null,
      },
    },
    error: null,
  });

  await register(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test("should normalize email before registration", async () => {

    const req = {
        body: {
            email: "  USER@gmail.com  ",
            password: "Password123!",
            name: "Sanjana"
        }
    };


    supabase.auth.signUp.mockResolvedValue({
        data: {
            user: {
                id: "1",
                email: "user@gmail.com",
                email_confirmed_at: null
            }
        },
        error: null
    });


    await register(req, res);

    expect(supabase.auth.signUp)
        .toHaveBeenCalledWith(
            expect.objectContaining({
                email: "user@gmail.com"
            })
        );

});

test("should limit multiple failed login attempts", async () => {
  const req = {
    body: {
      email: "test@gmail.com",
      password: "WrongPassword123!",
    },
  };

  supabase.auth.signInWithPassword.mockResolvedValue({
    data: null,
    error: {
      message: "Invalid login credentials",
    },
  });

  for (let i = 0; i < 20; i++) {
    await login(req, res);
  }

  expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(5);
});