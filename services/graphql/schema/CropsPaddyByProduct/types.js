const CropsPaddyByProduct = `
   scalar JSON

   type CropsPaddyByProduct {
      id: String!
      uuid: String!
      typeOfByProductId: String!

      typeOfByProduct: String
      price: Float

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [CropsPaddyByProduct];
exports.rootTypes = `
   type Query {
      allCropsPaddyByProducts: [CropsPaddyByProduct]
      tokenizedAllCropsPaddyByProducts: String!
   }

   type Mutation {
      createCropsPaddyByProduct(       
        typeOfByProduct: String
        price: Float
      ): String!
      updateCropsPaddyByProduct(
        uuid: String!
        typeOfByProduct: String
        price: Float
      ): String!
      deleteCropsPaddyByProduct(uuid: String!): String!
      exportsCropsPaddyByProduct: Buffer

       tokenizedCreateCropsPaddyByProduct(tokenized: String!): String!
       tokenizedUpdateCropsPaddyByProduct(tokenized: String!): String!
       tokenizedDeleteCropsPaddyByProduct(tokenized: String!): String!
   }
`;
