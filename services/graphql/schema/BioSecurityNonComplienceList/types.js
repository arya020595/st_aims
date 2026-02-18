const BioSecurityNonComplienceList = `
   scalar JSON

   type BioSecurityNonComplienceList {
      id: String!
      uuid: String!
    
      date: String
      Company: BioSecurityCompanyProfile
      officer: String
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecurityNonComplienceList];
exports.rootTypes = `
   type Query {
      allBioSecurityNonComplienceLists(
        companyProfileUUID: String
        individualProfileUUID: String
      ): [BioSecurityNonComplienceList]
   }

   
`;
