const CompanyStatus = `
   scalar JSON

   type CompanyStatus {
      id: String!
      uuid: String!
      description: String!     
      descriptionMalay: String!
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CompanyStatus];
exports.rootTypes = `
   type Query {
      allCompanyStatuses: [CompanyStatus]
      tokenizedAllCompanyStatus: String!
   }

   type Mutation {
      createCompanyStatus(
        description: String!     
        descriptionMalay: String!  
      ): String!
      updateCompanyStatus(
        uuid: String!
        description: String    
        descriptionMalay: String
      ): String!
      deleteCompanyStatus(uuid: String!): String!
      
      ##### TOKENIZED ######
      createCompanyStatusTokenized(
         tokenized: String!
       ): String!
       updateCompanyStatusTokenized(
         tokenized: String!
       ): String!
       deleteCompanyStatusTokenized(tokenized: String!): String!
   }
`;
