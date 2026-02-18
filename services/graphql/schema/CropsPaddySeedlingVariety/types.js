const CropsPaddySeedlingVariety = `
   scalar JSON

   type CropsPaddySeedlingVariety {
      id: String!
      uuid: String!
      paddySeedlingId: String!

      varietyName: String

      CropsCategory: CropsCategory

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CropsPaddySeedlingVariety];
exports.rootTypes = `
   type Query {
      allCropsPaddySeedlingVarieties: [CropsPaddySeedlingVariety]
   }

   type Mutation {
      createCropsPaddySeedlingVariety(       
        varietyName: String
        cropsCategoryUUID: String!
      ): String!
      updateCropsPaddySeedlingVariety(
        uuid: String!
        varietyName: String
        cropsCategoryUUID: String!
      ): String!
      deleteCropsPaddySeedlingVariety(uuid: String!): String!
   }
`;
