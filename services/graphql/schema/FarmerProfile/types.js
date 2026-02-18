const FarmerProfile = `
   scalar JSON
   type PlantingSystemJSON {
      data: JSON
   }

   type FarmingSystemJSON {
      data: JSON
   }

   type FarmerProfile {
      id: String!
      uuid: String!
      farmerName: String!
      otherName: String!
      farmerCompanyName: String!
      
      companyId: String
      companyRegNo: String!
      companyRegDate: String! 
      rocbnRegNo: String!     
      companyAddress: String! 
      mailingAddress: String 
      premiseAddress: String 
      socialMediaAcc: String 
      smeCategory: String    
      managerName: String!    


      positionUUID: String
      positionName: String
      
      
      dateOfBirth: String!    
      icPassportNo: String!   
      icColour: String!       
      mobileNo: String       
      telephoneNo: String    
      
      gender: String         
      emailAddress: String   
      directorOthers: String 

      noOfLabourTotal: Int
      unskilledLocal: Int
      semiSkilledLocal: Int
      skilledLocal: Int
      expertLocal: Int
      noOfLabourForeigner: Int
      unskilledForeigner: Int
      semiSkilledForeigner: Int
      skilledForeigner: Int
      expertForeigner: Int

      companyStatusId: String!
      companyStatusName: String!
      
      currStatusId: String!
      currStatusName: String!

      supportSystem: [String]
      plantingSystem: [String]
      farmingSystem: [String]

      typeOfSupportId: String!
      supportName: String!


      raceId: String!
      raceName: String!

      typeCompanyRegId: String!
      typeCompanyRegName: String!

      totalAnnualRevenue: Float
      totalAssets: Float

      uploadFile: String
      remarks: String      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [FarmerProfile];
exports.rootTypes = `
   scalar JSON
   type Query {
      allFarmerProfiles: [FarmerProfile]

      allFarmerProfilesByCompanyRegNo: [FarmerProfile]
      getCountFarmerProfiles(filters: String): Int
      tokenizedAllFarmerProfile(
         pageIndex: Int
         pageSize: Int 
         filters: String
      ): String!
      tokenizedAllFarmerProfilesByCompanyRegNo(
         pageIndex: Int
         pageSize: Int 
         filters: String   
      ): String!

      searchAllFarmerProfiles(name: String): String!
      searchFarmerProfileByCompanyRegNo(name: String): String!
      searchAllFarmerProfilesByFarmerName(name: String): String!

      countAllFarmerProfileByCompanyRegNo(filters: String): Int! 
   }

   type Mutation {
      createFarmerProfile(
        input: JSON      
      ): String!
      updateFarmerProfile(
        uuid: String!
        input:  JSON    
      ): String!
      deleteFarmerProfile(uuid: String!): String!
      exportFarmerProfile: Buffer

       tokenizedCreateFarmerProfile(input: JSON): String!
       tokenizedUpdateFarmerProfile(input: JSON): String!
       tokenizedDeleteFarmerProfile(tokenized: String!): String!
   }
`;
