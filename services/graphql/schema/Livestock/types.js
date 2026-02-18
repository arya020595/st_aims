const Livestock = `
   type Livestock {
      id: String!
      uuid: String!
      LivestockCategory: LivestockCategory
      typeOfLiveStock: String
      
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [Livestock];
exports.rootTypes = `
   type Query {
      allLiveStocks: [Livestock]
      allLiveStocksBySupplierOnAnimalFeed(supplierId: String!): [Livestock]
      tokenizedAllLiveStock: String
      tokenizedAllLiveStocksBySupplierOnAnimalFeed(tokenizedParams: String!): String!
   }

   type Mutation {
      createLiveStock(
        #livestockCategoryId: String!
        #typeOfLiveStock: String!
        tokenized: String!
      ): String!

      updateLiveStock(
         #uuid: String!
         #livestockCategoryId: String!
         #typeOfLiveStock: String
         tokenized: String!
      ): String!

      deleteLiveStock(
         #uuid: String!
         tokenized: String!
      ): String

      exportLivestock: Buffer
   }
`;
