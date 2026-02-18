const LivestockCategory = `
   scalar JSON

   type LivestockCategory {
      id: String!
      uuid: String!
      code: String
      categoryName: String!
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [LivestockCategory];
exports.rootTypes = `
   type Query {
      allLivestockCategories: [LivestockCategory]
      allLivestockCategoriesEncrypted: String
   }

   type Mutation {
      createLivestockCategory(
         #code: String
         #categoryName: String!
         tokenized: String!
         ): String!
      updateLivestockCategory(
         #uuid: String! 
         #code: String 
         #categoryName: String 
         tokenized: String!
         ): String!
      deleteLivestockCategory(
         #uuid: String!
         tokenized: String!
         ): String!

      exportLivestockCategory: Buffer
   }
`;
