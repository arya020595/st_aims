const LivestockCommodityDetail = `
   scalar JSON

   type LivestockCommodityDetail {
      id: String!
      uuid: String!

      livestockCommodityUUID: String
      LivestockCommodity: LivestockCommodity 
      Unit: Unit
      
      name: String
      description: String

      createdAt: String
      updatedAt: String
   }
`;
exports.customTypes = [LivestockCommodityDetail];
exports.rootTypes = `
   type Query {
      allLivestockCommodityDetails(livestockCommodityUUID: String): [LivestockCommodityDetail]
      tokenizedAllLivestockCommodityDetails(tokenizedParams: String): String!
   }

   type Mutation {
      createLivestockCommodityDetail(
        livestockCommodityUUID: String
        name: String
        description: String

        unitUUID: String
      ): String!

      updateLivestockCommodityDetail(
        uuid: String!
        livestockCommodityUUID: String
        name: String
        description: String
        unitUUID: String
      ): String!
      deleteLivestockCommodityDetail(uuid: String!): String!

       createLivestockCommodityDetailTokenized(tokenized: String!): String!
       updateLivestockCommodityDetailTokenized(tokenized: String!): String!
       deleteLivestockCommodityDetailTokenized(tokenized: String!): String!

   }
`;
