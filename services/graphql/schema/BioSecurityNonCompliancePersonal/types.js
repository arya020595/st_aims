const BioSecurityNonCompliancePersonal = `
   scalar JSON

   type BioSecurityNonCompliancePersonal {
      id: String!
      uuid: String!
      
      pointOfEntry: String #This is control post
      district: String
      entryDate: String

      staffName: String
      individualProfileUUID: String

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
exports.customTypes = [BioSecurityNonCompliancePersonal];
exports.rootTypes = `
   type Query {
      allBioSecurityNonCompliancePersonals(monthYear: String): [BioSecurityNonCompliancePersonal]
      getNonComplianceNotifications: Int
      tokenizedAllBioSecurityNonCompliancePersonals(monthYear: String): String!
   }

   type Mutation {
      createBioSecurityNonCompliancePersonal(
        district: String
        pointOfEntry: String #This is control post
        entryDate: String

        staffName: String
        individualProfileUUID: String

        nonComplienceUUID: [String]
        permitNumber: String
        healthCertificateNumber: String

        countryUUID: String

        remarks: String

        takenActionUUID: String
        nosReferenceNumber: String
        actionByEnforcement: String
      ): String!
      updateBioSecurityNonCompliancePersonal(
        uuid: String!
        name: String    
        pointOfEntry: String #This is control post
        district: String
        entryDate: String

        staffName: String
        individualProfileUUID: String

        nonComplienceUUID: [String]
        permitNumber: String
        healthCertificateNumber: String

        countryUUID: String

        remarks: String

        takenActionUUID: String
        nosReferenceNumber: String
        actionByEnforcement: String
      ): String!
      deleteBioSecurityNonCompliancePersonal(uuid: String!): String!
      exportBioSecurityNonCompliancePersonal(
         monthYear: String!
         pointOfEntry: String
         personalName: String
         icNo: String
         permitNumber: String
         countryUUID: String
         takenActionUUID: String
      ): String

      tokenizedCreateBioSecurityNonCompliancePersonal(tokenized: String!): String!
      tokenizedUpdateBioSecurityNonCompliancePersonal(tokenized: String!): String!
      tokenizedDeleteBioSecurityNonCompliancePersonal(tokenized: String!): String!
   }
`;
