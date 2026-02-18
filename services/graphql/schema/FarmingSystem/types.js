const FarmingSystem = `
   scalar JSON

   type FarmingSystem {
      id: String!
      uuid: String!
      description: String!
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [FarmingSystem];
exports.rootTypes = `
   type Query {
      allFarmingSystems: [FarmingSystem]
      tokenizedAllFarmingSystem: String!
   }

   type Mutation {
      createFarmingSystem(code: String, description: String!): String!
      updateFarmingSystem(uuid: String!, code: String description: String): String!
      deleteFarmingSystem(uuid: String!): String!

      tokenizedCreateFarmingSystem(tokenized: String!): String!
      tokenizedUpdateFarmingSystem(tokenized: String!): String!
      tokenizedDeleteFarmingSystem(tokenized: String!): String!
   }
`;
