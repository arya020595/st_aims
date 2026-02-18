const LivestockCommodity = `
   scalar JSON

   type LivestockCommodity {
      id: String!
      uuid: String!
      name: String!
      description: String

      countCommodityDetails: Int
      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [LivestockCommodity];
exports.rootTypes = `
   type Query {
      allLivestockCommodities: [LivestockCommodity]
      tokenizedAllLivestockCommodities: String
      searchLiveStockCommodities(name: String): String
   }

   type Mutation {
      createLivestockCommodity(name: String!, description: String): String!
      updateLivestockCommodity(uuid: String!, name: String description: String): String!
      deleteLivestockCommodity(uuid: String!): String!

      createLivestockCommodityTokenized(tokenized: String!): String!
      updateLivestockCommodityTokenized(tokenized: String!): String!
      deleteLivestockCommodityTokenized(tokenized: String!): String!

      exportLivestockCommodity: Buffer
   }
`;
