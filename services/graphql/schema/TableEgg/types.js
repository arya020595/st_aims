const TableEgg = `
  type TableEgg {
    id: String!
    uuid: String!

    date: String!
    FarmerProfile: FarmerProfile
    FarmLocation: FarmLocation

    farmerUUID: String!
    farmerCompanyName: String!

    farmAreaId: String!
    farmProfileArea: String

    typeOfBreed: [String]!
    feedSource: String!
    totalNoOfLayer: Int!
    totalEggs: Int!

    remark: String
    

    createdAt: String!
    updatedAt: String!
  }
`;
exports.customTypes = [TableEgg];
exports.rootTypes = `
  type Query {
    allTableEggs(monthYear: String): [TableEgg]
    tokenizedAllTableEggs(
      monthYear: String!
      pageIndex: Int
      pageSize: Int
      filters: String
    ): String!
    countAllTableEggs(monthYear: String!, filters: String): Int!
  }

  type Mutation {
     createTableEgg(
      date: String!
      farmerUUID: String!
      farmerCompanyName: String!

      farmAreaId: String!
      farmProfileArea: String
      typeOfBreed: [String]!
      feedSource: String!
      totalNoOfLayer: Int!
      totalEggs: Int!
      

     ): String!
      updateTableEgg(
        uuid: String!,
        date: String 
        farmerUUID: String
        farmerCompanyName: String

        farmAreaId: String
        farmProfileArea: String
        typeOfBreed: [String]
        feedSource: String
        totalNoOfLayer: Int
        totalEggs: Int
        

        ): String!
      deleteTableEgg(uuid: String!): String!
      exportTableEgg(
        monthYear: String!
        farmerUUID: String
        farmAreaId: String
        ): String!

      tokenizedCreateTableEgg(tokenized: String!): String!
      tokenizedUpdateTableEgg(tokenized: String!): String!
      tokenizedDeleteTableEgg(tokenized: String!): String!
  }
`;
