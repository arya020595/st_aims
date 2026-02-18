const PaddySeedProductionDetail = `
  type PaddySeedProductionDetail {
    id: String!
    uuid: String!
    
    paddySeedProductionUUID: String
    plantingMonthYear: String
    harvestMonthYear: String
    PaddySeed: CropsPaddySeedVariety

    cultivatedArea: Float
    harvestedArea: Float
    production: Float
    price: Float
    totalValue: Float


    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [PaddySeedProductionDetail];
exports.rootTypes = `
  type Query {
    allPaddySeedProductionDetailsByProductionUUID(
      paddySeedProductionUUID: String!
    ): [PaddySeedProductionDetail] 

    tokenizedAllPaddySeedProductionDetailsByProductionUUID(tokenizedParams: String!): String!
  }

  type Mutation {
    createPaddySeedProductionDetail(       

      paddySeedProductionUUID: String
      plantingMonthYear: String
      harvestMonthYear: String
      cropsPaddySeedVarietyUUID: String

      cultivatedArea: Float
      harvestedArea: Float
      production: Float
      price: Float
      totalValue: Float

    ): String!
    updatePaddySeedProductionDetail(
      uuid: String!

      paddySeedProductionUUID: String
      plantingMonthYear: String
      harvestMonthYear: String
      
      cropsPaddySeedVarietyUUID: String

      cultivatedArea: Float
      harvestedArea: Float
      production: Float
      price: Float
      totalValue: Float
        
      
    ): String!
    deletePaddySeedProductionDetail(uuid: String!): String!

    tokenizedCreatePaddySeedProductionDetail(tokenized: String!): String!
    tokenizedUpdatePaddySeedProductionDetail(tokenized: String!): String!
    tokenizedDeletePaddySeedProductionDetail(tokenized: String!): String!
 }
`;
