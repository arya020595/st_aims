const BioSecurityNonCompliancePersonalConcession = `
   scalar JSON

   type BioSecurityNonCompliancePersonalConcession {
      id: String!
      uuid: String!
      
      pointOfEntry: String #This is control post
      district: String
      entryDate: String

      staffName: String
      name: String
      icNo: String
      address: String
      contactDetails: String

      nonComplienceUUID: [String]
      permitNumber: String
      healthCertificateNumber: String

      countryUUID: String

      remarks: String

      takenActionUUID: String
      nosReferenceNumber: String
      actionByEnforcement: String

      Country: BioSecurityCountry
      IndividualProfile: BioSecurityIndividualProfile
      TakenAction: BioSecurityTakenAction

      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecurityNonCompliancePersonalConcession];
exports.rootTypes = `
   type Query {
      allBioSecurityNonCompliancePersonalConcessions(monthYear: String): [BioSecurityNonCompliancePersonalConcession]
      tokenizedAllBioSecurityNonCompliancePersonalConcessions(monthYear: String!): String!
   }

   type Mutation {
      createBioSecurityNonCompliancePersonalConcession(
        district: String
        pointOfEntry: String #This is control post
        entryDate: String

        staffName: String
        name: String
        icNo: String
        address: String
        contactDetails: String

        nonComplienceUUID: [String]
        permitNumber: String
        healthCertificateNumber: String

        countryUUID: String

        remarks: String

        takenActionUUID: String
        nosReferenceNumber: String
        actionByEnforcement: String
      ): String!
      updateBioSecurityNonCompliancePersonalConcession(
        uuid: String!
        name: String
        icNo: String
        address: String
        contactDetails: String    
        pointOfEntry: String #This is control post
        district: String
        entryDate: String

        staffName: String
        name: String
        icNo: String
        address: String
        contactDetails: String

        nonComplienceUUID: [String]
        permitNumber: String
        healthCertificateNumber: String

        countryUUID: String

        remarks: String

        takenActionUUID: String
        nosReferenceNumber: String
        actionByEnforcement: String
      ): String!
      deleteBioSecurityNonCompliancePersonalConcession(uuid: String!): String!
      exportBioSecurityNonCompliancePersonalConcession(
         monthYear: String!
         pointOfEntry: String
         name: String
         icNo: String
         permitNumber: String
         countryUUID: String
         takenActionUUID: String
      ): String

      tokenizedCreateBioSecurityNonCompliancePersonalConcession(tokenized: String!): String!
      tokenizedUpdateBioSecurityNonCompliancePersonalConcession(tokenized: String!): String!
      tokenizedDeleteBioSecurityNonCompliancePersonalConcession(tokenized: String!): String!
   }
`;
