const BioSecurityCompanyProfile = `
   scalar JSON
   scalar Buffer

   type BioSecurityCompanyProfileNonComplienceDetails {
      uuid: String
      date: String
      inputByOfficer: JSON
   }
   type BioSecurityCompanyProfile {
      id: String!
      uuid: String!
      
      status: String
      companyId: String
      companyRegNo: String
      companyCropRegNo: String
      companyAnimalRegNo: String

      registrationNumber: String
      
      companyRegDate: String

      companyCropRegDate: String
      companyAnimalRegDate: String

      companyCropRenewalDate: String
      companyAnimalRenewalDate: String

      companyName: String
      companyOwnerName: String
      icNo: String
      contactDetails: String
      companyAddress: String
      otherAddress: String

      approvedSuppliers: String
      approvedSupplirersAddress: String

      typeOfComodityIds: [String]
      
      uploadFile: String

      nonComplienceDetails: [BioSecurityNonComplienceList]

      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecurityCompanyProfile];
exports.rootTypes = `
   type Query {
      allBioSecurityCompanyProfiles: [BioSecurityCompanyProfile]
      countBioSecurityCompanyProfiles(filters: String): Int
      getBioSecurityCompanyProfilesByCompanyRegNo(companyRegNo: String!, type: String!): BioSecurityCompanyProfile
      getBioSecurityCompanyProfilesByUUID(uuid: String!): BioSecurityCompanyProfile
      tokenizedAllBioSecurityCompanyProfiles: String!
      tokenizedGetBioSecurityCompanyProfilesByCompanyRegNo(tokenizedParams: String!): String!
      tokenizedAllBioSecurityCompanyProfilesPaginated(
         pageIndex: Int,
         pageSize: Int, 
         filters: String,
      ): String

      searchAllBioSecurityCompanyProfiles(name: String): String!
   }

   type Mutation {
      createBioSecurityCompanyProfile(
        input: JSON      
      ): String!
      updateBioSecurityCompanyProfile(
        uuid: String!
        input: JSON      
      ): String!
      deleteBioSecurityCompanyProfile(uuid: String!): String!
      exportBioSecurityCompanyProfile: Buffer

      tokenizedCreateBioSecurityCompanyProfile(input: JSON): String!
      tokenizedUpdateBioSecurityCompanyProfile(input: JSON): String!
      tokenizedDeleteBioSecurityCompanyProfile(tokenized: String!): String!
   }
`;
