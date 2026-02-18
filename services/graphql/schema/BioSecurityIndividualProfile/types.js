const BioSecurityIndividualProfile = `
   scalar JSON
   scalar Buffer

   type BioSecurityIndividualProfile {
      id: String!
      uuid: String!
      icNo: String!
      name: String
      contactNumber: String!
      address: String!

      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecurityIndividualProfile];
exports.rootTypes = `
   type Query {
      allBioSecurityIndividualProfiles: [BioSecurityIndividualProfile]

      getBioSecurirtyIndividualProfileByIcNo(icNo: String!): BioSecurityIndividualProfile
      tokenizedAllBioSecurityIndividualProfiles: String!
      tokenizedGetBioSecurirtyIndividualProfileByIcNo(tokenizedParams: String!): String!
   }

   type Mutation {
      createBioSecurityIndividualProfile(
        icNo: String!
        name: String!
        contactNumber: String!
        address: String!
      ): String!
      updateBioSecurityIndividualProfile(
        uuid: String!
        icNo: String
        name: String
        contactNumber: String
        address: String
      ): String!
      deleteBioSecurityIndividualProfile(uuid: String!): String!
      exportBioSecurityIndividualProfile: Buffer

      tokenizedCreateBioSecurityIndividualProfile(tokenized: String!): String!
      tokenizedUpdateBioSecurityIndividualProfile(tokenized: String!): String!
      tokenizedDeleteBioSecurityIndividualProfile(tokenized: String!): String!

   }
`;
