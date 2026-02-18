const CropsVegetable = `
   scalar JSON

   type CropsVegetable {
      id: String!
      uuid: String
      vegetableId: String

      localName: String
      englishName: String
      cropName: String

      
      CropsCategory: CropsCategory
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CropsVegetable];
exports.rootTypes = `
   type Query {
      allCropVegetables: [CropsVegetable]
      tokenizedAllCropVegetables: String!
      searchAllCropVegetables(name: String): String!
   }

   type Mutation {
      createCropsVegetable(       
        localName: String
        englishName: String
        cropsCategoryUUID: String!
        cropName: String
      ): String!
      updateCropsVegetable(
        uuid: String!
        localName: String
        englishName: String
        cropsCategoryUUID: String!
        cropName: String
      ): String!
      deleteCropsVegetable(uuid: String!): String!
      exportCropsVegetable: Buffer

       tokenizedCreateCropsVegetable(tokenized: String!): String!
       tokenizedUpdateCropsVegetable(tokenized: String!): String!
       tokenizedDeleteCropsVegetable(tokenized: String!): String!
   }
`;
