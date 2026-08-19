const {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  removeProfilePicture,
} = require("../controllers/userController");

jest.mock("../models/PaperContent", () => ({
  findOne: jest.fn(),
}));

let res;
let mockSupabase;

beforeEach(() => {
  res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  mockSupabase = {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  };

  jest.clearAllMocks();
});


test("should get user profile successfully", async () => {
  const userData = {
    id: "1",
    name: "Sanjana",
    email: "test@gmail.com",
  };

  mockSupabase.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: userData,
          error: null,
        }),
      }),
    }),
  });

  const req = {
    user: {
      id: "auth-1",
    },
    supabase: mockSupabase,
  };

  await getUserProfile(req, res);

  expect(res.status).toHaveBeenCalledWith(200);
});

test("should update user profile successfully", async () => {
  const updatedUser = {
    name: "Updated Name",
  };

  mockSupabase.from.mockReturnValue({
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: updatedUser,
            error: null,
          }),
        }),
      }),
    }),
  });

  const req = {
    user: {
      id: "auth-1",
    },
    body: {
      name: "Updated Name",
    },
    supabase: mockSupabase,
  };

  await updateUserProfile(req, res);

  expect(res.status).toHaveBeenCalledWith(200);
});

test("should reject empty update requests", async () => {
  const req = {
    user: {
      id: "auth-1",
    },
    body: {},
    supabase: mockSupabase,
  };

  await updateUserProfile(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test("should reject unsupported image types", async () => {
  const req = {
    user: {
      id: "auth-1",
    },
    body: {
      imageBase64: "abc",
      fileName: "virus.exe",
    },
    supabase: mockSupabase,
  };

  await uploadProfilePicture(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test("should reject files larger than 2 MB", async () => {
  const largeBuffer = Buffer.alloc(2 * 1024 * 1024 + 1).toString("base64");

  const req = {
    user: {
      id: "auth-1",
    },
    body: {
      imageBase64: largeBuffer,
      fileName: "image.png",
    },
    supabase: mockSupabase,
  };

  await uploadProfilePicture(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test("should remove profile picture successfully", async () => {
  const firstQuery = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            profile_picture_url: "https://example.com/avatars/test.png",
          },
        }),
      }),
    }),
  };

  const secondQuery = {
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        }),
      }),
    }),
  };

  mockSupabase.from
    .mockReturnValueOnce(firstQuery)
    .mockReturnValueOnce(secondQuery);

  mockSupabase.storage.from.mockReturnValue({
    remove: jest.fn().mockResolvedValue({}),
  });

  const req = {
    user: {
      id: "auth-1",
    },
    supabase: mockSupabase,
  };

  await removeProfilePicture(req, res);

  expect(res.status).toHaveBeenCalledWith(200);
});



test("should reject script tags in names", async () => {
  const req = {
    user: {
      id: "auth-1",
    },
    body: {
      name: "<script>alert('XSS')</script>",
    },
    supabase: mockSupabase,
  };


  await updateUserProfile(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test("should reject oversized names", async () => {
  const req = {
    user: {
      id: "auth-1",
    },
    body: {
      name: "a".repeat(10000),
    },
    supabase: mockSupabase,
  };

  await updateUserProfile(req, res);


  expect(res.status).toHaveBeenCalledWith(400);
});

test("should reject oversized affiliations", async () => {
  const req = {
    user: {
      id: "auth-1",
    },
    body: {
      affiliation: "a".repeat(10000),
    },
    supabase: mockSupabase,
  };

  await updateUserProfile(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test("should reject invalid social links", async () => {
  const req = {
    user: {
      id: "auth-1",
    },
    body: {
      socialLinks: ["javascript:alert('XSS')"],
    },
    supabase: mockSupabase,
  };

  await updateUserProfile(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

test("should reject spoofed image content", async () => {
  const fakeImage = Buffer.from("<script>alert('XSS')</script>").toString(
    "base64"
  );

  const storageMock = {
    remove: jest.fn(),
    upload: jest.fn().mockResolvedValue({
      error: null,
    }),
    getPublicUrl: jest.fn().mockReturnValue({
      data: {
        publicUrl: "https://example.com/test.png",
      },
    }),
  };

  mockSupabase.storage.from.mockReturnValue(storageMock);

  const firstQuery = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            profile_picture_url: null,
          },
        }),
      }),
    }),
  };

  const secondQuery = {
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        }),
      }),
    }),
  };

  mockSupabase.from
    .mockReturnValueOnce(firstQuery)
    .mockReturnValueOnce(secondQuery);

  const req = {
    user: {
      id: "auth-1",
    },
    body: {
      imageBase64: fakeImage,
      fileName: "profile.png",
    },
    supabase: mockSupabase,
  };


  await uploadProfilePicture(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});