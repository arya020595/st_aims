const VegetableRetailPrice = `
   scalar JSON

   type VegetableRetailPrice {
      id: String!
      uuid: String!
      
      Vegetable: CropsVegetable
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
exports.customTypes = [VegetableRetailPrice];
exports.rootTypes = `
   type Query {
      allVegetableRetailPrices(monthYear: String): [VegetableRetailPrice]
      tokenizedAllVegetableRetailPrices(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
      ): String!
      countAllVegetableRetailPrices(monthYear: String!): Int!
   }

   type Mutation {
      createVegetableRetailPrice(
        vegetableUUID: String
        #farmLocationUUID: String!
        district: String

        monthYear: String!
        
        description: String
        bruneiMuaraPrice: Float
        tutongPrice: Float
        belaitPrice: Float
        temburongPrice: Float
      ): String!
      updateVegetableRetailPrice(
        uuid: String!
        vegetableUUID: String
        #farmLocationUUID: String
        district: String
        monthYear: String
        
        description: String
        bruneiMuaraPrice: Float
        tutongPrice: Float
        belaitPrice: Float
        temburongPrice: Float
      ): String!
      deleteVegetableRetailPrice(uuid: String!): String!

      importVegetableRetailPrice(
         excelBase64: String!
         year: Int!
         month: Int!
         fileName: String!
      ): String!

      exportVegetableRetailPrice(
         monthYear: String!
      ): String!

      tokenizedCreateVegetableRetailPrice(tokenized: String!): String!
      tokenizedUpdateVegetableRetailPrice(tokenized: String!): String!
      tokenizedDeleteVegetableRetailPrice(tokenized: String!): String!

      generateVegetableRetailPriceTemplate: String!
      tokenizedCreateManyVegetableRetailPrice(tokenized: String!): String!
   }
`;
