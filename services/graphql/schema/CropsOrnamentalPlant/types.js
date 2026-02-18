const CropsOrnamentalPlant = `
   scalar JSON

   type CropsOrnamentalPlant {
      id: String!
      uuid: String!
      ornamentalPlantId: String!

      localName: String
      englishName: String
      cropName: String

      
      CropsCategory: CropsCategory
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CropsOrnamentalPlant];
exports.rootTypes = `
   type Query {
      allCropsOrnamentalPlants: [CropsOrnamentalPlant]
      tokenizedAllCropsOrnamentalPlants: String!
   }

   type Mutation {
      createCropsOrnamentalPlant(       
        localName: String
        englishName: String
        cropsCategoryUUID: String!
        cropName: String
      ): String!
      updateCropsOrnamentalPlant(
        uuid: String!
        localName: String
        englishName: String
        cropsCategoryUUID: String!
        cropName: String
      ): String!
      deleteCropsOrnamentalPlant(uuid: String!): String!
      exportCropsOrnamentalPlant: Buffer
       tokenizedCreateCropsOrnamentalPlant(tokenized: String!): String!
       tokenizedUpdateCropsOrnamentalPlant(tokenized: String!): String!
       tokenizedDeleteCropsOrnamentalPlant(tokenized: String!): String!
   }
`;
