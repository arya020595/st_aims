const FruitProductionEstimated = `
  type FruitProductionEstimated {
    id: String!
    uuid: String!
    monthYear: String!

    FarmerProfile: FarmerProfile
    FarmProfile: FarmProfile
    Fruit: CropsFruit
    
    noOfFruitTrees: Float
    economicLifeYear: Float
    estimatedYield: Float

    production: Float
    cultivatedArea: Float
    farmPrice: Float
    totalFarmValue: Float
    address: String

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [FruitProductionEstimated];
exports.rootTypes = `
  type Query {
    allFruitProductionEstimateds(monthYear: String): [FruitProductionEstimated] 
    tokenizedAllFruitProductionEstimateds(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String!

    countAllFruitProductionEstimateds(monthYear: String!, filters: String): Int!
  }

  type Mutation {
    createFruitProductionEstimated(       
      monthYear: String!

      farmerUUID: String!
      farmAreaId: String!

      fruitUUID: String
      
      noOfFruitTrees: Float
      economicLifeYear: Float
      estimatedYield: Float

      production: Float
      cultivatedArea: Float
      farmPrice: Float
      totalFarmValue: Float
      address: String

    ): String!
    updateFruitProductionEstimated(
      uuid: String!
      monthYear: String!

      farmerUUID: String
      farmAreaId: String
      
      fruitUUID: String
      
      noOfFruitTrees: Float
      economicLifeYear: Float
      estimatedYield: Float

      production: Float
      cultivatedArea: Float
      farmPrice: Float
      totalFarmValue: Float
      address: String
    ): String!
    deleteFruitProductionEstimated(uuid: String!): String!
    exportFruitProductionEstimated(
      monthYear: String!
      farmerUUID: String
      farmAreaId: String
      fruitUUID: String
      farmerName: String
      ): String!

      tokenizedCreateFruitProductionEstimated(tokenized: String!): String!
      tokenizedUpdateFruitProductionEstimated(tokenized: String!): String!
      tokenizedDeleteFruitProductionEstimated(tokenized: String!): String!
 }
`;
