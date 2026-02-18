const TypeCompanyReg = `
   scalar JSON

   type TypeCompanyReg {
      id: String!
      uuid: String!
      typesOfCompany: String!
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [TypeCompanyReg];
exports.rootTypes = `
   type Query {
      allTypeCompanyRegs: [TypeCompanyReg]
      tokenizedAllTypeCompanyRegs: String!
   }

   type Mutation {
      createTypeCompanyReg(typesOfCompany: String!): String!
      updateTypeCompanyReg(uuid: String!, typesOfCompany: String): String!
      deleteTypeCompanyReg(uuid: String!): String!

      tokenizedCreateTypeCompanyReg(tokenized: String!): String!
      tokenizedUpdateTypeCompanyReg(tokenized: String!): String!
      tokenizedDeleteTypeCompanyReg(tokenized: String!): String!
   }
`;
