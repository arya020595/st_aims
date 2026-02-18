const AgrifoodProduction = `
   scalar JSON

   type AgrifoodProduction {
      id: String!
      uuid: String!

      monthYear: String
      companyUUID: String
      companyName: String
      premiseUUID: String
      premiseAddress: String
      productCategoryUUID: String
      productCategory: String
      productSubCategoryUUID: String
      productSubCategory: String

      productCatalogueUUID: String
      productName: String

      pricePerUnit: Float
      netWeight: Float
      actualUnit: Float
      quantity: Float
      percentageExported: Float
      valueProduced: Float

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [AgrifoodProduction];
exports.rootTypes = `
   type Query {
      allAgrifoodProductions(monthYear: String): [AgrifoodProduction]
      tokenizedAllAgrifoodProductions(monthYear: String): String!
      countAllAgrifoodProductions(monthYear: String!, filters: String): Int!
      tokenizedAllAgrifoodProductionsPaginated(
         monthYear: String
         pageIndex: Int
         pageSize: Int
         filters: String
      ): String!
   }

   input AgrifoodProductionTemplate {
      productCategoryUUID: String
      productSubCategoryUUID: String
      productCatalogueUUID: String
      pricePerUnit: Float
      totalRecordWillGenrate: Int
   }

   type Mutation {
      createAgrifoodProduction(
        monthYear: String
        companyUUID: String
        companyName: String
        premiseUUID: String
        premiseAddress: String
        productCategoryUUID: String
        productCategory: String
        productSubCategoryUUID: String
        productSubCategory: String

        productCatalogueUUID: String
        productName: String

        pricePerUnit: Float
        netWeight: Float
        actualUnit: Float
        quantity: Float
        percentageExported: Float
        valueProduced: Float
      ): String!

      updateAgrifoodProduction(
        uuid: String!
        monthYear: String
        companyUUID: String
        companyName: String
        premiseUUID: String
        premiseAddress: String
        productCategoryUUID: String
        productCategory: String
        productSubCategoryUUID: String
        productSubCategory: String

        productCatalogueUUID: String
        productName: String

        pricePerUnit: Float
        netWeight: Float
        actualUnit: Float
        quantity: Float
        percentageExported: Float
        valueProduced: Float
      ): String!
      deleteAgrifoodProduction(uuid: String!): String!
      exportAgrifoodProduction(
         monthYear: String!
         companyUUID: String
         productCategoryUUID: String
         productSubCategoryUUID: String
         productName: String
         ): String

      tokenizedCreateAgrifoodProduction(tokenized: String!): String!
      tokenizedUpdateAgrifoodProduction(tokenized: String!): String!
      tokenizedDeleteAgrifoodProduction(tokenized: String!): String!

      generateAgrifoodProductionTemplate(
         companyUUID: String
         premiseUUID: String
         recordGenerate: [AgrifoodProductionTemplate]
      ): String

      tokenizedCreateManyAgrifoodProduction(tokenized: String!): String!
   }
`;
