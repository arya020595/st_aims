const VegetableProduction = `
  type VegetableProduction {
    id: String!
    uuid: String!
    monthYear: String!

    FarmerProfile: FarmerProfile
    FarmProfile: FarmProfile
    Vegetable: CropsVegetable
    
    address: String
    production: Float
    cultivatedArea: Float
    farmPrice: Float
    totalFarmValue: Float

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [VegetableProduction];
exports.rootTypes = `
  type Query {
    allVegetableProductions(monthYear: String): [VegetableProduction] 
    tokenizedAllVegetableProductions(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String!


    
    countVegetableProduction(monthYear: String!, filters: String): Int!
  }

  type Mutation {
    createVegetableProduction(       
      monthYear: String!

      farmerUUID: String!
      farmAreaId: String!

      address: String
      vegetableUUID: String
      
      production: Float
      cultivatedArea: Float
      farmPrice: Float
      totalFarmValue: Float

    ): String!
    updateVegetableProduction(
      uuid: String!
      monthYear: String!

      farmerUUID: String
      farmAreaId: String
      
      address: String
      vegetableUUID: String
      
      production: Float
      cultivatedArea: Float
      farmPrice: Float
      totalFarmValue: Float
    ): String!
    deleteVegetableProduction(uuid: String!): String!
    exportVegetableProduction(
      monthYear: String!
      farmerUUID: String
      farmAreaId: String
      vegetableUUID: String
      farmerName: String
      ): String!

      tokenizedCreateVegetableProduction(tokenized: String!): String!
      tokenizedUpdateVegetableProduction(tokenized: String!): String!
      tokenizedDeleteVegetableProduction(tokenized: String!): String!
      
      tokenizedCreateManyVegetableProduction(tokenized: String!): String!
 }
`;
