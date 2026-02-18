const AgrifoodProductCategory = `
   scalar JSON

   type AgrifoodProductCategory {
      id: String!
      uuid: String!
      productNameEnglish: String
      productNameMalay: String

      codePrefix: String
      

      AgrifoodProductSubCategory: [AgrifoodProductSubCategory]
      AgrifoodProductSubCategoryFromCatalogueDetail: [AgrifoodProductSubCategory]

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [AgrifoodProductCategory];
exports.rootTypes = `
   type Query {
      allAgrifoodProductCategories: [AgrifoodProductCategory]
      allAgrifoodProductCategoriesByCompanyId(companyUUID: String!): [AgrifoodProductCategory]
      tokenizedAllAgrifoodProductCategories: String!
      tokenizedAllAgrifoodProductCategoriesByCompanyId(tokenizedParams: String!): String!
   }

   type Mutation {
      createAgrifoodProductCategory(
         productNameEnglish: String
         productNameMalay: String
         codePrefix: String
      ): String!

      updateAgrifoodProductCategory(
        uuid: String!
        productNameEnglish: String
        productNameMalay: String
        codePrefix: String
      ): String!
      deleteAgrifoodProductCategory(uuid: String!): String!

      tokenizedCreateAgrifoodProductCategory(
         tokenized: String! 
      ): String!

      tokenizedUpdateAgrifoodProductCategory(
        tokenized: String!
      ): String!
      tokenizedDeleteAgrifoodProductCategory(tokenized: String!): String!

      exportProductCategory: Buffer
   }
`;
