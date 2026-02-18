const SupportType = `
   scalar JSON

   type SupportType {
      id: String!
      uuid: String!
      supports: String!
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [SupportType];
exports.rootTypes = `
   type Query {
      allSupportTypes: [SupportType]
      tokenizedAllSupport: String!
   }

   type Mutation {
      createSupportType(code: String, supports: String!): String!
      updateSupportType(uuid: String!, code: String supports: String): String!
      deleteSupportType(uuid: String!): String!

      tokenizedCreateSupportType(tokenized: String!): String!
      tokenizedUpdateSupportType(tokenized: String): String!
      tokenizedDeleteSupportType(tokenized: String!): String!
   }
`;
