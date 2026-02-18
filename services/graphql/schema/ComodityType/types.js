const ComodityType = `
   scalar JSON

   type ComodityType {
      id: String!
      uuid: String!
      comodityType: String!     
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [ComodityType];
exports.rootTypes = `
   type Query {
      allComodityTypes: [ComodityType]
      tokenizedAllComodityTypes: String
   }

   type Mutation {
      createComodityType(
        comodityType: String!       
      ): String!
      updateComodityType(
        uuid: String!
        comodityType: String    
      ): String!
      deleteComodityType(uuid: String!): String!

       tokenizedCreateComodityType(tokenized: String!): String!
       tokenizedUpdateComodityType(tokenized: String!): String!
       tokenizedDeleteComodityType(tokenized: String!): String!
   }
`;
