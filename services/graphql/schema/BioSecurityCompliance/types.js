const BioSecurityCompliance = `
   scalar JSON

   type BioSecurityCompliance {
      id: String!
      uuid: String!
      name: String!     
      description: String
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecurityCompliance];
exports.rootTypes = `
   type Query {
      allBioSecurityCompliances: [BioSecurityCompliance]
      tokenizedAllBioSecurityCompliances: String!
   }

   type Mutation {
      createBioSecurityCompliance(
        name: String!       
        description: String
      ): String!
      updateBioSecurityCompliance(
        uuid: String!
        name: String    
        description: String
      ): String!
      deleteBioSecurityCompliance(uuid: String!): String!

      tokenizedCreateBioSecurityCompliance(
         tokenized: String!
       ): String!
       tokenizedUpdateBioSecurityCompliance(
         tokenized: String!
       ): String!
       tokenizedDeleteBioSecurityCompliance(tokenized: String!): String!
       
       exportBioSecurityCompliance: Buffer
   }
`;
