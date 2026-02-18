const BioSecurityTakenAction = `
   scalar JSON

   type BioSecurityTakenAction {
      id: String!
      uuid: String!
      name: String!     
      description: String
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecurityTakenAction];
exports.rootTypes = `
   type Query {
      allBioSecurityTakenActions: [BioSecurityTakenAction]
      tokenizedAllBioSecurityTakenActions: String!
   }

   type Mutation {
      createBioSecurityTakenAction(
        name: String!       
        description: String
      ): String!
      updateBioSecurityTakenAction(
        uuid: String!
        name: String    
        description: String
      ): String!
      deleteBioSecurityTakenAction(uuid: String!): String!

      tokenizedCreateBioSecurityTakenAction(
         tokenized: String!
       ): String!
       tokenizedUpdateBioSecurityTakenAction(
         tokenized: String!
       ): String!
       tokenizedDeleteBioSecurityTakenAction(tokenized: String!): String!

       exportBioSecurityTakenAction: Buffer
   }
`;
