const FarmProfile = `
   type Comodity {
      vegetables: Boolean
      fruits: Boolean
      paddy: Boolean
      ornamentalPlants: Boolean
   }

   type Addresses {
      uuid: String!
      address: String
   }
   type FarmProfile {
      id: String!
      uuid: String!
      farmId: String

      farmerUUID: String!
      farmerCompanyName: String!
      farmerCompanyId: String!
      ocbsRefNo: String
      farmerName: String
      otherFarmerName: String
      partnerInvestor: String
      address: String

      addresses: [Addresses]

      farmLocationUUID: String
      farmMukim: String
      farmVillage: String
      farmArea: String
      farmDistrict: String

      farmCategory: String
      landApprovalDate: String

      ownerShipStatusUUID: String
      ownerShipStatusName: String


      contractStatusName: String
      contractStatusUUID: String

      expiryDate: String
      farmingStartDate: String
      farmSize: Int
      plantableArea: Int

      irigationStatusUUID: String
      irigationStatusName: String

      typeOfComodityId: [String]

      awardTypeId: String
      awardTypeName: String


      operationDate: String
      modernTechnology: String
      offersTypes: String
      marketingAreas: String
      remarks: String
      companyTerms: String

      ############################
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
exports.customTypes = [FarmProfile];
exports.rootTypes = `
   scalar JSON
   type Query {
      allFarmProfiles: [FarmProfile]
      allFarmProfilesByFarmer(farmerUUID: String): [FarmProfile]
      countFarmProfile(filters: String): Int!
      tokenizedAllFarmProfile: String!
      tokenizedAllFarmProfilePaginated(
         pageIndex: Int
         pageSize: Int
         filters: String
      ): String
      tokenizedAllFarmProfilesByFarmer(
         tokenizedParams: String
         pageIndex: Int
         pageSize: Int
         filters: String

         onPage: String
      ): String!

      countFarmProfilesByFarmer(filters: String): Int!
      getFarmAddressByCompanyUUIDAndFarmArea(farmerUUID: String!, farmArea: String!): [String]!
      searchFarmProfile(name: String): String!
      searchFarmProfileByFarmerName(farmerName: String):String!

      isFarmerCheck: Boolean
      }

   type Mutation {
      createFarmProfile(
        input: JSON      
      ): String!
      updateFarmProfile(
        uuid: String!
        input:  JSON    
      ): String!
      deleteFarmProfile(uuid: String!): String!
      exportFarmProfile: Buffer

      tokenizedCreateFarmProfile(input: JSON): String!
      tokenizedUpdateFarmProfile(input: JSON): String!
      tokenizedDeleteFarmProfile(tokenized: String!): String!
   }
`;
