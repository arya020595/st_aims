const AgrifoodCompanyProfile = `
   scalar JSON
  

   type AgrifoodCompanyProfile {
      id: String!
      uuid: String!
      companyId: String
      companyName: String
      companyRegNo: String
      companyRegDate: String
      rocbnRegNo: String
      companyAddress: String
      mailingAddress: String
      managerName: String

      positionUUID: String
      positionName: String

      otherMembers: String
      supportMembers: String
      machineryIds: [String]
      typeOfAwardIds: [String]
      machineryNames: String

      icPassportNo: String
      icColour: String

      dateOfBirth: String

      premiseAddress: String
      premiseStructure: String

      socialMediaAcc: String
      smeCategory: String

      mobileNo: String
      telephoneNo: String
      gender: String
      emailAddress: String
      directorOthers: String

      companyStatusId: String
      companyStatusName: String

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

      currStatusId: String!
      currStatusName: String!

      raceId: String!
      raceName: String!

      typeCompanyRegId: String!
      typeCompanyRegName: String!

      remarks: String
      uploadFile: String

      totalAssets: Float
      totalAnnualRevenue: Float

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [AgrifoodCompanyProfile];
exports.rootTypes = `
   scalar JSON
   type Query {
      allAgrifoodCompanyProfiles: [AgrifoodCompanyProfile]
      countAgrifoodCompanyProfiles(filters: String): Int
      tokenizedAllAgrifoodCompanyProfiles(
         pageIndex: Int
         pageSize: Int
         filters: String
      ): String!
      searchAllAgrifoodCompanyProfiles(name: String): String!
      getAgrifoodCompanyProfile(uuid: String!): AgrifoodCompanyProfile
   }

   type Mutation {
      createAgrifoodCompanyProfile(
        input: JSON      
      ): String!
      updateAgrifoodCompanyProfile(
        uuid: String!
        input:  JSON    
      ): String!
      deleteAgrifoodCompanyProfile(uuid: String!): String!
      exportAgrifoodCompanyProfile: Buffer
      tokenizedCreateAgrifoodCompanyProfile(input: JSON): String!
      tokenizedUpdateAgrifoodCompanyProfile(input: JSON): String!
      tokenizedDeleteAgrifoodCompanyProfile(tokenized: String!): String!
   }
`;
