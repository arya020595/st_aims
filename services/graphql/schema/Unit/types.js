const Unit = `
   scalar JSON

   type Unit {
      id: String!
      uuid: String!
      name: String!
      description: String     
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [Unit];
exports.rootTypes = `
   type Query {
      allUnits: [Unit]
      countUnit: Int
      tokenizedAllUnits: String!
   }

   type Mutation {
      createUnit(
        #name: String!
        #description: String
        tokenized: String! 
      ): String!
      updateUnit(
        #uuid: String!
        #name: String
        #description: String
        tokenized: String!
      ): String!
      deleteUnit(
         #uuid: String!
         tokenized: String!
         ): String!

      exportUnit: Buffer
   }
`;
