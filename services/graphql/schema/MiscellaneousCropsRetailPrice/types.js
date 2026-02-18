const MiscellaneousCropsRetailPrice = `
   scalar JSON

   type MiscellaneousCropsRetailPrice {
      id: String!
      uuid: String!
      
      district: String
      MiscellaneousCrops: MiscellaneousCrops
      FarmLocation: FarmLocation
      monthYear: String
      
      description: String
      bruneiMuaraPrice: Float
      tutongPrice: Float
      belaitPrice: Float
      temburongPrice: Float
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [MiscellaneousCropsRetailPrice];
exports.rootTypes = `
   type Query {
      allMiscellaneousCropsRetailPrices(monthYear: String): [MiscellaneousCropsRetailPrice]
      tokenizedAllMiscellaneousCropsRetailPrices(
         monthYear: String!,
         pageIndex: Int,
         pageSize: Int, 
         filters: String,
      ): String!
      countAllMiscellaneousCropsRetailPrices(monthYear: String!): Int!
   }

   type Mutation {
      createMiscellaneousCropsRetailPrice(
        miscellaneousCropUUID: String
        district: String

        monthYear: String!
        
        description: String
        bruneiMuaraPrice: Float
         tutongPrice: Float
         belaitPrice: Float
         temburongPrice: Float
      ): String!
      updateMiscellaneousCropsRetailPrice(
        uuid: String!
        miscellaneousCropUUID: String
        district: String

        monthYear: String
        
        description: String
        bruneiMuaraPrice: Float
         tutongPrice: Float
         belaitPrice: Float
         temburongPrice: Float
      ): String!
      deleteMiscellaneousCropsRetailPrice(uuid: String!): String!

      importMiscellaneousRetailPrice(
         excelBase64: String!
         year: Int!
         month: Int!
         fileName: String!
      ): String!

      exportsMiscellaneousRetailPrice(
         monthYear: String!
      ): String!

      tokenizedCreateMiscellaneousCropsRetailPrice(tokenized: String!): String!
      tokenizedUpdateMiscellaneousCropsRetailPrice(tokenized: String!): String!
      tokenizedDeleteMiscellaneousCropsRetailPrice(tokenized: String!): String!

      generateMiscellaneousCropsRetailPriceTemplate: String!
      tokenizedCreateManyMiscellaneousCropsRetailPrice(tokenized: String!): String!
      
   }
`;
