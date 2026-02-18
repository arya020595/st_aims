const BioSecurityTypeOfComodity = `
   scalar JSON

   type BioSecurityTypeOfComodity {
      id: String!
      uuid: String!
      name: String!     
      description: String

      ComodityDetails: [BioSecurityTypeOfComodityDetail]
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecurityTypeOfComodity];
exports.rootTypes = `
   type Query {
      allBioSecurityTypeOfComodities: [BioSecurityTypeOfComodity]

      allBioSecurityTypeOfComoditiesByIds(uuids: [String]):  [BioSecurityTypeOfComodity]
      
      tokenizedAllBioSecurityTypeOfComodities(onPage: String): String!
      tokenizedllBioSecurityTypeOfComoditiesByIds(tokenizedParams: String): String!

      searchBioSecurityTypeOfComodities(name: String, onPage: String): String!
   }

   type Mutation {
      createBioSecurityTypeOfComodity(
        name: String!       
        description: String
      ): String!
      updateBioSecurityTypeOfComodity(
        uuid: String!
        name: String    
        description: String
      ): String!
      deleteBioSecurityTypeOfComodity(uuid: String!): String!

      tokenizedCreateBioSecurityTypeOfComodity(
         tokenized: String!
       ): String!
       tokenizedUpdateBioSecurityTypeOfComodity(
         tokenized: String!
       ): String!
       tokenizedDeleteBioSecurityTypeOfComodity(tokenized: String!): String!

       exportBioSecurityTypeOfComodity: Buffer

   }
`;
