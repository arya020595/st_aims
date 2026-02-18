const CropsFruit = `
   scalar JSON

   type CropsFruit {
      id: String!
      uuid: String
      fruitId: String

      localName: String
      englishName: String
      cropName: String

      
      CropsCategory: CropsCategory
      Season: Season

      countCropsFruitDetails: Int
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CropsFruit];
exports.rootTypes = `
   type Query {
      allCropsFruits: [CropsFruit]
      tokenizedAllCropsFruits: String!
      searchAllCropsFruits(name: String): String!
   }

   type Mutation {
      createCropsFruit(       
        localName: String
        englishName: String
        cropsCategoryUUID: String!
        seasonUUID: String
        cropName: String
      ): String!
      updateCropsFruit(
        uuid: String!
        localName: String
        englishName: String
        cropsCategoryUUID: String!
        seasonUUID: String
        cropName: String
      ): String!
      deleteCropsFruit(uuid: String!): String!
      exportCropsFruit: Buffer
       tokenizedCreateCropsFruit(tokenized: String!): String!
       tokenizedUpdateCropsFruit(tokenized: String!): String!
       tokenizedDeleteCropsFruit(tokenized: String!): String!
   }
`;
