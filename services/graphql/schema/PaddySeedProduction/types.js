const PaddySeedProduction = `
  type PaddySeedProduction {
    id: String!
    uuid: String!
    
    plantingMonthYear: String
    harvestMonthYear: String

    FarmerProfile: FarmerProfile
    FarmProfile: FarmProfile
    Season: Season
    plantingSeasonDetail: String
    
    
    totalPaddySeedCultivatedArea: Float
    totalPaddySeedHarvestedArea: Float
    totalPaddySeedProduction: Float
    totalPaddySeedValue: Float

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [PaddySeedProduction];
exports.rootTypes = `
  type Query {
    allPaddySeedProductions(monthYear: String): [PaddySeedProduction] 
    tokenizedAllPaddySeedProductions(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String!
    countPaddySeedProductions(monthYear: String!, filters: String): Int!
  }

  type Mutation {
    createPaddySeedProduction(       
      plantingMonthYear: String
      harvestMonthYear: String
      
      farmerUUID: String!
      farmAreaId: String!
      seasonUUID: String
      plantingSeasonDetail: String  

      totalPaddySeedCultivatedArea: Float
      totalPaddySeedHarvestedArea: Float
      totalPaddySeedProduction: Float
      totalPaddySeedValue: Float

    ): String!
    updatePaddySeedProduction(
      uuid: String!
      plantingMonthYear: String
      harvestMonthYear: String
        
      farmerUUID: String!
      farmAreaId: String!
      seasonUUID: String
      plantingSeasonDetail: String

      totalPaddySeedCultivatedArea: Float
      totalPaddySeedHarvestedArea: Float
      totalPaddySeedProduction: Float
      totalPaddySeedValue: Float
      
    ): String!
    deletePaddySeedProduction(uuid: String!): String!
    exportPaddySeedProduction(
      monthYear: String!
      farmerUUID: String
      farmAreaId: String
      farmerName: String
    ): String

    tokenizedCreatePaddySeedProduction(tokenized: String!): String!
    tokenizedUpdatePaddySeedProduction(tokenized: String!): String!
    tokenizedDeletePaddySeedProduction(tokenized: String!): String!
 }
`;
