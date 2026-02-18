const AwardType = `
   scalar JSON

   type AwardType {
      id: String!
      uuid: String!
      award: String!     
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [AwardType];
exports.rootTypes = `
   type Query {
      allAwardTypes: [AwardType]
      tokenizedAllAwardTypes: String!
   }

   type Mutation {
      createAwardType(
        award: String!       
      ): String!
      updateAwardType(
        uuid: String!
        award: String    
      ): String!
      deleteAwardType(uuid: String!): String!

       tokenizedCreateAwardType(tokenized: String!): String!
       tokenizedUpdateAwardType(tokenized: String!): String!
       tokenizedDeleteAwardType(tokenized: String!): String!
   }
`;
