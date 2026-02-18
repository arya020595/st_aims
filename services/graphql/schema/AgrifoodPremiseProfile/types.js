const AgrifoodPremiseProfile = `
   scalar JSON
  

   type AgrifoodPremiseProfile {
      id: String!
      uuid: String!
      premiseId: String

      companyUUID: String
      companyName: String
  
      ocbsRefNo: String
      partnerInvestor: String
      supervisorName: String
      otherSupervisorName: String
      premiseAddress: String
      premiseStructure: String
      premiseSize: Int

      farmLocationUUID: String
      farmMukim: String
      farmVillage: String
      farmArea: String
      farmDistrict: String

      farmCategory: String
      landApprovalDate: String
      allowedActivites: String
      expiryDate: String

      awardTypeId: String
      awardTypeName: String

      contractStatusUUID: String
      contractStatusName: String

      commencementDate: String
      landSize: Int
      factorySize: Int

      agrifoodProductCategoryIds: [String]
      agrifoodProductSubCategoryIds: [String]
      machineryIds: [String]

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

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [AgrifoodPremiseProfile];
exports.rootTypes = `
   scalar JSON
   type Query {
      allAgrifoodPremiseProfiles: [AgrifoodPremiseProfile]
      countAgrifoodPremiseProfiles(filters: String): Int
      tokenizedAllAgrifoodPremiseProfiles: String!

      tokenizedAllAgrifoodPremiseProfilesPaginated(
         pageIndex: Int,
         pageSize: Int, 
         filters: String,
      ): String
   }

   type Mutation {
      createAgrifoodPremiseProfile(
        input: JSON      
      ): String!
      updateAgrifoodPremiseProfile(
        uuid: String!
        input:  JSON    
      ): String!
      deleteAgrifoodPremiseProfile(uuid: String!): String!
      exportPremiseProfile: String

      tokenizedCreateAgrifoodPremiseProfile(input: JSON): String!
      tokenizedUpdateAgrifoodPremiseProfile(input: JSON): String!
      tokenizedDeleteAgrifoodPremiseProfile(tokenized: String!): String!
   }
`;
