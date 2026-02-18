const Test = `
   scalar JSON

   type Test {
      id: String!
      uuid: String!
      testId: String!
      testName: String!     
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [Test];
exports.rootTypes = `
   type Query {
      allTests: [Test]
      countTest: Int
      tokenizedAllTests: String!
   }

   type Mutation {
      createTest(
        testId: String!
        testName: String! 
      ): String!
      updateTest(
        uuid: String!
        testId: String
        testName: String
      ): String!
      deleteTest(uuid: String!): String!

       tokenizedCreateTest(tokenized: String!): String!
       tokenizedUpdateTest(tokenized: String!): String!
       tokenizedDeleteTest(tokenized: String!): String!

      exportsTest: Buffer
   }
`;
