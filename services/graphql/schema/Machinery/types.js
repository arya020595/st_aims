const Machinery = `
   scalar JSON

   type Machinery {
      id: String!
      uuid: String!
      machineId: String
      machineType: String!
      machineName: String!
      machineCapacity: String!

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [Machinery];
exports.rootTypes = `
   type Query {
      allMachineries: [Machinery]
      countMachineries: Int
      tokenizedAllMachineries: String!
   }

   type Mutation {
      createMachinery(
        machineId: String
        machineType: String!
        machineName: String!
        machineCapacity: String!
      ): String!
      updateMachinery(
        uuid: String!
        machineId: String
        machineType: String
        machineName: String
        machineCapacity: String
      ): String!
      deleteMachinery(uuid: String!): String!

       tokenizedCreateMachinery(tokenized: String): String!
       tokenizedUpdateMachinery(tokenized: String!): String!
       tokenizedDeleteMachinery(tokenized: String!): String!

       exportMachinery: Buffer
   }
`;
