const SEFIRental = `
   scalar JSON

   type SEFIRental {
      id: String!
      uuid: String!

      startDate: String
      endDate: String
    
      companyUUID: String
      companyName: String

      productCatalogueDetailsUUID: String
      productCatalogueDetailsName: String

      durationOfRental: Int
      quantity: Float
      price: Float
      totalValueProduced: Float

      sefiMachineryIds: [String]

      paymentReceiptNo: String
    
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [SEFIRental];
exports.rootTypes = `
   type Query {
      allSEFIRentals(startDate: String, endDate: String): [SEFIRental]
      tokenizedAllSEFIRentals(
         startDate: String
         endDate: String
         pageIndex: Int
         pageSize: Int
         filters: String
         ): String!
      countAllSEFIRentals(startDate: String, endDate: String, filters: String): Int! 
   }

   type Mutation {
      createSEFIRental(
        startDate: String
        endDate: String
        companyUUID: String
        companyName: String
        productCatalogueDetailsUUID: String
        productCatalogueDetailsName: String
        durationOfRental: Int
        quantity: Float
        price: Float
        totalValueProduced: Float
        sefiMachineryIds: [String]
        paymentReceiptNo: String
      ): String!
      updateSEFIRental(
        uuid: String!, 
        startDate: String
        endDate: String
        companyUUID: String
        companyName: String
        productCatalogueDetailsUUID: String
        productCatalogueDetailsName: String
        durationOfRental: Int
        quantity: Float
        price: Float
        totalValueProduced: Float
        sefiMachineryIds: [String]
        paymentReceiptNo: String
      ): String!
      deleteSEFIRental(uuid: String!): String!
      exportSEFIRental(
         startDate: String
         endDate: String
         companyUUID: String
         productName: String
      ): String

      tokenizedCreateSEFIRental(tokenized: String!): String!
      tokenizedUpdateSEFIRental(tokenized: String!): String!
      tokenizedDeleteSEFIRental(tokenized: String!): String!
   }
`;
