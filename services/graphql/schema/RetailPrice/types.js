const RetailPrice = `
  type RetailPrice {
    id: String!
    uuid: String!
    monthYear: String!

    FarmLocation: FarmLocation
    month: String
    year: Int

    livestockCommodityUUID: String
    livestockCommodityDetailUUID: String
    
    LivestockCommodity: LivestockCommodity
    LivestockCommodityDetail: LivestockCommodityDetail

    price: Int

    bruneiMuaraPrice: Float
    tutongPrice: Float
    belaitPrice: Float
    temburongPrice: Float


    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [RetailPrice];
exports.rootTypes = `
  type Query {
    allRetailPrices(monthYear: String): [RetailPrice]
    tokenizedAllRetailPrices(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String!
    countAllRetailPrices(monthYear: String!, filters: String): Int!
  }

  type Mutation {
     createRetailPrice(
      farmLocationUUID: String
      
      livestockCommodityUUID: String
      livestockCommodityDetailUUID: String

      monthYear: String!
      price: Int

      bruneiMuaraPrice: Float
      tutongPrice: Float
      belaitPrice: Float
      temburongPrice: Float
  
      

     ): String!
      updateRetailPrice(
        uuid: String!,
        farmLocationUUID: String
        
        livestockCommodityUUID: String
        livestockCommodityDetailUUID: String
        monthYear: String
        
        price: Int

        bruneiMuaraPrice: Float
        tutongPrice: Float
        belaitPrice: Float
        temburongPrice: Float
    

        ): String!
      deleteRetailPrice(uuid: String!): String!
      exportLivestockRetailPrice(
        monthYear: String!
        livestockCommodityUUID: String
        livestockCommodityDetailUUID: String
      ): String

      tokenizedCreateRetailPrice(tokenized: String!): String!
      tokenizedUpdateRetailPrice(tokenized: String!): String!
      tokenizedDeleteRetailPrice(tokenized: String!): String!

      tokenizedCheckDuplicateRetailPrice(tokenized: String!): String
      importRetailPriceLivestock(
        excelBase64: String!
        year: Int!
        month: Int!
        fileName: String!
     ): String!

     generateRetailPriceLivestock: String
     tokenizedCreateManyRetailPrice(tokenized: String!): String!
  }
`;
