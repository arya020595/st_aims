const TypeOfAnalysis = `
   scalar JSON

   type TypeOfAnalysis {
      id: String!
      uuid: String!
      name: String!     
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [TypeOfAnalysis];
exports.rootTypes = `
   type Query {
      allTypeOfAnalysises: [TypeOfAnalysis]
      countTypeOfAnalysis: Int
      tokenizedAllTypeOfAnalysises: String!
   }

   type Mutation {
      createTypeOfAnalysis(
        name: String! 
      ): String!
      updateTypeOfAnalysis(
        uuid: String!
        name: String
      ): String!
      deleteTypeOfAnalysis(uuid: String!): String!

      tokenizedCreateTypeOfAnalysis(
         tokenized: String! 
       ): String!
       tokenizedUpdateTypeOfAnalysis(
         tokenized: String!
       ): String!
       tokenizedDeleteTypeOfAnalysis(tokenized: String!): String!

       exportTypeOfAnalysis: Buffer
   }
`;
