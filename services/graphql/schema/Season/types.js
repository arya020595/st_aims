const Season = `
   scalar JSON

   type Season {
      id: String!
      uuid: String
      name: String
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [Season];
exports.rootTypes = `
   type Query {
      allSeasons: [Season]
      tokenizedAllSeasons: String!
   }

   type Mutation {
      createSeason(name: String!): String!
      updateSeason(uuid: String!, name: String): String!
      deleteSeason(uuid: String!): String!
      exportSeason: Buffer

      tokenizedCreateSeason(tokenized: String!): String!
      tokenizedUpdateSeason(tokenized: String!): String!
      tokenizedDeleteSeason(tokenized: String!): String!
   }
`;
