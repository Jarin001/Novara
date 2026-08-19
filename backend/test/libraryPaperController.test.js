const {
  savePaperToLibrary,
  getLibraryPapers,
  getAllUserPapers,
  removePaperFromLibrary,
  updateReadingStatus,
  updatePaperNote
} = require("../controllers/libraryPaperController");


const PaperService = require("../services/paperService");
const LibraryAccessService = require("../services/libraryAccessService");
const AuthorService = require("../services/authorService");


// Mock external services

jest.mock("../services/paperService", () => ({
  upsertPaper: jest.fn(),
  savePaperContent: jest.fn(),
  linkPaperToLibrary: jest.fn(),
  upsertReadingStatus: jest.fn(),
  saveUserNote: jest.fn(),

  getLibraryPapersFromDB: jest.fn(),
  getPaperContents: jest.fn(),
  getUserNotes: jest.fn(),
  getReadingStatuses: jest.fn(),

  removeDuplicatesAndAggregate: jest.fn(),

  paperExistsInOtherLibraries: jest.fn(),
  deletePaperContent: jest.fn(),
  deleteReadingStatus: jest.fn(),
  deleteUserNote: jest.fn()
}));


jest.mock("../services/libraryAccessService", () => ({
  getUserId: jest.fn(),
  verifyLibraryAccess: jest.fn(),
  getUserAccessibleLibraries: jest.fn()
}));


jest.mock("../services/authorService", () => ({
  linkAuthorsToaPaper: jest.fn(),
  getPaperWithAuthors: jest.fn(),
  getAuthorsForPapers: jest.fn()
}));



// response mock

function mockRes(){

  return {

    status: jest.fn().mockReturnThis(),

    json: jest.fn().mockReturnThis()

  };

}



beforeEach(()=>{

  jest.clearAllMocks();

});




// ================= SAVE PAPER =================


test("savePaperToLibrary should return 400 when required fields are missing", async()=>{


  const req={

    user:{
      id:"auth1"
    },

    params:{
      library_id:"lib1"
    },

    body:{},

    supabase:{}

  };


  const res=mockRes();


  await savePaperToLibrary(req,res);


  expect(res.status).toHaveBeenCalledWith(400);


});





test("savePaperToLibrary should save paper successfully", async()=>{


  LibraryAccessService.getUserId
    .mockResolvedValue("user1");


  LibraryAccessService.verifyLibraryAccess
    .mockResolvedValue();


  PaperService.upsertPaper
    .mockResolvedValue({
      id:"paper1"
    });


  PaperService.linkPaperToLibrary
    .mockResolvedValue({
      id:"lp1"
    });


  AuthorService.getPaperWithAuthors
    .mockResolvedValue({
      id:"paper1"
    });



  const req={

    user:{
      id:"auth1"
    },

    params:{
      library_id:"lib1"
    },

    body:{

      s2_paper_id:"s2-1",

      title:"Research Paper"

    }

  };


  const res=mockRes();


  await savePaperToLibrary(req,res);



  expect(res.status)
    .toHaveBeenCalledWith(201);


});





test("savePaperToLibrary should reject invalid reading status", async()=>{


  const req={

    user:{
      id:"auth1"
    },

    params:{
      library_id:"lib1"
    },

    body:{

      s2_paper_id:"123",

      title:"Paper",

      reading_status:"invalid"

    }

  };


  const res=mockRes();


  await savePaperToLibrary(req,res);



  expect(res.status)
    .toHaveBeenCalledWith(400);


});






// ================= GET LIBRARY PAPERS =================





test("getLibraryPapers should return empty list when no papers exist", async()=>{


  LibraryAccessService.getUserId
    .mockResolvedValue("user1");


  LibraryAccessService.verifyLibraryAccess
    .mockResolvedValue();


  PaperService.getLibraryPapersFromDB
    .mockResolvedValue([]);



  const req={

    user:{
      id:"auth1"
    },

    params:{
      library_id:"lib1"
    }

  };


  const res=mockRes();



  await getLibraryPapers(req,res);



  expect(res.json)
    .toHaveBeenCalledWith({

      library_id:"lib1",

      papers:[]

    });


});





test("getLibraryPapers should return papers successfully", async()=>{


  LibraryAccessService.getUserId
    .mockResolvedValue("user1");


  LibraryAccessService.verifyLibraryAccess
    .mockResolvedValue();



  PaperService.getLibraryPapersFromDB
    .mockResolvedValue([

      {

        id:"lp1",

        papers:{
          id:"p1",
          title:"Paper"
        }

      }

    ]);



  PaperService.getPaperContents
    .mockResolvedValue({});


  PaperService.getUserNotes
    .mockResolvedValue([]);


  PaperService.getReadingStatuses
    .mockResolvedValue({});


  AuthorService.getAuthorsForPapers
    .mockResolvedValue({});



  const req={

    user:{
      id:"auth1"
    },

    params:{
      library_id:"lib1"
    }

  };


  const res=mockRes();



  await getLibraryPapers(req,res);



  expect(res.json)
    .toHaveBeenCalled();


});






