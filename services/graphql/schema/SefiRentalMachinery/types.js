const SefiRentalMachinery = `
   scalar JSON

   type SefiRentalMachinery {
      id: String!
      uuid: String!
      machineId: String!
      machineName: String!     
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [SefiRentalMachinery];
exports.rootTypes = `
   type Query {
      allSefiRentalMachineries: [SefiRentalMachinery]
      countSefiRentalMachinery: Int
      tokenizedAllSefiRentalMachineries: String!
   }

   type Mutation {
      createSefiRentalMachinery(
        machineId: String!
        machineName: String! 
      ): String!
      updateSefiRentalMachinery(
        uuid: String!
        machineId: String
        machineName: String
      ): String!
      deleteSefiRentalMachinery(uuid: String!): String!

       tokenizedCreateSefiRentalMachinery(tokenized: String!): String!
       tokenizedUpdateSefiRentalMachinery(tokenized: String!): String!
       tokenizedDeleteSefiRentalMachinery(tokenized: String!): String!

      exportSefiRental: Buffer
   }
`;
