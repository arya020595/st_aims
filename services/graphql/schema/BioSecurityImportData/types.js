const BioSecurityImportData = `
  scalar JSON

  type BioSecurityImportData {
    id: String!
    uuid: String!

    pointOfEntry: String! #this is control post
    entryDate: String!

    companyUUID: String

    permitNumber: String
    healthCertificateNumber: String

    Company: BioSecurityCompanyProfile
    Country: BioSecurityCountry
    TypeOfComodity: BioSecurityTypeOfComodity
    ComodityDetail: BioSecurityTypeOfComodityDetail
    
    quantity: Float
    cif: Float

    district: String!

    createdAt: String
    updatedAt: String
  }
`;
exports.customTypes = [BioSecurityImportData];
exports.rootTypes = `
   type Query {
    allBioSecurityImportData(monthYear: String): [BioSecurityImportData]
    tokenizedAllBioSecurityImportData(monthYear: String): String!
    tokenizedAllBioSecurityImportDataPaginated(
      monthYear: String
      pageIndex: Int,
      pageSize: Int, 
      filters: String,
    ): String!

    countBioSecurityImportData(monthYear: String, filters: String): Int
   }

   type Mutation {
      createBioSecurityImportData(
        pointOfEntry: String! #this is control post
        entryDate: String!
    
        companyUUID: String
    
        permitNumber: String
        healthCertificateNumber: String
    
        countryUUID: String
        typeOfComodityUUID: String
        comodityDetailUUID: String
        
        quantity: Float
        cif: Float
    
        district: String!

      ): String!
      updateBioSecurityImportData(
        uuid: String!
        pointOfEntry: String! #this is control post
        entryDate: String!
    
        companyUUID: String
    
        permitNumber: String
        healthCertificateNumber: String
    
        countryUUID: String
        typeOfComodityUUID: String
        comodityDetailUUID: String
        
        quantity: Float
        cif: Float
    
        district: String!
      ): String!
      deleteBioSecurityImportData(uuid: String!): String!
      exportBioSecurityImportData(
        monthYear: String!
        pointOfEntry: String
        companyRegNo: String
        companyUUID: String
        permitNumber: String
        countryUUID: String
        ): String

        tokenizedCreateBioSecurityImportData(tokenized: String!): String!
        tokenizedUpdateBioSecurityImportData(tokenized: String!): String!
        tokenizedDeleteBioSecurityImportData(tokenized: String!): String!
   }
`;
