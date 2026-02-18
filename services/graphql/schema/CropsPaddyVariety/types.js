const CropsPaddyVariety = `
   scalar JSON

   type CropsPaddyVariety {
      id: String!
      uuid: String
      paddyId: String

      varietyName: String
      schemePrice: Float
      marketPrice: Float

      varietyType: String
      description: String

      CropsCategory: CropsCategory

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CropsPaddyVariety];
exports.rootTypes = `
   type Query {
      allCropsPaddyVarieties: [CropsPaddyVariety]
      tokenizedAllCropsPaddyVarieties: String!
   }

   type Mutation {
      createCropsPaddyVariety(       
        varietyName: String
        schemePrice: Float
        marketPrice: Float
        cropsCategoryUUID: String!
        
        varietyType: String
        description: String
  
      ): String!
      updateCropsPaddyVariety(
        uuid: String!
        varietyName: String
        schemePrice: Float
        marketPrice: Float
        cropsCategoryUUID: String!

        varietyType: String
        description: String
  
      ): String!
      deleteCropsPaddyVariety(uuid: String!): String!
      exportCropsPaddyVariety: Buffer

       tokenizedCreateCropsPaddyVariety(tokenized: String!): String!
       tokenizedUpdateCropsPaddyVariety(tokenized: String!): String!
       tokenizedDeleteCropsPaddyVariety(tokenized: String!): String!
   }
`;
