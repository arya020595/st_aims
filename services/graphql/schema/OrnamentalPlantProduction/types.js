const OrnamentalPlantProduction = `
  type OrnamentalPlantProduction {
    id: String!
    uuid: String!
    monthYear: String!

    FarmerProfile: FarmerProfile
    FarmProfile: FarmProfile
    OrnamentalPlant: CropsOrnamentalPlant
    SellingLocation: CropsSellingLocation
    
    quantity: Float
    sellingPrice: Float
    totalRevenue: Float
    cultivatedArea: Float
    address: String

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [OrnamentalPlantProduction];
exports.rootTypes = `
  type Query {
    allOrnamentalPlantProductions(monthYear: String): [OrnamentalPlantProduction] 
    tokenizedAllOrnamentalPlantProductions(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String! 
    countAllOrnamentalPlantProductions(monthYear: String!, filters: String): Int!
  }

  type Mutation {
    createOrnamentalPlantProduction(       
      monthYear: String!

      farmerUUID: String!
      farmAreaId: String!

      ornamentalPlantUUID: String
      
      quantity: Float
      sellingPrice: Float
      totalRevenue: Float
      cultivatedArea: Float
      address: String
      sellingLocationUUID: String

    ): String!
    updateOrnamentalPlantProduction(
      uuid: String!
      monthYear: String!

      farmerUUID: String
      farmAreaId: String
      
      ornamentalPlantUUID: String
      
      quantity: Float
      sellingPrice: Float
      totalRevenue: Float
      cultivatedArea: Float
      address: String
      
      sellingLocationUUID: String
    ): String!
    deleteOrnamentalPlantProduction(uuid: String!): String!

    exportOrnamentalProduction(
      monthYear: String!
      farmerUUID: String
      farmAreaId: String
      ornamentalPlantUUID: String
      farmerName: String
   ): String

   tokenizedCreateOrnamentalPlantProduction(tokenized: String!): String!
   tokenizedUpdateOrnamentalPlantProduction(tokenized: String!): String!
   tokenizedDeleteOrnamentalPlantProduction(tokenized: String!): String!
   tokenizedCreateManyOrnamentalPlantProduction(tokenized: String!): String!
 }
`;
