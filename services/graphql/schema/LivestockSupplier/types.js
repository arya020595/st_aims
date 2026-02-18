const LivestockSupplier = `
   scalar JSON

   type LivestockSupplier {
      id: String!
      uuid: String!
      code: String
      supplierName: String!
      createdAt: String!
      updatedAt: String!
   }
`;
exports.customTypes = [LivestockSupplier];
exports.rootTypes = `
   type Query {
      allLivestockSuppliers: [LivestockSupplier]
      tokenizedAllLiveStockSuppliers: String!
   }

   type Mutation {
      createLivestockSupplier(code: String, supplierName: String!): String!
      updateLivestockSupplier(uuid: String!, code: String, supplierName: String): String!
      deleteLivestockSupplier(uuid: String!): String!

      ####### TOKENIZED ######
      createLivestockSupplierTokenized(tokenized: String!): String!
      updateLivestockSupplierTokenized(tokenized: String!): String!
      deleteLivestockSupplierTokenized(tokenized: String!): String!
   }
`;
