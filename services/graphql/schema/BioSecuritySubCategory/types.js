const BioSecuritySubCategory = `
   scalar JSON

   type BioSecuritySubCategory {
      id: String!
      uuid: String!

      name: String!     
      description: String

      Category: BioSecurityCategory
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecuritySubCategory];
exports.rootTypes = `
   type Query {
      allBioSecuritySubCategories: [BioSecuritySubCategory]
      tokenizedAllBioSecuritySubCategories: String!
   }

   type Mutation {
      createBioSecuritySubCategory(
        name: String!       
        description: String
        bioSecurityCategoryUUID: String!

      ): String!
      updateBioSecuritySubCategory(
        uuid: String!
        name: String    
        description: String
        bioSecurityCategoryUUID: String
      ): String!
      deleteBioSecuritySubCategory(uuid: String!): String!

      tokenizedCreateBioSecuritySubCategory(
         tokenized: String!
       ): String!
       tokenizedUpdateBioSecuritySubCategory(
         tokenized: String!
       ): String!
       tokenizedDeleteBioSecuritySubCategory(tokenized: String!): String!

       exportBioSecuritySubCategory: Buffer
   }
`;
