const CutFlowerProduction = `
  type CutFlowerProduction {
    id: String!
    uuid: String!
    monthYear: String!

    FarmerProfile: FarmerProfile
    FarmProfile: FarmProfile
    CutFlower: CropsCutFlower
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
exports.customTypes = [CutFlowerProduction];
exports.rootTypes = `
  type Query {
    allCutFlowerProductions(monthYear: String): [CutFlowerProduction]
    tokenizedAllCutFlowerProductions(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String! 
    countAllCutFlowerProductions(monthYear: String!, filters: String): Int!
  }

  type Mutation {
    createCutFlowerProduction(       
      monthYear: String!

      farmerUUID: String!
      farmAreaId: String!

      cutFlowerUUID: String
      
      quantity: Float
      sellingPrice: Float
      totalRevenue: Float
      cultivatedArea: Float
      address: String
      sellingLocationUUID: String

    ): String!
    updateCutFlowerProduction(
      uuid: String!
      monthYear: String!

      farmerUUID: String
      farmAreaId: String
      
      cutFlowerUUID: String
      
      quantity: Float
      sellingPrice: Float
      totalRevenue: Float
      cultivatedArea: Float
      address: String
      
      sellingLocationUUID: String
    ): String!
    deleteCutFlowerProduction(uuid: String!): String!

    exportCutFlower(
      monthYear: String!
      farmerUUID: String
      farmAreaId: String
      cutFlowerUUID: String
      farmerName: String
   ): String

   tokenizedCreateCutFlowerProduction(tokenized: String!): String!
   tokenizedUpdateCutFlowerProduction(tokenized: String!): String!
   tokenizedDeleteCutFlowerProduction(tokenized: String!): String!
   tokenizedCreateManyCutFlowerProduction(tokenized: String!): String!
 }
`;
