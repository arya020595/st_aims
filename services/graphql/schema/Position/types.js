const Position = `
   scalar JSON

   type Position {
      id: String!
      uuid: String!
      name: String!
      description: String
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [Position];
exports.rootTypes = `
   type Query {
      allPositions: [Position]
      tokenizedAllPositions: String
   }

   type Mutation {
      createPosition(
         #name: String!
         #description: String
         tokenized: String!
         ): String!
      updatePosition(
         #uuid: String! 
         #name: String 
         #description: String
         tokenized: String!
         ): String!
      deletePosition(
         #uuid: String!
         tokenized: String!
         ): String!
      
      exportsPosition: Buffer
   }
`;
