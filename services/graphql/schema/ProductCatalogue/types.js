const ProductCatalogue = `
   scalar JSON

   type ProductCatalogue {
      id: String!
      uuid: String!
      
      code: String
      companyUUID: String
      companyName: String

      productCategoryUUID: String
      productCategory: String
    
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [ProductCatalogue];
exports.rootTypes = `
   type Query {
      allProductCatalogues: [ProductCatalogue]
      tokenizedAllProductCatalogues: String!
   }

   type Mutation {
      createProductCatalogue(
         code: String

         companyUUID: String
         companyName: String

         productCategoryUUID: String
         productCategory: String
      ): String!
      updateProductCatalogue(
         uuid: String!, 

         code: String
         companyUUID: String
         companyName: String

         productCategoryUUID: String
         productCategory: String
      ): String!
      deleteProductCatalogue(uuid: String!): String!

      tokenizedCreateProductCatalogue(tokenized: String!): String!
      tokenizedUpdateProductCatalogue(tokenized: String!): String!
      tokenizedDeleteProductCatalogue(tokenized: String!): String!
   }
`;
