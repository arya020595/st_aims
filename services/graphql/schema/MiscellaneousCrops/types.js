const MiscellaneousCrops = `
   scalar JSON

   type MiscellaneousCrops {
      id: String!
      uuid: String
      miscellaneousCropId: String

      localName: String
      englishName: String
      cropName: String

      
      CropsCategory: CropsCategory
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [MiscellaneousCrops];
exports.rootTypes = `
   type Query {
      allMiscellaneousCrops: [MiscellaneousCrops]
      tokenizedAllMiscellaneousCrops: String!

      searchMiscCrops(searchTerm: String): String!
   }

   type Mutation {
      createMiscellaneousCrops(       
        localName: String
        englishName: String
        cropsCategoryUUID: String!
        cropName: String
      ): String!
      updateMiscellaneousCrops(
        uuid: String!
        localName: String
        englishName: String
        cropsCategoryUUID: String!
        cropName: String
      ): String!
      deleteMiscellaneousCrops(uuid: String!): String!
      exportMiscellaneousCrops: Buffer

       tokenizedCreateMiscellaneousCrops(tokenized: String!): String!
       tokenizedUpdateMiscellaneousCrops(tokenized: String!): String!
       tokenizedDeleteMiscellaneousCrops(tokenized: String!): String!
   }
`;
