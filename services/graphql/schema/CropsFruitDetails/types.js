const CropsFruitDetail = `
   scalar JSON

   type CropsFruitDetail {
      id: String!
      uuid: String!

      cropFruitId: String!
      
      economicLife: Float
      estimatedYield: Float

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CropsFruitDetail];
exports.rootTypes = `
   type Query {
      allCropsFruitDetailByCropFruitId(cropFruitId: String): [CropsFruitDetail]
      tokenizedAllCropsFruitDetailByCropFruitId(tokenizedParams: String!): String! 
   }

   type Mutation {
      createCropsFruitDetail(
        cropFruitId: String!
        economicLife: Float
        estimatedYield: Float
      ): String!

      updateCropsFruitDetail(
        uuid: String!
        cropFruitId: String!
        economicLife: Float
        estimatedYield: Float
      ): String!
      deleteCropsFruitDetail(uuid: String!): String!

       tokenizedCreateCropsFruitDetail(tokenized: String!): String!
       tokenizedUpdateCropsFruitDetail(tokenized: String!): String!
       tokenizedDeleteCropsFruitDetail(tokenized: String!): String!

   }
`;
