const MilledRiceProduction = `
  type MilledRiceProduction {
    id: String!
    uuid: String!
    
    date: String
    store: String
    batchNumber: String

    MilledRiceLocation: MilledRiceLocation
    Paddy: CropsPaddyVariety
    
    paddyNoOfSacks: Float
    paddyKgSacks: Int
    totalPaddy: Float
  
    brokenRiceNoOfSacks: Float
    brokenRiceKgSacks: Int
    brokenRicePricePerKg: Float
    totalBrokenRice: Float
    brokenRiceTotalValue: Float
  
    headRiceNoOfSacks: Float
    headRiceKgSacks: Int
    headRicePricePerKg: Float
    totalHeadRice: Float
    headRiceTotalValue: Float
  
    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [MilledRiceProduction];
exports.rootTypes = `
  type Query {
    allMilledRiceProductions(monthYear: String): [MilledRiceProduction]
    tokenizedAllMilledRiceProductions(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String!
    countAllMilledRiceProductions(monthYear: String!, filters: String): Int!
  }

  type Mutation {
    createMilledRiceProduction(       
      date: String
      store: String
      batchNumber: String

      millingLocationUUID: String!
      cropsPaddyVarietyUUID: String!

      paddyNoOfSacks: Float
      paddyKgSacks: Int
      totalPaddy: Float
    
      brokenRiceNoOfSacks: Float
      brokenRiceKgSacks: Int
      brokenRicePricePerKg: Float
      totalBrokenRice: Float
      brokenRiceTotalValue: Float
    
      headRiceNoOfSacks: Float
      headRiceKgSacks: Int
      headRicePricePerKg: Float
      totalHeadRice: Float
      headRiceTotalValue: Float
      
    ): String!
    updateMilledRiceProduction(
      uuid: String!
      date: String
      store: String
      batchNumber: String

      millingLocationUUID: String!
      cropsPaddyVarietyUUID: String!

      paddyNoOfSacks: Float
      paddyKgSacks: Int
      totalPaddy: Float
    
      brokenRiceNoOfSacks: Float
      brokenRiceKgSacks: Int
      brokenRicePricePerKg: Float
      totalBrokenRice: Float
      brokenRiceTotalValue: Float
    
      headRiceNoOfSacks: Float
      headRiceKgSacks: Int
      headRicePricePerKg: Float
      totalHeadRice: Float
      headRiceTotalValue: Float
      
    ): String!
    deleteMilledRiceProduction(uuid: String!): String!
    exportMilledRiceProduction(
      monthYear: String!
      cropsPaddyVarietyUUID: String
      store: String
      millingLocationUUID: String
      batchNumber: String
    ): String!

    tokenizedCreateMilledRiceProduction(tokenized: String!): String!
    tokenizedUpdateMilledRiceProduction(tokenized: String!): String!
    tokenizedDeleteMilledRiceProduction(tokenized: String!): String!
 }
`;