// ================= ALL USER PAPERS =================





test("getAllUserPapers should return empty array when user has no libraries", async()=>{


  LibraryAccessService.getUserId
    .mockResolvedValue("user1");


  LibraryAccessService.getUserAccessibleLibraries
    .mockResolvedValue([]);



  const req={

    user:{
      id:"auth1"
    },

    supabase:{}

  };


  const res=mockRes();



  await getAllUserPapers(req,res);



  expect(res.json)
    .toHaveBeenCalledWith({

      papers:[]

    });


});






// ================= REMOVE PAPER =================





test("removePaperFromLibrary should remove paper successfully", async()=>{


  LibraryAccessService.getUserId
    .mockResolvedValue("user1");


  LibraryAccessService.verifyLibraryAccess
    .mockResolvedValue();



  PaperService.paperExistsInOtherLibraries
    .mockResolvedValue(true);



  const req={

    user:{
      id:"auth1"
    },

    params:{

      library_id:"lib1",

      paper_id:"paper1"

    },

    supabase:{

      from:jest.fn(()=>({

        delete:jest.fn().mockReturnThis(),

        eq:jest.fn().mockReturnThis()

      }))

    }

  };


  const res=mockRes();



  await removePaperFromLibrary(req,res);



  expect(res.json)
    .toHaveBeenCalled();


});





// ================= UPDATE STATUS =================





test("updateReadingStatus should return 400 for invalid status", async()=>{


  const req={

    user:{
      id:"auth1"
    },

    params:{

      library_id:"lib1",

      paper_id:"paper1"

    },

    body:{

      reading_status:"wrong"

    }

  };


  const res=mockRes();



  await updateReadingStatus(req,res);



  expect(res.status)
    .toHaveBeenCalledWith(400);


});







test("updateReadingStatus should update status successfully", async()=>{


  LibraryAccessService.getUserId
    .mockResolvedValue("user1");


  PaperService.upsertReadingStatus
    .mockResolvedValue("read");



  const req={

    user:{
      id:"auth1"
    },

    params:{

      library_id:"lib1",

      paper_id:"paper1"

    },

    body:{

      reading_status:"read"

    }

  };


  const res=mockRes();



  await updateReadingStatus(req,res);



  expect(res.json)
    .toHaveBeenCalled();


});






test("updateReadingStatus should reject user without library access", async()=>{


  LibraryAccessService.getUserId
    .mockResolvedValue("user1");


  LibraryAccessService.verifyLibraryAccess
    .mockRejectedValue({

      code:"ACCESS_DENIED"

    });



  const req={

    user:{
      id:"auth1"
    },

    params:{

      library_id:"lib1",

      paper_id:"paper1"

    },

    body:{

      reading_status:"read"

    }

  };


  const res=mockRes();



  await updateReadingStatus(req,res);



  expect(res.status)
    .toHaveBeenCalledWith(403);


});







// ================= UPDATE NOTE =================





test("updatePaperNote should update note successfully", async()=>{


  LibraryAccessService.getUserId
    .mockResolvedValue("user1");



  PaperService.saveUserNote
    .mockResolvedValue({

      note:"hello"

    });



  const req={

    user:{
      id:"auth1"
    },

    params:{

      library_id:"lib1",

      paper_id:"paper1"

    },

    body:{

      user_note:"Important"

    },

    supabase:{

      from:jest.fn(()=>({

        select:jest.fn().mockReturnThis(),

        eq:jest.fn().mockReturnThis(),

        single:jest.fn()
        .mockResolvedValue({

          data:{
            id:"lp1"
          }

        })

      }))

    }

  };



  const res=mockRes();



  await updatePaperNote(req,res);



  expect(res.json)
    .toHaveBeenCalled();


});






test("updatePaperNote should reject user without access", async () => {
  LibraryAccessService.getUserId.mockResolvedValue("user1");
  LibraryAccessService.verifyLibraryAccess.mockRejectedValue({
    code: "ACCESS_DENIED",
    message: "Access denied"
  });

  const req = {
    user: { id: "auth1" },
    params: {
      library_id: "lib1",
      paper_id: "paper1"
    },
    body: {
      user_note: "test"
    },
    supabase: {
      from: jest.fn().mockReturnThis(), 
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: "lp1" } })
    }
  };

  const res = mockRes();
  await updatePaperNote(req, res);

  expect(res.status).toHaveBeenCalledWith(403);
});

