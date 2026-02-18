const FruitRetailPrice = `
   scalar JSON

   type FruitRetailPrice {
      id: String!
      uuid: String!
      
      Fruit: CropsFruit
      FarmLocation: FarmLocation
      monthYear: String
      district: String
      
      description: String
      bruneiMuaraPrice: Float
      tutongPrice: Float
      belaitPrice: Float
      temburongPrice: Float
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [FruitRetailPrice];
exports.rootTypes = `
   type Query {
      allFruitRetailPrices(monthYear: String): [FruitRetailPrice]
      tokenizedAllFruitRetailPrices(
         monthYear: String!,
         pageIndex: Int,
         pageSize: Int, 
         filters: String,
      ): String!
      countAllFruitRetailPrices(monthYear: String!): Int!
   }

   type Mutation {
      createFruitRetailPrice(
        fruitUUID: String
        district: String

        monthYear: String!
        description: String
         bruneiMuaraPrice: Float
         tutongPrice: Float
         belaitPrice: Float
         temburongPrice: Float
      ): String!
      updateFruitRetailPrice(
        uuid: String!
        fruitUUID: String
        district: String

        monthYear: String
        description: String
         bruneiMuaraPrice: Float
         tutongPrice: Float
         belaitPrice: Float
         temburongPrice: Float
      ): String!
      deleteFruitRetailPrice(uuid: String!): String!

      importFruitRetailPrice(
         excelBase64: String!
         year: Int!
         month: Int!
         fileName: String!
      ): String!

      exportFruitRetailPrice(
         monthYear: String!
      ): String

      tokenizedCreateFruitRetailPrice(tokenized: String!): String!
      tokenizedUpdateFruitRetailPrice(tokenized: String!): String!
      tokenizedDeleteFruitRetailPrice(tokenized: String!): String!

      generateFruitRetailPriceTemplate: String!
      tokenizedCreateManyFruitRetailPrice(tokenized: String!): String!
   }
`;
