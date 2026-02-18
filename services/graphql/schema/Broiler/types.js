const Broilers = `
  type MortalityList {
    day: Int
    total: Int
  }
  type MortalityObj {
    listMortalities: [MortalityList]
  }

  type Broilers {
    id: String!
    uuid: String!

    farmerUUID: String!
    farmerCompanyName: String!

    farmAreaId: String!
    farmProfileArea: String
    
    poultryHouseId: String!
    poultryHouseNo: String!

    cycleNo: Int!
    dateEntry: String!
    noDocEntry: String
    docSource: String
    chickenBreed: String
    feedSource: String

    Mortality: MortalityObj
    productionDate: String


    total: Int!
    production: Int

    remark: String

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [Broilers];
exports.rootTypes = `
  scalar Buffer
  type Query {
    allBroilers(monthYear: String): [Broilers]
    tokenizedAllBroilers(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String!
    countAllBroilers(monthYear: String!, filters: String): Int!
  }
  
  input MortalityListInput {
    day: Int
    total: Int
  } 
  input MortalityObjInput  {
    listMortalities: [MortalityListInput]
  }

  type Mutation {
    createBroiler(
      
      farmerUUID: String!
      farmerCompanyName: String!

      farmAreaId: String!
      farmProfileArea: String
      
      poultryHouseId: String!
      poultryHouseNo: String!

      cycleNo: Int!
      dateEntry: String!
      noDocEntry: String
      docSource: String
      chickenBreed: String
      feedSource: String

      mortalityObject: MortalityObjInput  
      productionDate: String

      total: Int!
      production: Int

    ): String!

    updateBroiler(
      uuid: String!
      farmerUUID: String
      farmerCompanyName: String

      farmAreaId: String
      farmProfileArea: String
      
      poultryHouseId: String
      poultryHouseNo: String

      cycleNo: Int
      dateEntry: String
      noDocEntry: String
      docSource: String
      chickenBreed: String
      feedSource: String

      mortalityObject: MortalityObjInput  
      productionDate: String

      total: Int
      production: Int
    ): String!

    deleteBroiler(
      uuid: String!
    ): String!

    tokenizedCreateBroiler(tokenized: String!): String!
    tokenizedUpdateBroiler(tokenized: String!): String!
    tokenizedDeleteBroiler(tokenized: String!): String!

    exportBroilerExcel(
      monthYear: String!
      farmerUUID: String
      farmAreaId: String
      ): Buffer
  }
`;
