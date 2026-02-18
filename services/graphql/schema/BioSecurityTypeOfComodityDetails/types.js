const BioSecurityTypeOfComodityDetail = `
   scalar JSON

   type BioSecurityTypeOfComodityDetail {
      id: String!
      uuid: String!
      code: String!

      englishName: String!     
      localName: String!
      activeIngredients: String

      BioSecurityTypeOfComodity: BioSecurityTypeOfComodity
      BioSecurityCategory: BioSecurityCategory
      
      BioSecuritySubCategory: BioSecuritySubCategory
      BioSecurityUnit: BioSecurityUnit

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecurityTypeOfComodityDetail];
exports.rootTypes = `
   type Query {
    allBioSecurityTypeOfComodityDetail(bioSecurityTypeOfComodityUUID: String!): [BioSecurityTypeOfComodityDetail]
    tokenizedAllBioSecurityTypeOfComodityDetail(tokenizedParams: String!): String!
   }

   type Mutation {
      createBioSecurityTypeOfComodityDetail(
        code: String!
        englishName: String!     
        localName: String!
        activeIngredients: String

        bioSecurityTypeOfComodityUUID: String!
        bioSecurityCategoryUUID: String!
        
        bioSecuritySubCategoryUUID: String!
        bioSecurityUnitUUID: String!

      ): String!
      updateBioSecurityTypeOfComodityDetail(
        uuid: String!
        code: String
        englishName: String     
        localName: String
        activeIngredients: String

        bioSecurityTypeOfComodityUUID: String
        bioSecurityCategoryUUID: String
        
        bioSecuritySubCategoryUUID: String
        bioSecurityUnitUUID: String
      ): String!
      deleteBioSecurityTypeOfComodityDetail(uuid: String!): String!

      tokenizedCreateBioSecurityTypeOfComodityDetail(
         tokenized: String!
       ): String!
       tokenizedUpdateBioSecurityTypeOfComodityDetail(
         tokenized: String!
       ): String!
       tokenizedDeleteBioSecurityTypeOfComodityDetail(tokenized: String!): String!
       exportBioSecurityTypeOfComodityDetails(bioSecurityTypeOfComodityUUID: String!): String!
   }
`;
