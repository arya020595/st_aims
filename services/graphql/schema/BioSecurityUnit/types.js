const BioSecurityUnit = `
   scalar JSON

   type BioSecurityUnit {
      id: String!
      uuid: String!
      name: String!     
      description: String
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecurityUnit];
exports.rootTypes = `
   type Query {
      allBioSecurityUnits: [BioSecurityUnit]
      tokenizedAllBioSecurityUnits: String!
   }

   type Mutation {
      createBioSecurityUnit(
        name: String!       
        description: String
      ): String!
      updateBioSecurityUnit(
        uuid: String!
        name: String    
        description: String
      ): String!
      deleteBioSecurityUnit(uuid: String!): String!

      tokenizedCreateBioSecurityUnit(
         tokenized: String!
       ): String!
       tokenizedUpdateBioSecurityUnit(
         tokenized: String!
       ): String!
       tokenizedDeleteBioSecurityUnit(tokenized: String!): String!

       exportBioSecurityUnit: Buffer
   }
`;
