const PaddyProduction = `
  type PaddyProduction {
    id: String!
    uuid: String!
    plantingDate: String!
    harvestedDate: String

    FarmerProfile: FarmerProfile
    FarmProfile: FarmProfile
    Paddy: CropsPaddyVariety
    Season: Season
    
    totalArea: Float
    cultivatedArea: Float
    productionUnderPaddyScheme: Float
    productionUnderNonPaddyScheme: Float
    totalPaddyProduction: Float    

    schemePrice: Float
    marketPrice: Float
    schemeValue: Float
    totalValue: Float            

    plantingSeasonDetail: String

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [PaddyProduction];
exports.rootTypes = `
  type Query {
    allPaddyProductions(monthYear: String): [PaddyProduction] 
    tokenizedAllPaddyProductions(
      monthYear: String!
      pageIndex: Int,
      pageSize: Int, 
      filters: String,
      ): String!

      countAllPaddyProductions(monthYear: String!, filters: String,): Int!
  }

  type Mutation {
    createPaddyProduction(       
      plantingDate: String!
      harvestedDate: String

      farmerUUID: String!
      farmAreaId: String!

      cropsPaddyVarietyUUID: String
      
      totalArea: Float
      cultivatedArea: Float
      productionUnderPaddyScheme: Float
      productionUnderNonPaddyScheme: Float
      totalPaddyProduction: Float    

      schemePrice: Float
      marketPrice: Float
      schemeValue: Float
      totalValue: Float            

      plantingSeasonDetail: String
      seasonUUID: String

    ): String!
    updatePaddyProduction(
      uuid: String!
      plantingDate: String!
      harvestedDate: String

      farmerUUID: String
      farmAreaId: String
      
      cropsPaddyVarietyUUID: String
      
      totalArea: Float
      cultivatedArea: Float
      productionUnderPaddyScheme: Float
      productionUnderNonPaddyScheme: Float
      totalPaddyProduction: Float    

      schemePrice: Float
      marketPrice: Float
      schemeValue: Float
      totalValue: Float            

      plantingSeasonDetail: String
      seasonUUID: String
    ): String!
    deletePaddyProduction(uuid: String!): String!
    exportPaddyProduction(
      monthYear: String!
      farmerUUID: String
      farmAreaId: String
      cropsPaddyVarietyUUID: String
      farmerName: String
    ): String!

    tokenizedCreatePaddyProduction(tokenized: String!): String!
    tokenizedUpdatePaddyProduction(tokenized: String!): String!
    tokenizedDeletePaddyProduction(tokenized: String!): String!
 }
`;
