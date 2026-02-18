const RuminantStock = `
  type RuminantStock {
    id: String!
    uuid: String!
    date: String!

    farmerCompanyName: String!
    farmerUUID: String!

    farmAreaId: String!
    farmProfileArea: String!

    district: String!
    stockMaleKerbau: Int
    stockMaleLembu: Int
    stockMaleRusa: Int
    stockMaleBiri: Int
    stockMaleKambing: Int

    stockFemaleKerbau: Int
    stockFemaleLembu: Int
    stockFemaleRusa: Int
    stockFemaleBiri: Int
    stockFemaleKambing: Int
    
    total: Int

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [RuminantStock];
exports.rootTypes = `
  type Query {
    allRuminantStocks(monthYear: String): [RuminantStock]
    tokenizedAllRuminantStocks(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String!
    countAllRuminantStock(monthYear: String!, filters: String): Int! 
  }

  type Mutation {
    createRuminantStock(
      date: String!

      farmerCompanyName: String!
      farmerUUID: String!

      farmAreaId: String!
      farmProfileArea: String!

      district: String!
      stockMaleKerbau: Int
      stockMaleLembu: Int
      stockMaleRusa: Int
      stockMaleBiri: Int
      stockMaleKambing: Int

      stockFemaleKerbau: Int
      stockFemaleLembu: Int
      stockFemaleRusa: Int
      stockFemaleBiri: Int
      stockFemaleKambing: Int
      
      total: Int
    ): String!

    updateRuminantStock(
      uuid: String!
      date: String
      farmerCompanyName: String
      farmerUUID: String

      farmAreaId: String
      farmProfileArea: String
      
      district: String
      stockMaleKerbau: Int
      stockMaleLembu: Int
      stockMaleRusa: Int
      stockMaleBiri: Int
      stockMaleKambing: Int

      stockFemaleKerbau: Int
      stockFemaleLembu: Int
      stockFemaleRusa: Int
      stockFemaleBiri: Int
      stockFemaleKambing: Int
      total: Int
    ): String!

    deleteRuminantStock(
      uuid: String!
    ): String!

    exportRuminantStockExcel(
      monthYear: String!
      farmerUUID: String
      farmAreaId: String
      district: String
      ): String!

      tokenizedCreateRuminantStock(tokenized: String!): String!
      tokenizedUpdateRuminantStock(tokenized: String!): String!
      tokenizedDeleteRuminantStock(tokenized: String!): String!
  }
`;
