const DayOldChick = `
  type DayOldChick {
    id: String!
    uuid: String!

    date: String!
    FarmerProfile: FarmerProfile
    FarmLocation: FarmLocation

    farmerUUID: String!
    farmerCompanyName: String!

    farmAreaId: String!
    farmProfileArea: String

    totalGolden: Int!
    totalIdeal: Int!
    totalImports: Int!
    incubatedFertilizedEgg: Int!
    docProduced: Int!
    

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [DayOldChick];
exports.rootTypes = `
  type Query {
    allDayOldChicks(monthYear: String): [DayOldChick]
    tokenizedAllDayOldChicks(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String!
    countAllDayOldChicks(monthYear: String!, filters: String): Int!
  }

  type Mutation {
     createDayOldChick(
      date: String!
      farmerUUID: String!
      farmerCompanyName: String!

      farmAreaId: String!
      farmProfileArea: String
      
      totalGolden: Int!
      totalIdeal: Int!
      totalImports: Int!
      incubatedFertilizedEgg: Int!
      docProduced: Int!
      

     ): String!
      updateDayOldChick(
        uuid: String!,
        date: String 
        farmerUUID: String
        farmerCompanyName: String

        farmAreaId: String
        farmProfileArea: String
        
        totalGolden: Int
        totalIdeal: Int
        totalImports: Int
        incubatedFertilizedEgg: Int
        docProduced: Int

        ): String!
      deleteDayOldChick(uuid: String!): String!
      exportDayOldChick(
        monthYear: String!
        farmerUUID: String
        farmAreaId: String
        ): String!

        tokenizedCreateDayOldChick(tokenized: String!): String!
        tokenizedUpdateDayOldChick(tokenized: String!): String!
        tokenizedDeleteDayOldChick(tokenized: String!): String!
  }
`;
