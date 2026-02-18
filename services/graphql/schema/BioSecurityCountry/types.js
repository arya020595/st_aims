const BioSecurityCountry = `
   scalar JSON

   type BioSecurityCountry {
      id: String!
      uuid: String!
      name: String!     
      description: String
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecurityCountry];
exports.rootTypes = `
   type Query {
      allBioSecurityCountries: [BioSecurityCountry]
      tokenizedAllBioSecurityCountries: String!
      searchCountry(name: String!): String!
   }

   type Mutation {
      createBioSecurityCountry(
        name: String!       
        description: String
      ): String!
      updateBioSecurityCountry(
        uuid: String!
        name: String    
        description: String
      ): String!
      deleteBioSecurityCountry(uuid: String!): String!

      tokenizedCreateBioSecurityCountry(
         tokenized: String!   
       ): String!
       tokenizedUpdateBioSecurityCountry(
         tokenized: String!
       ): String!
       tokenizedDeleteBioSecurityCountry(tokenized: String!): String!

       exportBioSecurityCountry: Buffer
   }
`;
