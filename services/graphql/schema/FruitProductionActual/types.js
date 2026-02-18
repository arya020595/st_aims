const FruitProductionActual = `
  type FruitProductionActual {
    id: String!
    uuid: String!
    monthYear: String!

    FarmerProfile: FarmerProfile
    FarmProfile: FarmProfile
    Fruit: CropsFruit
    
    production: Float
    cultivatedArea: Float
    farmPrice: Float
    totalFarmValue: Float
    address: String

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [FruitProductionActual];
exports.rootTypes = `
  type Query {
    allFruitProductionActuals(monthYear: String): [FruitProductionActual]
    tokenizedAllFruitProductionActuals(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String! 
    countAllFruitProductionActual(monthYear: String!, filters: String): Int!
  }

  type Mutation {
    createFruitProductionActual(       
      monthYear: String!

      farmerUUID: String!
      farmAreaId: String!

      fruitUUID: String
      
      production: Float
      cultivatedArea: Float
      farmPrice: Float
      totalFarmValue: Float
      address: String

    ): String!
    updateFruitProductionActual(
      uuid: String!
      monthYear: String!

      farmerUUID: String
      farmAreaId: String
      
      fruitUUID: String
      
      production: Float
      cultivatedArea: Float
      farmPrice: Float
      totalFarmValue: Float
      address: String
    ): String!
    deleteFruitProductionActual(uuid: String!): String!
    exportFruitProductionActual(
      monthYear: String!
      farmerUUID: String
      farmAreaId: String
      fruitUUID: String
      farmerName: String
      ): String!

      tokenizedCreateFruitProductionActual(tokenized: String!): String!
      tokenizedUpdateFruitProductionActual(tokenized: String!): String!
      tokenizedDeleteFruitProductionActual(tokenized: String!): String!

      tokenizedCreateManyFruitProductionActual(tokenized: String!): String!
 }
`;
