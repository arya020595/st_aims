const BioSecurityNonComplianceCommercialDraft = `
   scalar JSON

   type BioSecurityNonComplianceCommercialDraft {
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

      syncStatus: String!

      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [BioSecurityNonComplianceCommercialDraft];
exports.rootTypes = `
   type Query {
      allBioSecurityNonComplianceCommercialsDraft(monthYear: String): [BioSecurityNonComplianceCommercialDraft]
      getNonComplianceNotifications: Int
      tokenizedAllBioSecurityNonComplianceCommercialsDraft(monthYear: String): String!
   }

   type Mutation {
      createBioSecurityNonComplianceCommercialDraft(
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
      updateBioSecurityNonComplianceCommercialDraft(
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
      deleteBioSecurityNonComplianceCommercialDraft(uuid: String!): String!
      exportBioSecurityNonComplianceCommercialDraft(
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

      tokenizedCreateBioSecurityNonComplianceCommercialDraft(tokenized: String!): String!
      tokenizedUpdateBioSecurityNonComplianceCommercialDraft(tokenized: String!): String!
      tokenizedDeleteBioSecurityNonComplianceCommercialDraft(tokenized: String!): String!

      syncNonComplianceCommercialDraft: String
   }
`;
