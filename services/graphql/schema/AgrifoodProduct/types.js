const AgrifoodProduct = `
   scalar JSON

   type AgrifoodProduct {
      id: String!
      uuid: String!
      categoryUUID: String!
      categoryName: String!
      subCategoryUUID: String!
      subCategoryName: String!

      productName: String
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [AgrifoodProduct];
exports.rootTypes = `
   type Query {
      allAgrifoodProducts: [AgrifoodProduct]

      getAgrifoodByFilter(
        categoryUUID: String
        subCategoryUUID: String 
      ): [AgrifoodProduct]
   }

   type Mutation {
      createAgrifoodProduct(
        categoryUUID: String!
        categoryName: String!
        subCategoryUUID: String!
        subCategoryName: String!

        productName: String
      ): String!
      updateAgrifoodProduct(
        uuid: String!
        categoryUUID: String
        categoryName: String
        subCategoryUUID: String
        subCategoryName: String   

        productName: String
      ): String!
      deleteAgrifoodProduct(uuid: String!): String!
   }
`;
