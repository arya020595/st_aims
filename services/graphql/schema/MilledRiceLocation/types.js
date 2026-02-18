const MilledRiceLocation = `
   scalar JSON

   type MilledRiceLocation {
      id: String!
      uuid: String!
      location: String!     
      description: String
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [MilledRiceLocation];
exports.rootTypes = `
   type Query {
      allMilledRiceLocations: [MilledRiceLocation]
      tokenizedAllMilledRiceLocations: String!
   }

   type Mutation {
      createMilledRiceLocation(
        location: String!       
        description: String
      ): String!
      updateMilledRiceLocation(
        uuid: String!
        location: String    
        description: String
      ): String!
      deleteMilledRiceLocation(uuid: String!): String!
      exportMilledRiceLocation: Buffer

       tokenizedCreateMilledRiceLocation(tokenized: String!): String!
       tokenizedUpdateMilledRiceLocation(tokenized: String!): String!
       tokenizedDeleteMilledRiceLocation(tokenized: String!): String!
   }
`;
