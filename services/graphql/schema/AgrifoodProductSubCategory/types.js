const AgrifoodProductSubCategory = `
   scalar JSON

   type AgrifoodProductSubCategory {
      id: String!
      uuid: String!
      subCategoryId: String
      subCategoryNameEnglish: String
      subCategoryNameMalay: String

      productCategoryUUID: String
      productCategoryNameEnglish: String
      productCategoryNameMalay: String
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [AgrifoodProductSubCategory];
exports.rootTypes = `
   type Query {
      allAgrifoodProductSubCategories: [AgrifoodProductSubCategory]
      allAgrifoodProductSubCategoriesByCategory(productCategoryUUID: String!): [AgrifoodProductSubCategory]
      tokenizedAllAgrifoodProductSubCategories: String!
      tokenizedAllAgrifoodProductSubCategoriesByCategory(tokenizedParams: String!): String!
   }

   type Mutation {
      createAgrifoodProductSubCategory(
         subCategoryId: String
         subCategoryNameEnglish: String
         subCategoryNameMalay: String

         productCategoryUUID: String
         productCategoryNameEnglish: String
         productCategoryNameMalay: String   
      ): String!
      updateAgrifoodProductSubCategory(
         uuid: String!
         subCategoryId: String
         subCategoryNameEnglish: String
         subCategoryNameMalay: String

         productCategoryUUID: String
         productCategoryNameEnglish: String
         productCategoryNameMalay: String
      ): String!
      deleteAgrifoodProductSubCategory(uuid: String!): String!

      tokenizedCreateAgrifoodProductSubCategory(
         tokenized: String!   
      ): String!
      tokenizedUpdateAgrifoodProductSubCategory(
         tokenized: String!
      ): String!
      tokenizedDeleteAgrifoodProductSubCategory(tokenized: String!): String!

      exportSubCategory: Buffer
   }
`;
