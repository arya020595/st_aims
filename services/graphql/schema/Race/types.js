const Race = `
   scalar JSON

   type Race {
      id: String!
      uuid: String!
      race: String!
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [Race];
exports.rootTypes = `
   type Query {
      allRaces: [Race]
      tokenizedAllRace: String
   }

   type Mutation {
      createRace(race: String!): String!
      updateRace(uuid: String!, race: String): String!
      deleteRace(uuid: String!): String!

      tokenizedCreateRace(tokenized: String!): String!
      tokenizedUpdateRace(tokenized: String!, race: String): String!
      tokenizedDeleteRace(tokenized: String!): String!
   }
`;
