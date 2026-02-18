const FarmerRegistrationForm = `
   scalar JSON

   type FarmerRegistrationForm {
      id: String!
      uuid: String!
      name: String!    
      icNo: String

      password: String
      defaultPassword: String

      doaaRegNo: String
      rocbnRegNo: String

      email: String
      phone: String

      status: String
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [FarmerRegistrationForm];
exports.rootTypes = `
   type Query {
      allFarmerRegistrationForms: [FarmerRegistrationForm]
      tokenizedAllFarmerRegistrationForms: String!
   }

   type Mutation {
      createFarmerRegistrationForm(
        name: String!     
        password: String
        icNo: String

        doaaRegNo: String
        rocbnRegNo: String

        email: String
        phone: String
      ): String!
      updateFarmerRegistrationForm(
        uuid: String!
        name: String    
        icNo: String 
        password: String

        doaaRegNo: String
        rocbnRegNo: String

        email: String
        phone: String
      ): String!
      deleteFarmerRegistrationForm(uuid: String!): String!

      setStatusFarmerRegistration(uuid: String!, status: String!): String!
   }
`;
