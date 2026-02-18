const CropRetailPrice = `
   scalar JSON

   type CropRetailPrice {
      id: String!
      uuid: String!
      
      FarmLocation: FarmLocation
      monthYear: String
      item: String
      code: String
      description: String
      retailPrice: Float
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CropRetailPrice];
exports.rootTypes = `
   type Query {
      allCropRetailPrices: [CropRetailPrice]
   }

   type Mutation {
      createCropRetailPrice(
        farmLocationUUID: String!
        monthYear: String!
        item: String
        code: String
        description: String
        retailPrice: Float!
      ): String!
      updateCropRetailPrice(
        uuid: String!
        farmLocationUUID: String
        monthYear: String
        item: String
        code: String
        description: String
        retailPrice: Float!
      ): String!
      deleteCropRetailPrice(uuid: String!): String!
   }
`;
