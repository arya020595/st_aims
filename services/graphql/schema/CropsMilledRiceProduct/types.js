const CropsMilledRiceProduct = `
   scalar JSON

   type CropsMilledRiceProduct {
      id: String!
      uuid: String!
      typeOfProductId: String!

      typeOfProduct: String
      price: Float

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CropsMilledRiceProduct];
exports.rootTypes = `
   type Query {
      allCropsMilledRiceProducts: [CropsMilledRiceProduct]
      tokenizedAllCropsMilledRiceProducts: String!
   }

   type Mutation {
      createCropsMilledRiceProduct(       
        typeOfProduct: String
        price: Float
      ): String!
      updateCropsMilledRiceProduct(
        uuid: String!
        typeOfProduct: String
        price: Float
      ): String!
      deleteCropsMilledRiceProduct(uuid: String!): String!
   }
`;
