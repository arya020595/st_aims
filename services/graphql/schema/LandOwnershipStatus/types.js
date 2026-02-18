const LandOwnershipStatus = `
   scalar JSON

   type LandOwnershipStatus {
      id: String!
      uuid: String!
      status: String!     
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [LandOwnershipStatus];
exports.rootTypes = `
   type Query {
      allLandOwnershipStatuses: [LandOwnershipStatus]
      tokenizedAllLandOwnerShipStatues: String!
   }

   type Mutation {
      createLandOwnershipStatus(
        status: String!       
      ): String!
      updateLandOwnershipStatus(
        uuid: String!
        status: String    
      ): String!
      deleteLandOwnershipStatus(uuid: String!): String!

      tokenizedCreateLandOwnershipStatus(
         tokenized: String!       
       ): String!
       tokenizedUpdateLandOwnershipStatus(
         tokenized: String!    
       ): String!
       tokenizedDeleteLandOwnershipStatus(tokenized: String!): String!
   }
`;
