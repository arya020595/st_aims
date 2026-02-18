const CropsPaddySeedVariety = `
   scalar JSON

   type CropsPaddySeedVariety {
      id: String!
      uuid: String!
      paddySeedId: String!

      varietyName: String
      price: Float

      varietyType: String
      typeOfSeed: String
      description: String
    

      CropsCategory: CropsCategory

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CropsPaddySeedVariety];
exports.rootTypes = `
   type Query {
      allCropsPaddySeedVarieties: [CropsPaddySeedVariety]
      tokenizedAllCropsPaddySeedVarieties: String!
   }

   type Mutation {
      createCropsPaddySeedVariety(       
        varietyName: String
        price: Float
        cropsCategoryUUID: String!

        varietyType: String
         typeOfSeed: String
         description: String
      ): String!
      updateCropsPaddySeedVariety(
        uuid: String!
        varietyName: String
        price: Float
        cropsCategoryUUID: String!

        varietyType: String
        typeOfSeed: String
        description: String
      ): String!
      deleteCropsPaddySeedVariety(uuid: String!): String!
      exportCropsPaddySeedVariety: Buffer

       tokenizedCreateCropsPaddySeedVariety(tokenized: String!): String!
       tokenizedUpdateCropsPaddySeedVariety(tokenized: String!): String!
       tokenizedDeleteCropsPaddySeedVariety(tokenized: String!): String!
   }
`;
