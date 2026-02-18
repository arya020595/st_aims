const Condition = `
   scalar JSON

   type Condition {
      id: String!
      uuid: String!
      name: String!
      description: String     
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [Condition];
exports.rootTypes = `
   type Query {
      allConditions: [Condition]
      countCondition: Int
      tokenizedAllConditions: String!
   }

   type Mutation {
      createCondition(
        name: String!
        description: String 
      ): String!
      updateCondition(
        uuid: String!
        name: String
        description: String
      ): String!
      deleteCondition(uuid: String!): String!

      tokenizedCreateCondition(
         tokenized: String! 
       ): String!
       tokenizedUpdateCondition(
         tokenized: String!
       ): String!
       tokenizedDeleteCondition(tokenized: String!): String!

       exportCondition: Buffer
   }
`;
