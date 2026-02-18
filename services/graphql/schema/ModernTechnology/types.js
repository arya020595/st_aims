const ModernTechnology = `
   scalar JSON

   type ModernTechnology {
      id: String!
      uuid: String!
      name: String!
      description: String
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [ModernTechnology];
exports.rootTypes = `
   type Query {
      allModernTechnologies: [ModernTechnology]
      tokenizedAllModernTechnologies: String!
   }

   type Mutation {
      createModernTechnology(name: String!, description: String!): String!
      updateModernTechnology(uuid: String!, name: String description: String): String!
      deleteModernTechnology(uuid: String!): String!
      
      tokenizedCreateModernTechnology(tokenized: String!): String!
      tokenizedUpdateModernTechnology(tokenized: String!): String!
      tokenizedDeleteModernTechnology(tokenized: String!): String!
   }
`;
