const PaddySeedlingProduction = `
  type PaddySeedlingProduction {
    id: String!
    uuid: String!
    date: String!

    FarmerProfile: FarmerProfile
    FarmProfile: FarmProfile
    Paddy: CropsPaddyVariety
    
    noOfSeeds: Float
    noOfSeedsExported: Float
    totalTraysProduced: Float
    totalTraysSold: Float
    
    seedlingReminder: Float
    totalTraysCompensated: Float
    remarks: String

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [PaddySeedlingProduction];
exports.rootTypes = `
  type Query {
    allPaddySeedlingProductions(monthYear: String): [PaddySeedlingProduction] 
    tokenizedAllPaddySeedlingProductions(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String!
    countAllPaddySeedlingProductions(monthYear: String!, filters: String): Int!
  }

  type Mutation {
    createPaddySeedlingProduction(       
      date: String!

      farmerUUID: String!
      farmAreaId: String!

      cropsPaddyVarietyUUID: String
      
      noOfSeeds: Float
      noOfSeedsExported: Float
      totalTraysProduced: Float
      totalTraysSold: Float
      

      seedlingReminder: Float
      totalTraysCompensated: Float
      

    ): String!
    updatePaddySeedlingProduction(
      uuid: String!
      date: String!

      farmerUUID: String
      farmAreaId: String
      
      cropsPaddyVarietyUUID: String
      
      noOfSeeds: Float
      noOfSeedsExported: Float
      totalTraysProduced: Float
      totalTraysSold: Float
      


      seedlingReminder: Float
      totalTraysCompensated: Float
      
      
    ): String!
    deletePaddySeedlingProduction(uuid: String!): String!
    exportPaddySeedlingProduction(
      monthYear: String!
      farmerUUID: String
      farmAreaId: String
      cropsPaddyVarietyUUID: String
    ): String

    tokenizedCreatePaddySeedlingProduction(tokenized: String!): String!
    tokenizedUpdatePaddySeedlingProduction(tokenized: String!): String!
    tokenizedDeletePaddySeedlingProduction(tokenized: String!): String!
 }
`;
