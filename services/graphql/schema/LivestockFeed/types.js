const LivestockFeed = `
   scalar JSON

   type LivestockFeed {
      id: String!
      uuid: String!
      monthYear: String!

      supplierUUID: String!
      supplierName: String!

      livestockUUID: String
      typeOfLiveStock: String

      livestockFeedCategoryUUID: String
      livestockFeedCategory: String
      
      livestockFeedCode: String!
      customerName: String
      customerUUID: String

      
      quantityKg: Float!
      quantityMt: Float!
      price50Kg: Float!
      priceKg: Float!
      totalValue: Float!
      

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [LivestockFeed];
exports.rootTypes = `
   type Query {
      allLivestockFeeds(monthYear: String!): [LivestockFeed]
      tokenizedAllLivestockFeeds(
         monthYear: String!
         pageIndex: Int
         pageSize: Int
         filters: String
      ): String!
      countAllLivestockFeeds(monthYear: String!, filters: String): Int!
      
   }

   type Mutation {
      createLivestockFeed(
        monthYear: String!

        supplierUUID: String!
        supplierName: String!

        livestockUUID: String
        typeOfLiveStock: String

        livestockFeedCategoryUUID: String
        livestockFeedCategory: String
        
        livestockFeedCode: String!
        customerName: String
        customerUUID: String
        quantityKg: Float!
        quantityMt: Float!
        price50Kg: Float!
        priceKg: Float!
        totalValue: Float!

      ): String!
      updateLivestockFeed(
        uuid: String!
        monthYear: String

        supplierUUID: String
        supplierName: String

        livestockUUID: String
        typeOfLiveStock: String

        livestockFeedCategoryUUID: String
        livestockFeedCategory: String
        
        livestockFeedCode: String
        customerName: String
        customerUUID: String
        quantityKg: Float
        quantityMt: Float
        price50Kg: Float
        priceKg: Float
        totalValue: Float
      ): String!
      deleteLivestockFeed(uuid: String!): String!
      exportLivestockFeed(
         monthYear: String!
         livestockUUID: String
         livestockFeedCategoryUUID: String
         livestockFeedCode: String
         customerUUID: String
      ): String!

      tokenizedCreateLivestockFeed(tokenized: String!): String!
      tokenizedUpdateLivestockFeed(tokenized: String!): String!
      tokenizedDeleteLivestockFeed(tokenized: String!): String!

   }
`;
