const ContractStatus = `
   scalar JSON

   type ContractStatus {
      id: String!
      uuid: String!
      status: String!

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [ContractStatus];
exports.rootTypes = `
   type Query {
      allContractStatuses: [ContractStatus]
      tokenizedAllContractStatuses: String!
   }

   type Mutation {
      createContractStatus(
        status: String!
      ): String!
      updateContractStatus(
        uuid: String!
        status: String!
      ): String!
      deleteContractStatus(uuid: String!): String!

      tokenizedCreateContractStatus(
         tokenized: String!
       ): String!
       tokenizedUpdateContractStatus(
         tokenized: String!
       ): String!
       tokenizedDeleteContractStatus(tokenized: String!): String!
   }
`;
