// test/libraryController.test.js

const {
  createLibrary,
  updateLibrary,
  deleteLibrary,
  getUserLibraries,
  shareLibrary,
} = require('../controllers/libraryController');

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

//a working mock for shareLibrary
function createShareMock(data) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data, error: null }),
  };
  return chain;
}




// Test: createLibrary
test('createLibrary returns 400 if name is missing', async () => {
  const req = { 
    user: { id: 'auth-1' }, 
    supabase: { from: jest.fn() },
    body: { name: '   ' } 
  };
  const res = mockRes();
  await createLibrary(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
});




test('createLibrary creates library successfully', async () => {
  const supabase = {
    from: jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null })
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'lib1' }, error: null })
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null })
      })
  };
  const req = { user: { id: 'auth-1' }, supabase, body: { name: 'My Library' } };
  const res = mockRes();
  await createLibrary(req, res);
  expect(res.status).toHaveBeenCalledWith(201);
});




// Test: updateLibrary

test('updateLibrary returns 403 if user has no access', async () => {
  // 1. Create fake Supabase
  const supabase = {
    from: jest.fn()
      // Find user - returns user
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'u1' }, 
          error: null 
        })
      })
      // Get library - creator is someone else
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { created_by_user_id: 'someone-else' }, 
          error: null 
        })
      })
      // Check if collaborator - NOT a collaborator
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: null 
        })
      })
  };

  // 2. Create fake request
  const req = { 
    user: { id: 'auth-1' }, 
    supabase,
    params: { library_id: 'lib1' },
    body: { name: 'New Name' }
  };

  // 3. Create fake response
  const res = mockRes();

  // 4. Call the controller
  await updateLibrary(req, res);

  // 5. Check it returned 403
  expect(res.status).toHaveBeenCalledWith(403);
});



test('creator can update library', async () => {
  const supabase = {
    from: jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { created_by_user_id: 'u1' }, error: null })
      })
      .mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'lib1' }, error: null })
      })
  };
  const req = { 
    user: { id: 'auth-1' }, 
    supabase,
    params: { library_id: 'lib1' },
    body: { name: 'Updated' }
  };
  const res = mockRes();
  await updateLibrary(req, res);
  expect(res.json).toHaveBeenCalled();
});




// Test: deleteLibrary
test('deleteLibrary returns 403 if not creator', async () => {
  const supabase = {
    from: jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { created_by_user_id: 'someone-else' }, error: null })
      })
  };
  const req = { 
    user: { id: 'auth-1' }, 
    supabase,
    params: { library_id: 'lib1' }
  };
  const res = mockRes();
  await deleteLibrary(req, res);
  expect(res.status).toHaveBeenCalledWith(403);
});




test('creator can delete library', async () => {
  const supabase = {
    from: jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { created_by_user_id: 'u1' }, error: null })
      })
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      })
  };
  const req = { 
    user: { id: 'auth-1' }, 
    supabase,
    params: { library_id: 'lib1' }
  };
  const res = mockRes();
  await deleteLibrary(req, res);
  expect(res.json).toHaveBeenCalled();
});



// Test: shareLibrary 
test('shareLibrary returns 400 if no recipient', async () => {
  const req = { 
    user: { id: 'auth-1' }, 
    supabase: { from: jest.fn() },
    params: { library_id: 'lib1' },
    body: {}
  };
  const res = mockRes();
  await shareLibrary(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
});





test('shareLibrary works with valid data', async () => {
  const supabase = {
    from: jest.fn()
      .mockReturnValueOnce(createShareMock({ id: 'sender-id' }))
      .mockReturnValueOnce(createShareMock(null))
      .mockReturnValueOnce(createShareMock([]))
      .mockReturnValueOnce(createShareMock({ id: 'lib1' }))
      .mockReturnValueOnce({ insert: jest.fn().mockResolvedValue({ error: null }) })
  };
  const req = { 
    user: { id: 'auth-1' }, 
    supabase,
    params: { library_id: 'lib1' },
    body: { recipient_id: 'recipient-1' }
  };
  const res = mockRes();
  await shareLibrary(req, res);
  expect(res.status).toHaveBeenCalledWith(200);
});




// No access check in shareLibrary
test('shareLibrary allows anyone to share any library', async () => {
  const supabase = {
    from: jest.fn()
      .mockReturnValueOnce(createShareMock({ id: 'user-123' })) // Get sender
      .mockReturnValueOnce(createShareMock(null)) // No existing access
      .mockReturnValueOnce(createShareMock([])) // No notifications
      .mockReturnValueOnce(createShareMock({ id: 'lib1' })) // Get library
      .mockReturnValueOnce({ insert: jest.fn().mockResolvedValue({ error: null }) }) // Create notification
  };
  const req = { 
    user: { id: 'unauthorized-user' }, 
    supabase,
    params: { library_id: 'other-users-library' },
    body: { recipient_id: 'some-user' }
  };
  const res = mockRes();
  await shareLibrary(req, res);

  expect(res.status).toHaveBeenCalledWith(403);
});



// No validation that recipient exists
test('shareLibrary allows sharing with non-existent users', async () => {
  const supabase = {
    from: jest.fn()
      .mockReturnValueOnce(createShareMock({ id: 'sender-id' })) // Get sender
      .mockReturnValueOnce(createShareMock(null)) // No existing access
      .mockReturnValueOnce(createShareMock([])) // No notifications
      .mockReturnValueOnce(createShareMock({ id: 'lib1' })) // Get library
      .mockReturnValueOnce({ insert: jest.fn().mockResolvedValue({ error: null }) }) // Create notification
  };
  const req = { 
    user: { id: 'auth-1' }, 
    supabase,
    params: { library_id: 'lib1' },
    body: { recipient_id: 'user-that-does-not-exist' }
  };
  const res = mockRes();
  await shareLibrary(req, res);

  expect(res.status).toHaveBeenCalledWith(404);
});





// createLibrary accepts absurdly long names
test('createLibrary should reject absurdly long library names', async () => {
  const supabase = {
    from: jest.fn()
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null })
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'lib1' }, error: null })
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null })
      })
  };
  
  const req = { 
    user: { id: 'auth-1' }, 
    supabase,
    body: { name: 'X'.repeat(1000000) }  // Very long name
  };
  const res = mockRes();
  await createLibrary(req, res);
  
  expect(res.status).toHaveBeenCalledWith(400);
});

