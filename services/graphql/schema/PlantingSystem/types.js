const PlantingSystem = `
   scalar JSON

   type PlantingSystem {
      id: String!
      uuid: String!
      description: String!
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [PlantingSystem];
exports.rootTypes = `
   type Query {
      allPlantingSystems: [PlantingSystem]
      tokenizeAllPlantingSystems: String!
   }

   type Mutation {
      createPlantingSystem(code: String, description: String!): String!
      updatePlantingSystem(uuid: String!, code: String description: String): String!
      deletePlantingSystem(uuid: String!): String!

      tokenizedCreatePlantingSystem(tokenized: String!): String!
      tokenizedUpdatePlantingSystem(tokenized: String!): String!
      tokenizedDeletePlantingSystem(tokenized: String!): String!
   }
`;
