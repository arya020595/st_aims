const IrigationStatus = `
   scalar JSON

   type IrigationStatus {
      id: String!
      uuid: String!
      status: String!     
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [IrigationStatus];
exports.rootTypes = `
   type Query {
      allIrigationStatuses: [IrigationStatus]
      tokenizedAllIrigationStatus: String!
   }

   type Mutation {
      createIrigationStatus(
        status: String!       
      ): String!
      updateIrigationStatus(
        uuid: String!
        status: String    
      ): String!
      deleteIrigationStatus(uuid: String!): String!

      tokenizedCreateIrigationStatus(
         tokenized: String!       
       ): String!
       tokenizedUpdateIrigationStatus(
         tokenized: String!
       ): String!
       tokenizedDeleteIrigationStatus(tokenized: String!): String!
   }
`;
