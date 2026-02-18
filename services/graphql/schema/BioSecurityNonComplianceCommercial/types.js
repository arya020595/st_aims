const BioSecurityNonComplianceCommercial = `
   scalar JSON

   type BioSecurityNonComplianceCommercial {
      id: String!
      uuid: String!
      
      pointOfEntry: String #This is control post
      district: String
      entryDate: String

      staffName: String
      companyUUID: String

      nonComplienceUUID: [String]
      permitNumber: String
      healthCertificateNumber: String

      countryUUID: String

      remarks: String

      takenActionUUID: String
      nosReferenceNumber: String
      actionByEnforcement: String

      Country: BioSecurityCountry
      Company: BioSecurityCompanyProfile
      TakenAction: BioSecurityTakenAction

      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecurityNonComplianceCommercial];
exports.rootTypes = `
   type Query {
      allBioSecurityNonComplianceCommercials(monthYear: String): [BioSecurityNonComplianceCommercial]
      getNonComplianceNotifications: Int
      tokenizedAllBioSecurityNonComplianceCommercials(monthYear: String): String!
   }

   type Mutation {
      createBioSecurityNonComplianceCommercial(
        district: String
        pointOfEntry: String #This is control post
        entryDate: String

        staffName: String
        companyUUID: String

        nonComplienceUUID: [String]
        permitNumber: String
        healthCertificateNumber: String

        countryUUID: String

        remarks: String

        takenActionUUID: String
        nosReferenceNumber: String
        actionByEnforcement: String
      ): String!
      updateBioSecurityNonComplianceCommercial(
        uuid: String!
        name: String    
        pointOfEntry: String #This is control post
        district: String
        entryDate: String

        staffName: String
        companyUUID: String

        nonComplienceUUID: [String]
        permitNumber: String
        healthCertificateNumber: String

        countryUUID: String

        remarks: String

        takenActionUUID: String
        nosReferenceNumber: String
        actionByEnforcement: String
      ): String!
      deleteBioSecurityNonComplianceCommercial(uuid: String!): String!
      exportBioSecurityNonComplianceCommercial(
         monthYear: String!
         pointOfEntry: String
         staffName: String
         companyRegNo: String
         companyUUID: String
         companyOwnerName: String
         icNo: String
         permitNumber: String
         countryUUID: String
      ): String

      tokenizedCreateBioSecurityNonComplianceCommercial(tokenized: String!): String!
      tokenizedUpdateBioSecurityNonComplianceCommercial(tokenized: String!): String!
      tokenizedDeleteBioSecurityNonComplianceCommercial(tokenized: String!): String!
   }
`;
