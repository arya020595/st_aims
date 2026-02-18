const ProductCatalogueDetails = `
   scalar JSON

   type PriceLists {
      uuid: String,
      price: Float
   }
   type ProductCatalogueDetails {
      id: String!
      uuid: String!
      productCatalogueUUID: String
    
      companyUUID: String
      companyName: String

      productCategoryUUID: String
      productCategory: String

      productSubCategoryUUID: String
      productSubCategory: String

      name: String
      code: String
      weight: Float
      
      unitUUD: String
      unit: String


      price: Float
      priceLists: [PriceLists]
      rawMaterial: String

      productImageUrl: String
    
      createdAt: String
      updatedAt: String
   }

      
`;
exports.customTypes = [ProductCatalogueDetails];
exports.rootTypes = `


   input FilterCriteria {
      companyUUID: String
      productCategoryUUID: String
      productSubCategoryUUID: String
   }

   input PriceListsInput {
      uuid: String,
      price: Float  
   }

   type Query {
      allProductCatalogueDetails(productCatalogueUUID: String): [ProductCatalogueDetails]
      allProductCatalogueDetailsByCompany(companyUUID: String!): [ProductCatalogueDetails]

      productCatalogueDetailsWithFilters(filter: FilterCriteria): [ProductCatalogueDetails]
      countProductCatalogueDetails: Int

      tokenizedAllProductCatalogueDetails(tokenizedParamsCat: String!): String!
      tokenizedAllProductCatalogueDetailsByCompany(tokenizedParams: String!): String!
      tokenizedProductCatalogueDetailsWithFilters(tokenizedParams: String!): String!
   }

   type Mutation {
      createProductCatalogueDetails(
        productCatalogueUUID: String
        companyUUID: String
        companyName: String
  
        productCategoryUUID: String
        productCategory: String
  
        productSubCategoryUUID: String
        productSubCategory: String
  
        name: String
        code: String
        weight: Float

        unitUUD: String
        unit: String

        price: Float

        priceLists: [PriceListsInput]
        rawMaterial: String
  
        productImageUrl: String
      ): String!
      updateProductCatalogueDetails(
        uuid: String!, 
        productCatalogueUUID: String
        companyUUID: String
        companyName: String

        productCategoryUUID: String
        productCategory: String

        productSubCategoryUUID: String
        productSubCategory: String

        name: String
        code: String
        weight: Float

        unitUUD: String
        unit: String
        rawMaterial: String
        
        price: Float
        priceLists: [PriceListsInput]

        productImageUrl: String
      ): String!
      deleteProductCatalogueDetails(uuid: String!): String!
      exportsProductCatalogueDetails(
         productCatalogueUUID: String!
      ): String!

      tokenizedCreateProductCatalogueDetails(tokenized: String!): String!
      tokenizedUpdateProductCatalogueDetails(tokenized: String!): String!
      tokenizedDeleteProductCatalogueDetails(tokenized: String!): String!

      generateProductCatalogueDetails(
         companyUUID: String!
         productCatalogueUUID: String!
         productCategoryUUID: String!
         productSubCategoryUUID: String!
         unitUUID: String!

         dataWouldInserted: Int!
      ): String!

      resyncProductCodeCatalogueDetails(productCatalogueUUID: String!): String
   }
`;
