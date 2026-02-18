const CurrentStatus = `
   scalar JSON

   type CurrentStatus {
      id: String!
      uuid: String!
      status: String!

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CurrentStatus];
exports.rootTypes = `
   type Query {
      allCurrentStatuses: [CurrentStatus]
      tokenizedAllCurrentStatuses: String!
   }

   type Mutation {
      createCurrentStatus(
        status: String!
      ): String!
      updateCurrentStatus(
        uuid: String!
        status: String!
      ): String!
      deleteCurrentStatus(uuid: String!): String!

      tokenizedCreateCurrentStatus(
         tokenized: String!
       ): String!
       tokenizedUpdateCurrentStatus(
         tokenized: String!
       ): String!
       tokenizedDeleteCurrentStatus(tokenized: String!): String!
   }
`;
