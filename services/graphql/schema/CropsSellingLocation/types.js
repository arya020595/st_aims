const CropsSellingLocation = `
   scalar JSON

   type CropsSellingLocation {
      id: String!
      uuid: String
      locationId: String!
      name: String

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CropsSellingLocation];
exports.rootTypes = `
   type Query {
      allCropsSellingLocations: [CropsSellingLocation]
      tokenizedAllCropsSellingLocations: String!
   }

   type Mutation {
      createCropsSellingLocation(       
        name: String!
      ): String!
      updateCropsSellingLocation(
        uuid: String!
        name: String
      ): String!
      deleteCropsSellingLocation(uuid: String!): String!
      exportsCropsSellingLocation: Buffer
       tokenizedCreateCropsSellingLocation(tokenized: String!): String!
       tokenizedUpdateCropsSellingLocation(tokenized: String!): String!
       tokenizedDeleteCropsSellingLocation(tokenized: String!): String!
   }
`;
