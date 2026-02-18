const MiscellaneousProduction = `
  type MiscellaneousProduction {
    id: String!
    uuid: String!
    monthYear: String!

    FarmerProfile: FarmerProfile
    FarmProfile: FarmProfile
    MiscellaneousCrops: MiscellaneousCrops
    
    production: Float
    cultivatedArea: Float
    farmPrice: Float
    totalFarmValue: Float
    address: String

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [MiscellaneousProduction];
exports.rootTypes = `
  type Query {
    allMiscellaneousProductions(monthYear: String): [MiscellaneousProduction] 
    tokenizedAllMiscellaneousProductions(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String!
    countAllMiscellaneousProductions(monthYear: String!, filters: String): Int!
  }

  type Mutation {
    createMiscellaneousProduction(       
      monthYear: String!

      farmerUUID: String!
      farmAreaId: String!

      miscellaneousCropUUID: String
      
      production: Float
      cultivatedArea: Float
      farmPrice: Float
      totalFarmValue: Float
      address: String

    ): String!
    updateMiscellaneousProduction(
      uuid: String!
      monthYear: String!

      farmerUUID: String
      farmAreaId: String
      
      miscellaneousCropUUID: String
      
      production: Float
      cultivatedArea: Float
      farmPrice: Float
      totalFarmValue: Float
      address: String
    ): String!
    deleteMiscellaneousProduction(uuid: String!): String!
    exportMiscellaneousProduction(
      monthYear: String!
      farmerUUID: String
      farmAreaId: String
      miscellaneousCropUUID: String
      farmerName: String
    ): String!

    tokenizedCreateMiscellaneousProduction(tokenized: String!): String!
    tokenizedUpdateMiscellaneousProduction(tokenized: String!): String!
    tokenizedDeleteMiscellaneousProduction(tokenized: String!): String!
    tokenizedCreateManyMiscellaneousProduction(tokenized: String!): String!
 }
`;
