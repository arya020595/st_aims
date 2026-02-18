const CropsCategory = `
   scalar JSON

   type CropsCategory {
      id: String!
      uuid: String!
      name: String!     
      description: String

      prefixCode: String
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CropsCategory];
exports.rootTypes = `
   type Query {
      allCropsCategories: [CropsCategory]
      tokenizedAllCropsCategories: String!
   }

   type Mutation {
      createCropsCategory(
        name: String!       
        description: String
        prefixCode: String
      ): String!
      updateCropsCategory(
        uuid: String!
        name: String    
        description: String
        prefixCode: String
      ): String!
      deleteCropsCategory(uuid: String!): String!
      exportCropsCategory: Buffer

       tokenizedCreateCropsCategory(tokenized: String!): String!
       tokenizedUpdateCropsCategory(tokenized: String!): String!
       tokenizedDeleteCropsCategory(tokenized: String!): String!
   }
`;
