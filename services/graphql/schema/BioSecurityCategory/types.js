const BioSecurityCategory = `
   scalar JSON

   type BioSecurityCategory {
      id: String!
      uuid: String!
      name: String!     
      description: String

      SubCategories: [BioSecuritySubCategory]
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecurityCategory];
exports.rootTypes = `
   scalar JSON
   type Query {
      allBioSecurityCategories: [BioSecurityCategory]
      tokenizedAllBioSecurityCategories: String!

      allBioSecurityCategoriesMobile: JSON
   }

   type Mutation {
      createBioSecurityCategory(
        name: String!       
        description: String
      ): String!
      updateBioSecurityCategory(
        uuid: String!
        name: String    
        description: String
      ): String!
      deleteBioSecurityCategory(uuid: String!): String!
      
      tokenizedCreateBioSecurityCategory(
         tokenized: String!
       ): String!
       tokenizedUpdateBioSecurityCategory(
         tokenized: String!    
       ): String!
       tokenizedDeleteBioSecurityCategory(tokenized: String!): String!

       exportBioSecurityCategory: Buffer

       syncBioSecurityCategoryFromMobile(uuid: String!, input: JSON, user: JSON): String
   }
`;
