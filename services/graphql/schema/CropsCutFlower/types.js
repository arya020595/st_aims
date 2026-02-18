const CropsCutFlower = `
   scalar JSON
   scalar Buffer

   type CropsCutFlower {
      id: String!
      uuid: String!
      cutFlowerId: String!

      localName: String
      englishName: String
      cropName: String
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CropsCutFlower];
exports.rootTypes = `
   type Query {
      allCropsCutFlowers: [CropsCutFlower]
      tokenizedAllCropsCutFlowers: String!
   }

   type Mutation {
      createCropsCutFlower(       
        localName: String
        englishName: String
        cropName: String
      ): String!
      updateCropsCutFlower(
        uuid: String!
        localName: String
        englishName: String
        cropName: String
      ): String!
      deleteCropsCutFlower(uuid: String!): String!
      exportsCropsCutFlower: Buffer

       tokenizedCreateCropsCutFlower(tokenized: String!): String!
       tokenizedUpdateCropsCutFlower(tokenized: String!): String!
       tokenizedDeleteCropsCutFlower(tokenized: String!): String!
   }
`;
